create table if not exists public.entity_services (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'business',
    'restaurant',
    'accommodation',
    'attraction',
    'utility',
    'emergency_contact',
    'health_facility'
  )),
  entity_id uuid not null,
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer,
  duration_min integer,
  requirements text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.entity_faqs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'business',
    'restaurant',
    'accommodation',
    'attraction',
    'utility',
    'emergency_contact',
    'health_facility'
  )),
  entity_id uuid not null,
  city_id uuid not null references public.cities(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists trg_entity_services_updated on public.entity_services;
create trigger trg_entity_services_updated
before update on public.entity_services
for each row execute function public.set_updated_at();

drop trigger if exists trg_entity_faqs_updated on public.entity_faqs;
create trigger trg_entity_faqs_updated
before update on public.entity_faqs
for each row execute function public.set_updated_at();

create index if not exists idx_entity_services_lookup
on public.entity_services(city_id, entity_type, entity_id)
where active;

create unique index if not exists uq_entity_services_name
on public.entity_services(entity_type, entity_id, name);

create index if not exists idx_entity_faqs_lookup
on public.entity_faqs(city_id, entity_type, entity_id)
where active;

create unique index if not exists uq_entity_faqs_question
on public.entity_faqs(entity_type, entity_id, question);

alter table public.businesses
  add column if not exists attributes jsonb not null default '{}'::jsonb;

alter table public.restaurants
  add column if not exists attributes jsonb not null default '{}'::jsonb;

alter table public.accommodations
  add column if not exists attributes jsonb not null default '{}'::jsonb;

alter table public.attractions
  add column if not exists attributes jsonb not null default '{}'::jsonb;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'utilities'
  ) then
    alter table public.utilities add column if not exists attributes jsonb not null default '{}'::jsonb;
  end if;
end $$;

comment on column public.businesses.attributes is
  'Boolean entity attributes used by the city agent, e.g. delivery, sus, pix, cartao, parking, pet_friendly, wifi, acessivel.';
comment on column public.restaurants.attributes is
  'Boolean entity attributes used by the city agent, e.g. delivery, sus, pix, cartao, parking, pet_friendly, wifi, acessivel.';
comment on column public.accommodations.attributes is
  'Boolean entity attributes used by the city agent, e.g. delivery, sus, pix, cartao, parking, pet_friendly, wifi, acessivel.';
comment on column public.attractions.attributes is
  'Boolean entity attributes used by the city agent, e.g. delivery, sus, pix, cartao, parking, pet_friendly, wifi, acessivel.';

alter table public.entity_services enable row level security;
alter table public.entity_faqs enable row level security;

drop policy if exists "entity_services_public_read" on public.entity_services;
create policy "entity_services_public_read"
on public.entity_services for select
using (
  active
  and public.entity_is_published(entity_type, entity_id, city_id)
);

drop policy if exists "entity_services_manager_write" on public.entity_services;
create policy "entity_services_manager_write"
on public.entity_services for all
using (
  public.manages_entity(entity_type, entity_id)
  or public.is_city_admin(city_id)
)
with check (
  public.manages_entity(entity_type, entity_id)
  or public.is_city_admin(city_id)
);

drop policy if exists "entity_faqs_public_read" on public.entity_faqs;
create policy "entity_faqs_public_read"
on public.entity_faqs for select
using (
  active
  and public.entity_is_published(entity_type, entity_id, city_id)
);

drop policy if exists "entity_faqs_manager_write" on public.entity_faqs;
create policy "entity_faqs_manager_write"
on public.entity_faqs for all
using (
  public.manages_entity(entity_type, entity_id)
  or public.is_city_admin(city_id)
)
with check (
  public.manages_entity(entity_type, entity_id)
  or public.is_city_admin(city_id)
);

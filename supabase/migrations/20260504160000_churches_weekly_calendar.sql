-- ============================================================================
-- 0034 - CHURCHES: perfis reivindicáveis e calendário religioso semanal
-- ============================================================================

do $$ begin
  create type public.church_tradition as enum ('catolica', 'evangelica', 'adventista', 'outra');
exception when duplicate_object then null; end $$;

create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  slug text not null,
  name text not null,
  tradition public.church_tradition not null,
  short_description text,
  description text,
  pastor_name text,
  phone text,
  whatsapp text,
  email text,
  instagram text,
  website text,
  address text,
  district_id uuid references public.districts(id) on delete set null,
  lat double precision,
  lng double precision,
  cover_url text,
  logo_url text,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  status public.entity_status not null default 'draft',
  claimed boolean not null default false,
  featured boolean not null default false,
  verified boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (city_id, slug)
);

create table if not exists public.church_schedule_items (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete restrict,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time,
  title text not null,
  note text,
  source_status text not null default 'needs_verification'
    check (source_status in ('confirmed', 'needs_verification')),
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.church_claims (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  contact_whatsapp text,
  evidence_text text,
  evidence_url text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz default now(),
  unique (church_id, profile_id)
);

create index if not exists idx_churches_city_status
on public.churches(city_id, status, featured);

create index if not exists idx_church_schedule_city_weekday
on public.church_schedule_items(city_id, weekday, starts_at)
where active;

create unique index if not exists uq_church_schedule_weekly_slot
on public.church_schedule_items(church_id, weekday, starts_at, title);

create index if not exists idx_church_claims_status
on public.church_claims(status, created_at desc);

drop trigger if exists trg_churches_updated on public.churches;
create trigger trg_churches_updated
before update on public.churches
for each row execute function public.set_updated_at();

drop trigger if exists trg_church_schedule_items_updated on public.church_schedule_items;
create trigger trg_church_schedule_items_updated
before update on public.church_schedule_items
for each row execute function public.set_updated_at();

create or replace function public.manages_church(p_church_id uuid)
returns boolean language sql security definer stable
as $$
  select exists (
    select 1
    from public.churches c
    where c.id = p_church_id
      and (
        c.owner_profile_id = auth.uid()
        or public.manages_entity('church', c.id)
        or public.is_city_admin(c.city_id)
      )
  );
$$;

alter table public.churches enable row level security;
alter table public.church_schedule_items enable row level security;
alter table public.church_claims enable row level security;

drop policy if exists "churches_public_read" on public.churches;
create policy "churches_public_read"
on public.churches for select
using (status = 'published' or public.manages_church(id));

drop policy if exists "churches_admin_insert" on public.churches;
create policy "churches_admin_insert"
on public.churches for insert
with check (public.is_city_admin(city_id));

drop policy if exists "churches_manager_update" on public.churches;
create policy "churches_manager_update"
on public.churches for update
using (public.manages_church(id))
with check (public.manages_church(id));

drop policy if exists "churches_admin_delete" on public.churches;
create policy "churches_admin_delete"
on public.churches for delete
using (public.is_city_admin(city_id));

drop policy if exists "church_schedule_public_read" on public.church_schedule_items;
create policy "church_schedule_public_read"
on public.church_schedule_items for select
using (
  active
  and exists (
    select 1
    from public.churches c
    where c.id = church_id
      and c.city_id = church_schedule_items.city_id
      and c.status = 'published'
  )
);

drop policy if exists "church_schedule_manager_write" on public.church_schedule_items;
create policy "church_schedule_manager_write"
on public.church_schedule_items for all
using (public.manages_church(church_id))
with check (
  public.manages_church(church_id)
  and exists (
    select 1 from public.churches c
    where c.id = church_id
      and c.city_id = church_schedule_items.city_id
  )
);

drop policy if exists "church_claims_self_create" on public.church_claims;
create policy "church_claims_self_create"
on public.church_claims for insert
with check (profile_id = auth.uid());

drop policy if exists "church_claims_self_read" on public.church_claims;
create policy "church_claims_self_read"
on public.church_claims for select
using (profile_id = auth.uid() or public.manages_church(church_id));

drop policy if exists "church_claims_admin_update" on public.church_claims;
create policy "church_claims_admin_update"
on public.church_claims for update
using (
  exists (
    select 1 from public.churches c
    where c.id = church_id
      and public.is_city_admin(c.city_id)
  )
)
with check (true);

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
seed_churches as (
  select *
  from (
    values
      ('paroquia-nossa-senhora-do-carmo', 'Paróquia Nossa Senhora do Carmo (Matriz)', 'catolica'::public.church_tradition, 'Igreja Matriz e referência católica no centro de Carmo do Rio Claro.', 'Padre Gilmar Antônio Pimenta', '(35) 99859-9661', '@paroquianscmg', 'Centro', true),
      ('paroquia-sagrada-familia', 'Paróquia Sagrada Família', 'catolica'::public.church_tradition, 'Comunidade paroquial com missas e formações ao longo da semana.', 'Pe. Júlio César Martins', null, '@paroquiasagradafamiliacrc', null, true),
      ('igreja-batista-carmo', 'Igreja Batista em Carmo do Rio Claro', 'evangelica'::public.church_tradition, 'Igreja evangélica com cultos regulares aos domingos.', null, null, '@ibcarmo', null, false),
      ('igreja-presbiteriana-independente', 'Igreja Presbiteriana Independente', 'evangelica'::public.church_tradition, 'Programação semanal com escola bíblica, culto e reunião de oração.', null, null, '@ipicarmo', null, false),
      ('igreja-evangelho-quadrangular', 'Igreja Evangelho Quadrangular', 'evangelica'::public.church_tradition, 'Cultos semanais e escola bíblica à noite.', null, null, '@i.e.q_carmodorioclaro', null, false),
      ('assembleia-de-deus-sao-benedito', 'Assembleia de Deus (São Benedito)', 'evangelica'::public.church_tradition, 'Cultos às quartas, sextas e domingos no bairro São Benedito.', null, null, '@ad.carmo', 'São Benedito', false),
      ('assembleia-de-deus-madureira', 'Assembleia de Deus Madureira', 'evangelica'::public.church_tradition, 'Comunidade evangélica local com perfil público para reivindicação.', null, null, '@admadureiracrc', null, false),
      ('igreja-adventista-setimo-dia', 'Igreja Adventista do Sétimo Dia', 'adventista'::public.church_tradition, 'Comunidade adventista de Carmo do Rio Claro.', null, null, '@iasd.crc', null, false),
      ('igreja-casa-da-adoracao', 'Igreja Casa da Adoração', 'evangelica'::public.church_tradition, 'Cultos às terças e domingos, com programação noturna.', null, null, '@casadaadoracaocarmo', null, false)
  ) as item(slug, name, tradition, short_description, pastor_name, phone, instagram, address, featured)
)
insert into public.churches (
  city_id, slug, name, tradition, short_description, pastor_name, phone, instagram, address, featured, status
)
select carmo.id, sc.slug, sc.name, sc.tradition, sc.short_description, sc.pastor_name, sc.phone, sc.instagram, sc.address, sc.featured, 'published'::public.entity_status
from carmo cross join seed_churches sc
on conflict (city_id, slug) do update
set name = excluded.name,
    tradition = excluded.tradition,
    short_description = excluded.short_description,
    pastor_name = excluded.pastor_name,
    phone = excluded.phone,
    instagram = excluded.instagram,
    address = excluded.address,
    featured = excluded.featured,
    status = excluded.status;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
seed_schedule as (
  select *
  from (
    values
      ('paroquia-nossa-senhora-do-carmo', 0, '07:00'::time, 'Missa', null, 'confirmed'),
      ('paroquia-nossa-senhora-do-carmo', 0, '09:00'::time, 'Missa', null, 'confirmed'),
      ('paroquia-nossa-senhora-do-carmo', 0, '19:00'::time, 'Missa', null, 'confirmed'),
      ('paroquia-nossa-senhora-do-carmo', 1, '19:00'::time, 'Missa', 'Horário habitual', 'needs_verification'),
      ('paroquia-nossa-senhora-do-carmo', 2, '19:00'::time, 'Terço dos Homens', null, 'confirmed'),
      ('paroquia-nossa-senhora-do-carmo', 3, '19:00'::time, 'Missa', 'Programação comum das paróquias', 'needs_verification'),
      ('paroquia-nossa-senhora-do-carmo', 6, '17:30'::time, 'Missa', 'Matriz e capelas', 'needs_verification'),
      ('paroquia-nossa-senhora-do-carmo', 6, '19:00'::time, 'Missa', 'Matriz e capelas', 'needs_verification'),
      ('paroquia-sagrada-familia', 0, '08:00'::time, 'Missa', 'Verificar agenda paroquial', 'needs_verification'),
      ('paroquia-sagrada-familia', 0, '17:00'::time, 'Missa', 'Verificar agenda paroquial', 'needs_verification'),
      ('paroquia-sagrada-familia', 0, '19:00'::time, 'Missa', 'Verificar agenda paroquial', 'needs_verification'),
      ('paroquia-sagrada-familia', 3, '19:00'::time, 'Missa', 'Programação comum das paróquias', 'needs_verification'),
      ('paroquia-sagrada-familia', 6, '17:00'::time, 'Missa no Centro de Formação', null, 'confirmed'),
      ('paroquia-sagrada-familia', 6, '19:00'::time, 'Missa', null, 'confirmed'),
      ('igreja-batista-carmo', 0, '09:00'::time, 'Culto', null, 'confirmed'),
      ('igreja-batista-carmo', 0, '19:00'::time, 'Culto', null, 'confirmed'),
      ('igreja-batista-carmo', 4, '19:00'::time, 'Culto', null, 'needs_verification'),
      ('igreja-presbiteriana-independente', 0, '09:00'::time, 'EBD', null, 'confirmed'),
      ('igreja-presbiteriana-independente', 0, '19:30'::time, 'Culto', null, 'confirmed'),
      ('igreja-presbiteriana-independente', 4, '20:00'::time, 'Oração', null, 'confirmed'),
      ('igreja-evangelho-quadrangular', 0, '19:00'::time, 'Culto', null, 'confirmed'),
      ('igreja-evangelho-quadrangular', 1, '19:30'::time, 'Escola Bíblica', null, 'confirmed'),
      ('igreja-evangelho-quadrangular', 3, '19:30'::time, 'Culto', null, 'confirmed'),
      ('assembleia-de-deus-sao-benedito', 0, '18:30'::time, 'Culto', null, 'confirmed'),
      ('assembleia-de-deus-sao-benedito', 2, '19:30'::time, 'Culto', null, 'needs_verification'),
      ('assembleia-de-deus-sao-benedito', 3, '19:30'::time, 'Culto de oração e libertação', null, 'confirmed'),
      ('assembleia-de-deus-sao-benedito', 4, '19:30'::time, 'Culto', null, 'needs_verification'),
      ('assembleia-de-deus-sao-benedito', 5, '19:30'::time, 'Culto', null, 'confirmed'),
      ('assembleia-de-deus-sao-benedito', 6, '19:00'::time, 'Culto', null, 'needs_verification'),
      ('igreja-casa-da-adoracao', 0, '18:30'::time, 'Culto', null, 'confirmed'),
      ('igreja-casa-da-adoracao', 2, '19:30'::time, 'Culto', null, 'confirmed')
  ) as item(church_slug, weekday, starts_at, title, note, source_status)
)
insert into public.church_schedule_items (church_id, city_id, weekday, starts_at, title, note, source_status, active)
select c.id, carmo.id, ss.weekday, ss.starts_at, ss.title, ss.note, ss.source_status, true
from carmo
join seed_schedule ss on true
join public.churches c on c.city_id = carmo.id and c.slug = ss.church_slug
on conflict (church_id, weekday, starts_at, title) do update
set note = excluded.note,
    source_status = excluded.source_status,
    active = excluded.active;

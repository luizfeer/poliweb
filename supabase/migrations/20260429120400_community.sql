-- ============================================================================
-- 0005 — COMMUNITY: eventos, classificados (não-imóveis), pets, achados, obituários
-- ============================================================================

do $$ begin
  create type classified_kind as enum ('vehicle', 'job', 'service', 'item', 'other');
exception when duplicate_object then null; end $$;

-- ── Eventos ─────────────────────────────────────────────────────────────────

create table event_categories (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references cities(id) on delete cascade,  -- null = global
  slug text not null,
  name text not null,
  icon text,
  display_order int default 0,
  unique (city_id, slug)
);

create table events (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  slug text not null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  address text,
  lat double precision,
  lng double precision,
  category_id uuid references event_categories(id) on delete set null,
  organizer_name text,
  organizer_business_id uuid references businesses(id) on delete set null,
  organizer_profile_id uuid references profiles(id) on delete set null,
  is_free boolean default true,
  ticket_url text,
  cover_url text,
  photos jsonb default '[]'::jsonb,
  capacity int,
  status entity_status default 'draft',
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (city_id, slug)
);

create index idx_events_city_start on events(city_id, start_at desc);
create trigger trg_events_updated before update on events for each row execute function public.set_updated_at();

-- ── Classificados (NÃO inclui imóveis — esses ficam em properties) ─────────

create table classifieds (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  author_profile_id uuid references profiles(id) on delete set null,
  type classified_kind not null,
  title text not null,
  description text,
  price numeric(12,2),
  is_negotiable boolean default false,
  category_label text,                         -- 'Carros', 'Motos', 'Vagas', 'Serviços'
  attributes jsonb default '{}'::jsonb,        -- vehicle: {marca, modelo, ano, km, ...}
  contact_name text,
  contact_phone text,
  contact_whatsapp text,
  cover_url text,
  photos jsonb default '[]'::jsonb,
  status entity_status default 'pending',      -- IA modera ao postar
  expires_at timestamptz default (now() + interval '60 days'),
  views_count int default 0,
  created_at timestamptz default now()
);

create index idx_classifieds_city_status on classifieds(city_id, status);
create index idx_classifieds_type on classifieds(type);

-- ── Pets perdidos / encontrados ────────────────────────────────────────────

create table lost_pets (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  author_profile_id uuid references profiles(id) on delete set null,
  status text default 'lost',                  -- lost | found | reunited
  pet_name text,
  species text,                                -- cao | gato | outro
  breed text,
  color text,
  size text,                                   -- pequeno | medio | grande
  age_months int,
  has_collar boolean default false,
  microchip boolean default false,
  description text,
  last_seen_at timestamptz,
  last_seen_location text,
  district_id uuid references districts(id) on delete set null,
  lat double precision,
  lng double precision,
  contact_name text,
  contact_phone text,
  contact_whatsapp text,
  cover_url text,
  photos jsonb default '[]'::jsonb,
  moderation_status entity_status default 'pending',
  created_at timestamptz default now()
);

create index idx_pets_city_status on lost_pets(city_id, status, moderation_status);

-- ── Achados e perdidos (objetos) ────────────────────────────────────────────

create table lost_and_found (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  author_profile_id uuid references profiles(id) on delete set null,
  type text not null,                          -- lost | found
  item_description text not null,
  category text,                                -- 'documentos','eletrônico','chaves','outros'
  location text,
  district_id uuid references districts(id) on delete set null,
  occurred_at timestamptz,
  contact_phone text,
  contact_whatsapp text,
  cover_url text,
  status text default 'open',                  -- open | resolved
  moderation_status entity_status default 'pending',
  created_at timestamptz default now()
);

-- ── Obituários ──────────────────────────────────────────────────────────────

create table obituaries (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  full_name text not null,
  age int,
  photo_url text,
  death_date date not null,
  wake_location text,
  wake_at timestamptz,
  burial_at timestamptz,
  burial_location text,
  mass_at timestamptz,                          -- missa de 7º dia
  mass_location text,
  family_message text,
  funeral_home text,
  status entity_status default 'draft',         -- só admin posta
  created_at timestamptz default now()
);

create index idx_obituaries_city_date on obituaries(city_id, death_date desc);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table event_categories enable row level security;
alter table events           enable row level security;
alter table classifieds      enable row level security;
alter table lost_pets        enable row level security;
alter table lost_and_found   enable row level security;
alter table obituaries       enable row level security;

create policy "evt_cat_read"  on event_categories for select using (true);
create policy "evt_cat_admin" on event_categories for all using (public.is_super_admin() or (city_id is not null and public.is_city_admin(city_id))) with check (public.is_super_admin() or (city_id is not null and public.is_city_admin(city_id)));

create policy "events_read" on events for select using (status = 'published' or organizer_profile_id = auth.uid() or public.is_city_admin(city_id));
create policy "events_create" on events for insert with check (auth.uid() is not null);  -- qualquer logado submete (admin aprova)
create policy "events_self_update" on events for update using (organizer_profile_id = auth.uid() or public.manages_business(organizer_business_id) or public.is_city_admin(city_id)) with check (organizer_profile_id = auth.uid() or public.manages_business(organizer_business_id) or public.is_city_admin(city_id));

create policy "classifieds_read" on classifieds for select using (status = 'published' or author_profile_id = auth.uid() or public.is_city_admin(city_id));
create policy "classifieds_self_create" on classifieds for insert with check (author_profile_id = auth.uid());
create policy "classifieds_self_update" on classifieds for update using (author_profile_id = auth.uid() or public.is_city_admin(city_id)) with check (author_profile_id = auth.uid() or public.is_city_admin(city_id));
create policy "classifieds_self_delete" on classifieds for delete using (author_profile_id = auth.uid() or public.is_city_admin(city_id));

create policy "pets_read" on lost_pets for select using (moderation_status = 'published' or author_profile_id = auth.uid() or public.is_city_admin(city_id));
create policy "pets_self_create" on lost_pets for insert with check (author_profile_id = auth.uid());
create policy "pets_self_update" on lost_pets for update using (author_profile_id = auth.uid() or public.is_city_admin(city_id)) with check (author_profile_id = auth.uid() or public.is_city_admin(city_id));

create policy "lf_read" on lost_and_found for select using (moderation_status = 'published' or author_profile_id = auth.uid() or public.is_city_admin(city_id));
create policy "lf_self_create" on lost_and_found for insert with check (author_profile_id = auth.uid());
create policy "lf_self_update" on lost_and_found for update using (author_profile_id = auth.uid() or public.is_city_admin(city_id)) with check (author_profile_id = auth.uid() or public.is_city_admin(city_id));

create policy "obit_read" on obituaries for select using (status = 'published' or public.is_city_admin(city_id));
create policy "obit_admin" on obituaries for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));

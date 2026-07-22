-- ============================================================================
-- 0004 — TOURISM: pousadas, restaurantes, atrações, pesca esportiva, pacotes
-- ============================================================================

do $$ begin
  create type accommodation_kind as enum ('pousada', 'hotel', 'chale', 'airbnb', 'camping', 'rancho', 'casa_temporada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attraction_kind as enum ('balneario', 'mirante', 'cachoeira', 'trilha', 'igreja', 'museu', 'parque', 'praia', 'lago', 'historico');
exception when duplicate_object then null; end $$;

-- ── Pousadas / hospedagem ──────────────────────────────────────────────────

create table accommodations (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  district_id uuid references districts(id) on delete set null,
  slug text not null,
  name text not null,
  type accommodation_kind default 'pousada',
  description text,
  short_description text,
  address text,
  cep text,
  lat double precision,
  lng double precision,
  phone text,
  whatsapp text,
  email text,
  website text,
  booking_url text,                            -- link afiliado Booking
  airbnb_url text,                             -- link afiliado Airbnb
  instagram text,
  price_min numeric(10,2),
  price_max numeric(10,2),
  rooms_count int,
  max_guests int,
  amenities jsonb default '[]'::jsonb,         -- ['piscina','cafe_da_manha','wifi','pet_friendly',...]
  near_lake boolean default false,             -- relevante CRC/Capitólio
  has_marina boolean default false,            -- pesca/náutica
  cover_url text,
  photos jsonb default '[]'::jsonb,
  rating numeric(2,1),
  owner_profile_id uuid references profiles(id) on delete set null,
  status entity_status default 'draft',
  featured boolean default false,
  verified boolean default false,
  plan text default 'free',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (city_id, slug)
);

create index idx_accom_city on accommodations(city_id, status);
create trigger trg_accom_updated before update on accommodations for each row execute function public.set_updated_at();

-- ── Restaurantes ────────────────────────────────────────────────────────────

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  district_id uuid references districts(id) on delete set null,
  slug text not null,
  name text not null,
  description text,
  cuisine jsonb default '[]'::jsonb,           -- ['mineira','italiana','peixe','self_service']
  price_range text,                            -- '$', '$$', '$$$', '$$$$'
  address text,
  phone text,
  whatsapp text,
  hours jsonb default '{}'::jsonb,
  delivery boolean default false,
  ifood_url text,
  cover_url text,
  photos jsonb default '[]'::jsonb,
  lat double precision,
  lng double precision,
  owner_profile_id uuid references profiles(id) on delete set null,
  status entity_status default 'draft',
  featured boolean default false,
  rating numeric(2,1),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (city_id, slug)
);

create index idx_restaurants_city on restaurants(city_id, status);
create trigger trg_rest_updated before update on restaurants for each row execute function public.set_updated_at();

-- ── Atrações turísticas ─────────────────────────────────────────────────────

create table attractions (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  slug text not null,
  name text not null,
  type attraction_kind default 'balneario',
  description text,
  address text,
  lat double precision,
  lng double precision,
  hours text,
  entry_fee text,                              -- 'Gratuito' | 'R$ 10' | 'Conforme operadora'
  difficulty text,                             -- trilhas/cachoeiras: facil|moderado|dificil
  duration_minutes int,
  cover_url text,
  photos jsonb default '[]'::jsonb,
  best_season text,
  status entity_status default 'draft',
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (city_id, slug)
);

create index idx_attractions_city on attractions(city_id, status);

-- ── Pesca esportiva (vertical CRC/Furnas) ──────────────────────────────────

create table fishing_spots (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  slug text not null,
  name text not null,
  description text,
  lat double precision,
  lng double precision,
  species jsonb default '[]'::jsonb,           -- ['tucunare','traira','dourado','tilapia','pintado']
  regulations text,
  defeso_period text,                          -- 'Novembro a janeiro'
  requires_guide boolean default false,
  access_difficulty text,
  cover_url text,
  photos jsonb default '[]'::jsonb,
  status entity_status default 'draft',
  created_at timestamptz default now(),
  unique (city_id, slug)
);

create table fishing_guides (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  slug text not null,
  full_name text not null,
  license_number text,
  about text,
  phone text,
  whatsapp text,
  email text,
  services jsonb default '[]'::jsonb,          -- ['guia_pesca','aluguel_barco','iscas']
  price_range text,
  has_boat boolean default false,
  photo_url text,
  owner_profile_id uuid references profiles(id) on delete set null,
  status entity_status default 'draft',
  verified boolean default false,
  created_at timestamptz default now(),
  unique (city_id, slug)
);

-- ── Pacotes turísticos ──────────────────────────────────────────────────────

create table tour_packages (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  provider_business_id uuid references businesses(id) on delete set null,
  slug text not null,
  title text not null,
  description text,
  duration_hours numeric(4,1),
  price numeric(10,2),
  includes jsonb default '[]'::jsonb,
  contact_phone text,
  contact_whatsapp text,
  cover_url text,
  status entity_status default 'draft',
  created_at timestamptz default now(),
  unique (city_id, slug)
);

-- ── RLS (padrão idêntico para entidades turísticas) ────────────────────────

alter table accommodations enable row level security;
alter table restaurants    enable row level security;
alter table attractions    enable row level security;
alter table fishing_spots  enable row level security;
alter table fishing_guides enable row level security;
alter table tour_packages  enable row level security;

-- Helper genérico para entidades turísticas com owner_profile_id direto
create or replace function public.manages_tourism_entity(p_table text, p_id uuid, p_city_id uuid)
returns boolean language sql security definer stable
as $$
  select public.manages_entity(p_table, p_id) or public.is_city_admin(p_city_id);
$$;

-- Accommodations
create policy "accom_read" on accommodations for select using (status = 'published' or owner_profile_id = auth.uid() or public.manages_entity('accommodation', id) or public.is_city_admin(city_id));
create policy "accom_create" on accommodations for insert with check (public.is_merchant(city_id) or public.is_city_admin(city_id));
create policy "accom_update" on accommodations for update using (owner_profile_id = auth.uid() or public.manages_entity('accommodation', id) or public.is_city_admin(city_id)) with check (owner_profile_id = auth.uid() or public.manages_entity('accommodation', id) or public.is_city_admin(city_id));
create policy "accom_delete" on accommodations for delete using (public.is_city_admin(city_id));

-- Restaurants
create policy "rest_read" on restaurants for select using (status = 'published' or owner_profile_id = auth.uid() or public.manages_entity('restaurant', id) or public.is_city_admin(city_id));
create policy "rest_create" on restaurants for insert with check (public.is_merchant(city_id) or public.is_city_admin(city_id));
create policy "rest_update" on restaurants for update using (owner_profile_id = auth.uid() or public.manages_entity('restaurant', id) or public.is_city_admin(city_id)) with check (owner_profile_id = auth.uid() or public.manages_entity('restaurant', id) or public.is_city_admin(city_id));

-- Attractions: catálogo curado pelo admin
create policy "attr_read" on attractions for select using (status = 'published' or public.is_city_admin(city_id));
create policy "attr_admin" on attractions for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));

-- Fishing spots: admin gerencia (são pontos públicos)
create policy "spots_read" on fishing_spots for select using (status = 'published' or public.is_city_admin(city_id));
create policy "spots_admin" on fishing_spots for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));

-- Fishing guides
create policy "guides_read" on fishing_guides for select using (status = 'published' or owner_profile_id = auth.uid() or public.is_city_admin(city_id));
create policy "guides_create" on fishing_guides for insert with check (public.is_merchant(city_id) or public.is_city_admin(city_id));
create policy "guides_update" on fishing_guides for update using (owner_profile_id = auth.uid() or public.manages_entity('fishing_guide', id) or public.is_city_admin(city_id)) with check (owner_profile_id = auth.uid() or public.manages_entity('fishing_guide', id) or public.is_city_admin(city_id));

-- Tour packages
create policy "packages_read" on tour_packages for select using (status = 'published' or public.is_city_admin(city_id));
create policy "packages_provider_write" on tour_packages for all
  using (public.manages_business(provider_business_id) or public.is_city_admin(city_id))
  with check (public.manages_business(provider_business_id) or public.is_city_admin(city_id));

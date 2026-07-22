-- ============================================================================
-- 0002 — REAL ESTATE: imobiliárias, agentes, imóveis, contatos
-- ============================================================================

do $$ begin
  create type listing_kind as enum ('sale', 'rent', 'temporary');  -- venda | aluguel | temporada
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_kind as enum (
    'apartment', 'house', 'cobertura', 'kitnet', 'studio',
    'chacara', 'sitio', 'fazenda', 'terreno_urbano', 'terreno_rural',
    'comercial_loja', 'comercial_sala', 'galpao', 'hotel'
  );
exception when duplicate_object then null; end $$;

-- ── Imobiliárias ────────────────────────────────────────────────────────────

create table realtors (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  slug text not null,
  name text not null,                          -- nome fantasia
  legal_name text,                             -- razão social
  cnpj text,
  creci text,                                  -- CRECI da pessoa jurídica
  phone text,
  whatsapp text,
  email text,
  address text,
  district_id uuid references districts(id) on delete set null,
  about text,
  logo_url text,
  cover_url text,
  website text,
  instagram text,
  facebook text,
  hours jsonb default '{}'::jsonb,
  status entity_status default 'draft',
  verified boolean default false,
  owner_profile_id uuid references profiles(id),
  plan text default 'free',
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (city_id, slug)
);

create index idx_realtors_city on realtors(city_id, status);
create trigger trg_realtors_updated before update on realtors for each row execute function public.set_updated_at();

-- ── Agentes / corretores vinculados a uma imobiliária ──────────────────────

create table realtor_agents (
  id uuid primary key default gen_random_uuid(),
  realtor_id uuid not null references realtors(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,  -- pode ou não ter conta
  full_name text not null,
  creci text,
  phone text,
  whatsapp text,
  email text,
  photo_url text,
  role text default 'agent',  -- admin | agent
  active boolean default true,
  created_at timestamptz default now()
);

create index idx_agents_realtor on realtor_agents(realtor_id, active);

-- ── Imóveis ─────────────────────────────────────────────────────────────────

create table properties (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  district_id uuid references districts(id) on delete set null,

  -- ownership: imobiliária OU particular (citizen postando direto)
  realtor_id uuid references realtors(id) on delete set null,
  agent_id uuid references realtor_agents(id) on delete set null,
  owner_profile_id uuid references profiles(id),
  exclusive boolean default false,

  slug text not null,
  reference_code text,                         -- código interno da imobiliária
  listing_type listing_kind not null,
  property_type property_kind not null,
  title text not null,
  description text,

  -- valores
  price numeric(14,2),
  rent_price numeric(14,2),                    -- quando aplicável
  condo_fee numeric(10,2),
  iptu_yearly numeric(10,2),
  accepts_financing boolean default false,
  accepts_exchange boolean default false,

  -- métricas
  area_total_m2 numeric(10,2),
  area_useful_m2 numeric(10,2),
  bedrooms smallint,
  suites smallint,
  bathrooms smallint,
  parking_spaces smallint,
  floor smallint,
  built_year int,

  -- localização
  address_street text,
  address_number text,
  address_complement text,
  cep text,
  show_exact_location boolean default false,   -- senão mostra só o bairro
  lat double precision,
  lng double precision,

  -- features
  amenities jsonb default '[]'::jsonb,         -- ['piscina','churrasqueira','varanda',...]
  furnished boolean default false,
  pets_allowed boolean default false,
  has_pool boolean default false,
  has_grill boolean default false,
  has_garden boolean default false,
  has_garage boolean default false,
  near_lake boolean default false,             -- relevante para CRC (Furnas)

  -- mídia
  cover_url text,
  photos jsonb default '[]'::jsonb,            -- [{url, caption, order}]
  video_url text,
  tour_360_url text,
  floor_plan_url text,

  -- status & destaque
  status entity_status default 'draft',
  featured boolean default false,
  views_count int default 0,
  published_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (city_id, slug),

  -- Garante que o imóvel tenha ao menos um responsável
  constraint properties_has_owner check (realtor_id is not null or owner_profile_id is not null)
);

create index idx_properties_city_status on properties(city_id, status);
create index idx_properties_listing on properties(listing_type, property_type);
create index idx_properties_district on properties(district_id);
create index idx_properties_realtor on properties(realtor_id);
create index idx_properties_owner on properties(owner_profile_id);
create index idx_properties_price on properties(price) where status = 'published';

create trigger trg_properties_updated before update on properties for each row execute function public.set_updated_at();

-- ── Contatos / leads sobre imóveis ──────────────────────────────────────────

create table property_inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  requester_profile_id uuid references profiles(id) on delete set null,
  requester_name text not null,
  requester_email text,
  requester_phone text,
  message text,
  source text,                                 -- 'site', 'whatsapp', 'phone'
  status text default 'new',                   -- new | contacted | qualified | closed
  internal_notes text,
  contacted_at timestamptz,
  created_at timestamptz default now()
);

create index idx_inquiries_property on property_inquiries(property_id, created_at desc);

-- ── Favoritos do cidadão ────────────────────────────────────────────────────

create table property_favorites (
  profile_id uuid not null references profiles(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (profile_id, property_id)
);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table realtors           enable row level security;
alter table realtor_agents     enable row level security;
alter table properties         enable row level security;
alter table property_inquiries enable row level security;
alter table property_favorites enable row level security;

-- Helper para checar se o usuário gerencia o realtor (owner direto ou via entity_managers)
create or replace function public.manages_realtor(p_realtor_id uuid)
returns boolean language sql security definer stable
as $$
  select exists (
    select 1 from realtors r
    where r.id = p_realtor_id
      and (
        r.owner_profile_id = auth.uid()
        or public.manages_entity('realtor', r.id)
        or public.is_city_admin(r.city_id)
      )
  );
$$;

-- Realtors
create policy "realtors_public_read" on realtors for select
  using (status = 'published' or owner_profile_id = auth.uid() or public.manages_entity('realtor', id) or public.is_city_admin(city_id));

create policy "realtors_owner_create" on realtors for insert
  with check (
    -- merchant da cidade pode criar; admin sempre pode
    public.is_merchant(city_id)
    or public.is_city_admin(city_id)
  );

create policy "realtors_owner_write" on realtors for update
  using (owner_profile_id = auth.uid() or public.manages_entity('realtor', id) or public.is_city_admin(city_id))
  with check (owner_profile_id = auth.uid() or public.manages_entity('realtor', id) or public.is_city_admin(city_id));

create policy "realtors_admin_delete" on realtors for delete
  using (public.is_city_admin(city_id));

-- Agents
create policy "agents_public_read" on realtor_agents for select using (active = true);
create policy "agents_realtor_admin" on realtor_agents for all
  using (public.manages_realtor(realtor_id))
  with check (public.manages_realtor(realtor_id));

-- Properties: leitura pública dos publicados; CRUD para owner ou imobiliária responsável
create policy "properties_public_read_published" on properties for select
  using (status = 'published');

create policy "properties_owner_read_own" on properties for select using (
  owner_profile_id = auth.uid()
  or (realtor_id is not null and public.manages_realtor(realtor_id))
  or public.is_city_admin(city_id)
);

create policy "properties_create" on properties for insert with check (
  -- particular
  (owner_profile_id = auth.uid())
  -- ou via imobiliária que ele gerencia
  or (realtor_id is not null and public.manages_realtor(realtor_id))
  -- ou admin da cidade
  or public.is_city_admin(city_id)
);

create policy "properties_update" on properties for update using (
  owner_profile_id = auth.uid()
  or (realtor_id is not null and public.manages_realtor(realtor_id))
  or public.is_city_admin(city_id)
) with check (
  owner_profile_id = auth.uid()
  or (realtor_id is not null and public.manages_realtor(realtor_id))
  or public.is_city_admin(city_id)
);

create policy "properties_delete" on properties for delete using (
  owner_profile_id = auth.uid()
  or (realtor_id is not null and public.manages_realtor(realtor_id))
  or public.is_city_admin(city_id)
);

-- Inquiries: qualquer um cria; quem recebe (dono do imóvel/imobiliária) lê
create policy "inquiries_create_anyone" on property_inquiries for insert with check (true);

create policy "inquiries_owner_read" on property_inquiries for select using (
  requester_profile_id = auth.uid()
  or exists (
    select 1 from properties p
    where p.id = property_id and (
      p.owner_profile_id = auth.uid()
      or (p.realtor_id is not null and public.manages_realtor(p.realtor_id))
      or public.is_city_admin(p.city_id)
    )
  )
);

create policy "inquiries_owner_update" on property_inquiries for update using (
  exists (
    select 1 from properties p
    where p.id = property_id and (
      p.owner_profile_id = auth.uid()
      or (p.realtor_id is not null and public.manages_realtor(p.realtor_id))
      or public.is_city_admin(p.city_id)
    )
  )
) with check (true);

-- Favoritos: o próprio cidadão
create policy "favorites_self" on property_favorites for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

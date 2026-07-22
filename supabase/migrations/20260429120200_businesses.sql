-- ============================================================================
-- 0003 — BUSINESSES: guia comercial com categorias hierárquicas, reviews e claims
-- ============================================================================

-- ── Categorias hierárquicas (até 3 níveis: pai > filho > neto) ──────────────

create table business_categories (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references cities(id) on delete cascade,  -- null = categoria global (todas cidades)
  slug text not null,
  name text not null,
  parent_id uuid references business_categories(id) on delete set null,
  icon text,
  display_order int default 0,
  active boolean default true,
  created_at timestamptz default now(),
  unique (city_id, slug)
);

create index idx_categories_parent on business_categories(parent_id);
create index idx_categories_city on business_categories(city_id, active);

-- ── Negócios ────────────────────────────────────────────────────────────────

create table businesses (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  district_id uuid references districts(id) on delete set null,
  slug text not null,
  name text not null,
  short_description text,                      -- até ~140 chars (cards de listagem)
  description text,                            -- texto longo da ficha
  cnpj text,
  phone text,
  whatsapp text,
  email text,
  website text,
  instagram text,
  facebook text,
  google_maps_url text,
  address text,
  cep text,
  lat double precision,
  lng double precision,
  hours jsonb default '{}'::jsonb,             -- { mon: [{open: "08:00", close: "18:00"}], ... }
  cover_url text,
  logo_url text,
  photos jsonb default '[]'::jsonb,
  amenities jsonb default '[]'::jsonb,         -- ['estacionamento','wifi','aceita_pet','delivery',...]
  payment_methods jsonb default '[]'::jsonb,   -- ['pix','dinheiro','credito','vale_refeicao',...]

  -- gestão
  owner_profile_id uuid references profiles(id) on delete set null,
  status entity_status default 'draft',
  plan text default 'free',                    -- free | featured | premium
  featured boolean default false,
  verified boolean default false,
  claimed boolean default false,               -- comerciante reivindicou a página
  views_count int default 0,

  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (city_id, slug)
);

create index idx_businesses_city_status on businesses(city_id, status);
create index idx_businesses_district on businesses(district_id);
create index idx_businesses_owner on businesses(owner_profile_id);

create trigger trg_businesses_updated before update on businesses for each row execute function public.set_updated_at();

-- ── M:N negócio ↔ categoria ────────────────────────────────────────────────

create table business_category_assignments (
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid not null references business_categories(id) on delete cascade,
  is_primary boolean default false,
  created_at timestamptz default now(),
  primary key (business_id, category_id)
);

create index idx_bca_category on business_category_assignments(category_id);

-- Garante uma única primary por negócio
create unique index uq_bca_primary on business_category_assignments(business_id) where is_primary;

-- ── Promoções / cupons ──────────────────────────────────────────────────────

create table business_promotions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  title text not null,
  description text,
  coupon_code text,
  discount_percent int check (discount_percent between 0 and 100),
  valid_from timestamptz default now(),
  valid_until timestamptz,
  active boolean default true,
  cover_url text,
  created_at timestamptz default now()
);

create index idx_promos_active on business_promotions(business_id, active, valid_until);

-- ── Avaliações ──────────────────────────────────────────────────────────────

create table business_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  author_profile_id uuid not null references profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text,
  comment text,
  status entity_status default 'pending',      -- IA modera; admin revisa
  reply_owner text,                            -- resposta do dono do negócio
  reply_at timestamptz,
  created_at timestamptz default now(),
  unique (business_id, author_profile_id)      -- 1 review por usuário por negócio
);

create index idx_reviews_business on business_reviews(business_id, status);

-- ── Reivindicação de página (negócio cadastrado pelo admin antes do dono) ──

create table business_claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  status text default 'pending',               -- pending | approved | rejected
  evidence_text text,                          -- "sou dono pq..."
  evidence_url text,                           -- link de comprovante (CNPJ, foto)
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz default now(),
  unique (business_id, profile_id)
);

create index idx_claims_status on business_claims(status, created_at desc);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table business_categories             enable row level security;
alter table businesses                      enable row level security;
alter table business_category_assignments   enable row level security;
alter table business_promotions             enable row level security;
alter table business_reviews                enable row level security;
alter table business_claims                 enable row level security;

-- Helper: o usuário atual gerencia o negócio?
create or replace function public.manages_business(p_business_id uuid)
returns boolean language sql security definer stable
as $$
  select exists (
    select 1 from businesses b
    where b.id = p_business_id
      and (
        b.owner_profile_id = auth.uid()
        or public.manages_entity('business', b.id)
        or public.is_city_admin(b.city_id)
      )
  );
$$;

-- Categorias: leitura pública; admin gerencia
create policy "categories_read"  on business_categories for select using (active);
create policy "categories_admin" on business_categories for all
  using (city_id is null and public.is_super_admin() or public.is_city_admin(city_id))
  with check (city_id is null and public.is_super_admin() or public.is_city_admin(city_id));

-- Negócios: público lê publicados; dono/manager lê e edita os próprios
create policy "biz_public_read" on businesses for select
  using (status = 'published' or public.manages_business(id));

create policy "biz_create" on businesses for insert with check (
  public.is_merchant(city_id) or public.is_city_admin(city_id)
);

create policy "biz_update" on businesses for update
  using (public.manages_business(id))
  with check (public.manages_business(id));

create policy "biz_delete" on businesses for delete
  using (public.is_city_admin(city_id));

-- Atribuições de categoria: leitura pública; gerenciado pelo dono ou admin
create policy "bca_read"  on business_category_assignments for select using (true);
create policy "bca_write" on business_category_assignments for all
  using (public.manages_business(business_id))
  with check (public.manages_business(business_id));

-- Promoções: leitura pública (apenas ativas e dentro da validade)
create policy "promos_public_read" on business_promotions for select
  using ((active and (valid_until is null or valid_until > now())) or public.manages_business(business_id));
create policy "promos_owner_write" on business_promotions for all
  using (public.manages_business(business_id))
  with check (public.manages_business(business_id));

-- Reviews: público vê published; autor vê os seus + cria; admin modera
create policy "reviews_public_read" on business_reviews for select
  using (status = 'published' or author_profile_id = auth.uid() or public.manages_business(business_id));

create policy "reviews_self_create" on business_reviews for insert
  with check (author_profile_id = auth.uid());

create policy "reviews_self_update" on business_reviews for update
  using (author_profile_id = auth.uid() and status in ('draft', 'pending'))
  with check (author_profile_id = auth.uid());

create policy "reviews_admin_moderate" on business_reviews for update
  using (public.manages_business(business_id))
  with check (public.manages_business(business_id));

-- Reivindicações: o próprio cria + lê; admin modera
create policy "claims_self_create" on business_claims for insert
  with check (profile_id = auth.uid());

create policy "claims_self_read" on business_claims for select
  using (profile_id = auth.uid() or public.manages_business(business_id));

create policy "claims_admin_update" on business_claims for update
  using (exists (select 1 from businesses b where b.id = business_id and public.is_city_admin(b.city_id)))
  with check (true);

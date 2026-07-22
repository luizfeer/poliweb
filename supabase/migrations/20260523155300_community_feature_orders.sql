-- ============================================================================
-- Destaque pago por anúncio (classifieds) e por grupo (community_groups).
-- One-shot via Asaas (PIX/cartão). featured_until controla ordenação e badge.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- featured_until em community_groups (classifieds já tem)
-- ----------------------------------------------------------------------------
alter table public.community_groups
  add column if not exists featured_until timestamptz;

create index if not exists idx_community_groups_featured_until
  on public.community_groups (city_id, featured_until desc nulls last)
  where status = 'published';

create index if not exists idx_classifieds_featured_until
  on public.classifieds (city_id, featured_until desc nulls last)
  where status = 'published' and review_status = 'approved';

-- ----------------------------------------------------------------------------
-- Catálogo de planos de destaque (similar a business_plans, mas one-shot)
-- ----------------------------------------------------------------------------
create table if not exists public.feature_plans (
  slug text primary key,
  name text not null,
  description text not null,
  amount_cents integer not null check (amount_cents > 0),
  duration_days integer not null check (duration_days > 0),
  applies_to text[] not null default array['classified','community_group']::text[],
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feature_plans enable row level security;

drop policy if exists "feature_plans_public_read" on public.feature_plans;
create policy "feature_plans_public_read"
  on public.feature_plans for select
  to anon, authenticated
  using (status = 'active');

insert into public.feature_plans (slug, name, description, amount_cents, duration_days, applies_to)
values (
  'destaque-30d',
  'Destaque 30 dias',
  'Seu anúncio ou grupo aparece no topo da listagem por 30 dias, com selo Destaque.',
  4900,
  30,
  array['classified','community_group']::text[]
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  amount_cents = excluded.amount_cents,
  duration_days = excluded.duration_days,
  applies_to = excluded.applies_to,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- Pedidos de destaque
-- ----------------------------------------------------------------------------
do $$ begin
  create type feature_order_target as enum ('classified', 'community_group');
exception when duplicate_object then null; end $$;

do $$ begin
  create type feature_order_status as enum ('pending', 'paid', 'failed', 'expired', 'refunded');
exception when duplicate_object then null; end $$;

create table if not exists public.feature_orders (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  target_type feature_order_target not null,
  target_id uuid not null,
  plan_slug text not null references public.feature_plans(slug) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  duration_days integer not null check (duration_days > 0),
  status feature_order_status not null default 'pending',
  billing_type text,
  asaas_customer_id text,
  asaas_payment_id text,
  asaas_invoice_url text,
  asaas_pix_qr_code text,
  asaas_pix_payload text,
  asaas_pix_expires_at timestamptz,
  paid_at timestamptz,
  granted_until timestamptz,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feature_orders_profile_idx
  on public.feature_orders (profile_id, created_at desc);

create index if not exists feature_orders_target_idx
  on public.feature_orders (target_type, target_id, created_at desc);

create unique index if not exists feature_orders_payment_id_uidx
  on public.feature_orders (asaas_payment_id)
  where asaas_payment_id is not null;

create index if not exists feature_orders_pending_target_idx
  on public.feature_orders (target_type, target_id)
  where status = 'pending';

alter table public.feature_orders enable row level security;

drop policy if exists "feature_orders_owner_select" on public.feature_orders;
create policy "feature_orders_owner_select"
  on public.feature_orders for select
  to authenticated
  using (
    profile_id = auth.uid()
    or public.is_city_admin(city_id)
  );

drop policy if exists "feature_orders_owner_insert" on public.feature_orders;
create policy "feature_orders_owner_insert"
  on public.feature_orders for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    and status = 'pending'
    and paid_at is null
    and granted_until is null
  );

-- Update/delete só via service-role (webhook), nunca pelo dono.

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_feature_orders_updated_at on public.feature_orders;
create trigger trg_feature_orders_updated_at
before update on public.feature_orders
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_feature_plans_updated_at on public.feature_plans;
create trigger trg_feature_plans_updated_at
before update on public.feature_plans
for each row execute function public.set_updated_at_timestamp();

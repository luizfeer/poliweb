-- ── Balsas / travessias aquaviárias ────────────────────────────────────────
-- Modelo: 1 rota = 1 ferry_route, com vários ferry_schedule_items (direção + horário)
-- e ferry_alerts opcionais (avisos específicos da rota).
-- Tarifa cabe em jsonb porque varia muito (faixas, categorias) e é leitura.

create table if not exists public.ferry_routes (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,

  slug text not null,
  name text not null,
  short_name text,
  region text,
  district text,

  status text not null default 'active_check_before_go'
    check (status in ('active', 'active_check_before_go', 'schedule_missing', 'suspended', 'inactive')),
  confidence text not null default 'medium'
    check (confidence in ('high', 'medium', 'low', 'route_confirmed_schedule_missing')),

  description text,
  important_info jsonb not null default '[]'::jsonb,

  fare_summary text,
  fare_warning text,
  fare jsonb not null default '{}'::jsonb,

  display jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  keywords text[] not null default '{}',

  endpoint_a_label text,
  endpoint_b_label text,
  endpoint_a_lat double precision,
  endpoint_a_lng double precision,
  endpoint_b_lat double precision,
  endpoint_b_lng double precision,

  cover_url text,
  featured boolean not null default false,
  display_order int not null default 0,
  active boolean not null default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (city_id, slug)
);

drop trigger if exists trg_ferry_routes_updated on public.ferry_routes;
create trigger trg_ferry_routes_updated
before update on public.ferry_routes
for each row execute function public.set_updated_at();

create index if not exists idx_ferry_routes_city
  on public.ferry_routes(city_id) where active;

create table if not exists public.ferry_schedule_items (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.ferry_routes(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,

  direction text not null,                 -- ex.: 'Itaci → Carmo'
  origin text,
  destination text,
  departs_at time not null,
  notes text,
  valid_from date,
  valid_until date,
  active boolean not null default true,
  display_order int not null default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists trg_ferry_schedule_items_updated on public.ferry_schedule_items;
create trigger trg_ferry_schedule_items_updated
before update on public.ferry_schedule_items
for each row execute function public.set_updated_at();

create index if not exists idx_ferry_schedule_lookup
  on public.ferry_schedule_items(route_id, direction, departs_at)
  where active;

create table if not exists public.ferry_alerts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  route_id uuid references public.ferry_routes(id) on delete cascade,

  type text not null default 'info'
    check (type in ('info', 'warning', 'maintenance', 'event', 'safety')),
  title text not null,
  message text not null,

  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  display_order int not null default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists trg_ferry_alerts_updated on public.ferry_alerts;
create trigger trg_ferry_alerts_updated
before update on public.ferry_alerts
for each row execute function public.set_updated_at();

create index if not exists idx_ferry_alerts_city on public.ferry_alerts(city_id) where active;
create index if not exists idx_ferry_alerts_route on public.ferry_alerts(route_id) where active;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.ferry_routes         enable row level security;
alter table public.ferry_schedule_items enable row level security;
alter table public.ferry_alerts         enable row level security;

drop policy if exists "ferry_routes_read" on public.ferry_routes;
create policy "ferry_routes_read" on public.ferry_routes
  for select using (active or public.is_city_admin(city_id));

drop policy if exists "ferry_routes_write" on public.ferry_routes;
create policy "ferry_routes_write" on public.ferry_routes
  for all using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));

drop policy if exists "ferry_schedule_read" on public.ferry_schedule_items;
create policy "ferry_schedule_read" on public.ferry_schedule_items
  for select using (active or public.is_city_admin(city_id));

drop policy if exists "ferry_schedule_write" on public.ferry_schedule_items;
create policy "ferry_schedule_write" on public.ferry_schedule_items
  for all using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));

drop policy if exists "ferry_alerts_read" on public.ferry_alerts;
create policy "ferry_alerts_read" on public.ferry_alerts
  for select using (active or public.is_city_admin(city_id));

drop policy if exists "ferry_alerts_write" on public.ferry_alerts;
create policy "ferry_alerts_write" on public.ferry_alerts
  for all using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));

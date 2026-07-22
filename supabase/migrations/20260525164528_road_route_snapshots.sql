create table if not exists public.road_route_snapshots (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  destination_key text not null,
  destination_name text not null,
  origin_label text not null default 'Carmo do Rio Claro',
  route_label text not null,
  der_status text not null,
  der_status_level text not null check (der_status_level in ('clear', 'attention', 'blocked', 'unknown')),
  der_alert_count int not null default 0,
  traffic_status text,
  duration_seconds int,
  static_duration_seconds int,
  distance_meters int,
  source_summary text not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  raw_der jsonb not null default '{}'::jsonb,
  raw_google jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, destination_key)
);

create index if not exists road_route_snapshots_city_expires_idx
on public.road_route_snapshots(city_id, expires_at);

drop trigger if exists trg_road_route_snapshots_updated_at on public.road_route_snapshots;
create trigger trg_road_route_snapshots_updated_at
before update on public.road_route_snapshots
for each row execute function public.set_updated_at();

alter table public.road_route_snapshots enable row level security;

drop policy if exists "road_route_snapshots_public_read" on public.road_route_snapshots;
create policy "road_route_snapshots_public_read"
on public.road_route_snapshots
for select
using (expires_at > now());

drop policy if exists "road_route_snapshots_city_admin_manage" on public.road_route_snapshots;
create policy "road_route_snapshots_city_admin_manage"
on public.road_route_snapshots
for all
using (public.is_city_admin(city_id))
with check (public.is_city_admin(city_id));

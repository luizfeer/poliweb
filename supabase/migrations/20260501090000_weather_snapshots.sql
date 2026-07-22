create table if not exists public.weather_snapshots (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  provider text not null default 'open-meteo',
  fetched_at timestamptz not null,
  expires_at timestamptz not null,
  timezone text not null default 'America/Sao_Paulo',
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  current_temperature numeric(5,2),
  apparent_temperature numeric(5,2),
  weather_code integer,
  wind_speed numeric(6,2),
  precipitation_probability integer,
  daily jsonb not null default '[]'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, provider)
);

drop trigger if exists trg_weather_snapshots_updated_at on public.weather_snapshots;
create trigger trg_weather_snapshots_updated_at
before update on public.weather_snapshots
for each row execute function public.set_updated_at();

alter table public.weather_snapshots enable row level security;

drop policy if exists "Public can read weather snapshots" on public.weather_snapshots;
create policy "Public can read weather snapshots"
on public.weather_snapshots
for select
using (true);

drop policy if exists "City admins manage weather snapshots" on public.weather_snapshots;
create policy "City admins manage weather snapshots"
on public.weather_snapshots
for all
using (public.is_city_admin(city_id))
with check (public.is_city_admin(city_id));

create index if not exists weather_snapshots_city_expires_idx
on public.weather_snapshots (city_id, expires_at desc);

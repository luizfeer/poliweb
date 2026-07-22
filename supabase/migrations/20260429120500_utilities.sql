-- ============================================================================
-- 0006 — UTILITIES: serviços públicos (lixo, telefones, farmácia, saúde, alertas)
-- ============================================================================

do $$ begin
  create type alert_kind as enum ('water', 'energy', 'traffic', 'weather', 'security', 'health');
exception when duplicate_object then null; end $$;

do $$ begin
  create type garbage_kind as enum ('common', 'recyclable', 'organic', 'electronic', 'special');
exception when duplicate_object then null; end $$;

-- ── Coleta de lixo ──────────────────────────────────────────────────────────

create table garbage_schedules (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  district_id uuid not null references districts(id) on delete cascade,
  type garbage_kind default 'common',
  day_of_week smallint not null check (day_of_week between 0 and 6),  -- 0=dom
  start_time time,
  end_time time,
  notes text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_garbage_district on garbage_schedules(district_id, day_of_week);
create trigger trg_garbage_updated before update on garbage_schedules for each row execute function public.set_updated_at();

-- ── Telefones úteis ─────────────────────────────────────────────────────────

create table emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  category text not null,                      -- 'emergencia','utilidade','prefeitura','saude'
  name text not null,
  phone text not null,
  whatsapp text,
  short_dial text,                             -- '190','192','199'
  description text,
  hours text,
  display_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create index idx_contacts_city on emergency_contacts(city_id, category, active);

-- ── Farmácias e plantão ─────────────────────────────────────────────────────

create table pharmacies (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  whatsapp text,
  is_24h boolean default false,
  lat double precision,
  lng double precision,
  google_maps_url text,
  active boolean default true,
  created_at timestamptz default now()
);

create table pharmacy_shifts (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references pharmacies(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  shift_type text default 'plantao_24h',       -- plantao_24h | noturno
  notes text,
  created_at timestamptz default now()
);

create index idx_shifts_dates on pharmacy_shifts(start_date, end_date);

-- ── UBS e saúde ─────────────────────────────────────────────────────────────

create table health_facilities (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  district_id uuid references districts(id) on delete set null,
  name text not null,
  type text not null,                          -- ubs | hospital | upa | odonto | psf
  address text,
  phone text,
  hours text,
  services jsonb default '[]'::jsonb,          -- ['vacinacao','ginecologia','pediatria',...]
  lat double precision,
  lng double precision,
  active boolean default true,
  created_at timestamptz default now()
);

create table health_campaigns (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  title text not null,
  description text,
  target_group text,                            -- 'criancas','idosos','gestantes','geral'
  vaccine_or_topic text,
  start_at timestamptz,
  end_at timestamptz,
  location text,
  cover_url text,
  active boolean default true,
  created_at timestamptz default now()
);

-- ── Alertas (água, energia, trânsito) ──────────────────────────────────────

create table service_alerts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  type alert_kind not null,
  severity text default 'info',                -- info | warning | critical
  title text not null,
  description text,
  affected_area text,
  affected_district_ids uuid[],
  start_at timestamptz default now(),
  end_at timestamptz,
  source text,                                 -- 'cemig' | 'copasa' | 'prefeitura' | 'manual'
  source_url text,
  active boolean default true,
  created_at timestamptz default now()
);

create index idx_alerts_active on service_alerts(city_id, active, end_at);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table garbage_schedules    enable row level security;
alter table emergency_contacts   enable row level security;
alter table pharmacies           enable row level security;
alter table pharmacy_shifts      enable row level security;
alter table health_facilities    enable row level security;
alter table health_campaigns     enable row level security;
alter table service_alerts       enable row level security;

create policy "util_garbage_read"   on garbage_schedules  for select using (active);
create policy "util_garbage_admin"  on garbage_schedules  for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));

create policy "util_contacts_read"  on emergency_contacts for select using (active);
create policy "util_contacts_admin" on emergency_contacts for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));

create policy "util_pharm_read"     on pharmacies         for select using (active);
create policy "util_pharm_admin"    on pharmacies         for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));

create policy "util_shifts_read"    on pharmacy_shifts    for select using (true);
create policy "util_shifts_admin"   on pharmacy_shifts    for all using (public.is_city_admin((select city_id from pharmacies where id = pharmacy_id))) with check (public.is_city_admin((select city_id from pharmacies where id = pharmacy_id)));

create policy "util_health_read"    on health_facilities  for select using (active);
create policy "util_health_admin"   on health_facilities  for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));

create policy "util_camp_read"      on health_campaigns   for select using (active);
create policy "util_camp_admin"     on health_campaigns   for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));

create policy "util_alerts_read"    on service_alerts     for select using (active);
create policy "util_alerts_admin"   on service_alerts     for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));

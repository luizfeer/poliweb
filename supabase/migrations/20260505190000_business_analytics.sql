-- Eventos brutos de página de negócio
create table if not exists business_page_events (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  city_id       uuid not null references cities(id) on delete cascade,
  event_type    text not null, -- 'view' | 'phone_click' | 'whatsapp_click' | 'map_click' | 'website_click'
  session_id    text,
  occurred_at   timestamptz not null default now(),
  metadata      jsonb
);

create index if not exists business_page_events_business_idx on business_page_events(business_id, occurred_at desc);
create index if not exists business_page_events_occurred_idx on business_page_events(occurred_at);

alter table business_page_events enable row level security;

-- Qualquer usuário autenticado pode inserir eventos (via server action com service role)
-- Leitura restrita a admins e donos do negócio
create policy "admins can read business_page_events" on business_page_events
  for select using (
    is_city_admin(city_id)
    or manages_business(business_id)
  );


-- Agregados diários por negócio
create table if not exists business_daily_stats (
  business_id     uuid not null references businesses(id) on delete cascade,
  city_id         uuid not null references cities(id) on delete cascade,
  date            date not null,
  views           integer not null default 0,
  phone_clicks    integer not null default 0,
  whatsapp_clicks integer not null default 0,
  map_clicks      integer not null default 0,
  website_clicks  integer not null default 0,
  total_events    integer not null default 0,
  primary key (business_id, date)
);

create index if not exists business_daily_stats_city_date_idx on business_daily_stats(city_id, date desc);

alter table business_daily_stats enable row level security;

create policy "admins and owners can read business_daily_stats" on business_daily_stats
  for select using (
    is_city_admin(city_id)
    or manages_business(business_id)
  );


-- Ranking semanal por categoria
create table if not exists business_weekly_rank (
  business_id    uuid not null references businesses(id) on delete cascade,
  city_id        uuid not null references cities(id) on delete cascade,
  week_start     date not null,
  category_slug  text,
  district_id    uuid references districts(id) on delete set null,
  rank           integer not null,
  score          integer not null default 0,
  primary key (business_id, week_start)
);

create index if not exists business_weekly_rank_city_week_idx on business_weekly_rank(city_id, week_start desc);

alter table business_weekly_rank enable row level security;

create policy "anyone can read business_weekly_rank" on business_weekly_rank
  for select using (true);


-- RPC: agrega stats diários para uma data
create or replace function aggregate_business_daily_stats(p_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into business_daily_stats (
    business_id, city_id, date,
    views, phone_clicks, whatsapp_clicks, map_clicks, website_clicks, total_events
  )
  select
    e.business_id,
    e.city_id,
    p_date,
    count(*) filter (where e.event_type = 'view'),
    count(*) filter (where e.event_type = 'phone_click'),
    count(*) filter (where e.event_type = 'whatsapp_click'),
    count(*) filter (where e.event_type = 'map_click'),
    count(*) filter (where e.event_type = 'website_click'),
    count(*)
  from business_page_events e
  where e.occurred_at::date = p_date
  group by e.business_id, e.city_id
  on conflict (business_id, date) do update set
    views           = excluded.views,
    phone_clicks    = excluded.phone_clicks,
    whatsapp_clicks = excluded.whatsapp_clicks,
    map_clicks      = excluded.map_clicks,
    website_clicks  = excluded.website_clicks,
    total_events    = excluded.total_events;
end;
$$;


-- RPC: purga eventos com mais de 90 dias e retorna quantos deletou
create or replace function purge_old_business_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from business_page_events
  where occurred_at < now() - interval '90 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

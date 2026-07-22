-- ============================================================================
-- 0034 - Analytics de comerciante: eventos brutos, agregados diários e ranking
-- ============================================================================

-- Eventos brutos (rotacionados — TTL 90 dias)
create table if not exists public.business_page_events (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  city_id      uuid not null references public.cities(id),
  event_type   varchar(30) not null,
  -- 'view' | 'phone_click' | 'whatsapp_click' | 'website_click'
  -- | 'directions_click' | 'share' | 'favorite_add'
  session_hash varchar(64) not null,
  referrer     text,
  source       varchar(40),
  -- 'organic' | 'search' | 'category' | 'home_featured'
  occurred_at  timestamptz not null default now()
);

create index if not exists bpe_business_date_idx
  on public.business_page_events(business_id, occurred_at);

create index if not exists bpe_city_date_idx
  on public.business_page_events(city_id, occurred_at);

create index if not exists bpe_session_dedup_idx
  on public.business_page_events(session_hash, business_id, event_type, occurred_at);

-- Agregados diários (popular via cron de madrugada)
create table if not exists public.business_daily_stats (
  business_id     uuid not null references public.businesses(id) on delete cascade,
  city_id         uuid not null references public.cities(id),
  date            date not null,
  views           integer default 0,
  unique_visitors integer default 0,
  phone_clicks    integer default 0,
  whatsapp_clicks integer default 0,
  website_clicks  integer default 0,
  directions      integer default 0,
  shares          integer default 0,
  favorites       integer default 0,
  avg_dwell_ms    integer,
  primary key (business_id, date)
);

create index if not exists bds_city_date_idx
  on public.business_daily_stats(city_id, date desc);

create index if not exists bds_business_date_idx
  on public.business_daily_stats(business_id, date desc);

-- Ranking semanal pré-computado (top categoria/bairro)
create table if not exists public.business_weekly_rank (
  business_id  uuid not null references public.businesses(id),
  city_id      uuid not null references public.cities(id),
  week_start   date not null,
  category_id  uuid references public.business_categories(id),
  district_id  uuid references public.districts(id),
  views_rank   integer,
  views_pctile integer,
  primary key (business_id, week_start, category_id, district_id)
);

create index if not exists bwr_city_week_idx
  on public.business_weekly_rank(city_id, week_start desc);

-- RLS
alter table public.business_page_events enable row level security;
alter table public.business_daily_stats enable row level security;
alter table public.business_weekly_rank enable row level security;

-- Eventos: insert público (via API/Server Action), select só admin
-- dedup por session_hash + business_id + event_type em < 60s é feito no app

create policy "bpe_insert_anyone"
  on public.business_page_events for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.cities c
      where c.id = city_id
    )
  );

create policy "bpe_admin_read"
  on public.business_page_events for select
  to authenticated
  using (public.is_city_admin(city_id) or public.is_super_admin());

-- Stats: merchant vê seus, admin vê todos
create policy "bds_merchant_read"
  on public.business_daily_stats for select
  to authenticated
  using (
    public.is_city_admin(city_id) or public.is_super_admin() or
    exists(
      select 1 from public.businesses b
      where b.id = business_id
        and (
          b.owner_profile_id = auth.uid()
          or public.manages_business(b.id)
        )
    )
  );

create policy "bwr_merchant_read"
  on public.business_weekly_rank for select
  to authenticated
  using (
    public.is_city_admin(city_id) or public.is_super_admin() or
    exists(
      select 1 from public.businesses b
      where b.id = business_id
        and (
          b.owner_profile_id = auth.uid()
          or public.manages_business(b.id)
        )
    )
  );

-- RPC: agregar eventos do dia anterior
-- Chamado pelo cron de madrugada ou manualmente pelo admin
create or replace function public.aggregate_business_daily_stats(p_date date)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.business_daily_stats (
    business_id, city_id, date,
    views, unique_visitors,
    phone_clicks, whatsapp_clicks, website_clicks,
    directions, shares, favorites
  )
  select
    business_id,
    city_id,
    p_date,
    count(*) filter (where event_type = 'view'),
    count(distinct session_hash) filter (where event_type = 'view'),
    count(*) filter (where event_type = 'phone_click'),
    count(*) filter (where event_type = 'whatsapp_click'),
    count(*) filter (where event_type = 'website_click'),
    count(*) filter (where event_type = 'directions_click'),
    count(*) filter (where event_type = 'share'),
    count(*) filter (where event_type = 'favorite_add')
  from public.business_page_events
  where occurred_at >= p_date
    and occurred_at < p_date + interval '1 day'
  group by business_id, city_id
  on conflict (business_id, date) do update set
    views = excluded.views,
    unique_visitors = excluded.unique_visitors,
    phone_clicks = excluded.phone_clicks,
    whatsapp_clicks = excluded.whatsapp_clicks,
    website_clicks = excluded.website_clicks,
    directions = excluded.directions,
    shares = excluded.shares,
    favorites = excluded.favorites;
end;
$$;

-- RPC: limpar eventos brutos com mais de 90 dias
create or replace function public.purge_old_business_events()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.business_page_events
  where occurred_at < now() - interval '90 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- NOTA: Agregação e limpeza são executadas pelo worker Node.js em apps/worker
-- Não usar pg_cron — o worker já gerencia todos os jobs periódicos via systemd.

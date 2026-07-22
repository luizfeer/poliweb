-- ============================================================================
-- BOLETIM MENSAL DO NEGÓCIO — cache de relatório + RPCs de agregação
-- ============================================================================
-- "Seu mês: 320 visitas, 41 cliques no WhatsApp, 2º em Pizzarias."
-- Geração on-demand (sem cron): o painel gera quando o merchant abre um mês
-- fechado, agrega business_daily_stats + favoritos + rank na categoria, pede
-- um parágrafo amigável pro Haiku e guarda aqui (cache + histórico).
--
-- As RPCs são SECURITY DEFINER porque o cálculo cruza dados de terceiros:
--   - rank precisa somar stats de outros negócios da mesma categoria;
--   - favoritos: a RLS de business_favorites só deixa o próprio usuário ler.
-- O acesso é mediado pela Server Action, que confere manages_business antes.

create table public.business_monthly_reports (
  id            uuid primary key default gen_random_uuid(),
  city_id       uuid not null references public.cities(id) on delete cascade,
  business_id   uuid not null references public.businesses(id) on delete cascade,
  month         date not null,                      -- sempre dia 1 do mês
  metrics       jsonb not null default '{}'::jsonb, -- somatórios + prev (deltas)
  category_slug text,
  category_rank integer,
  category_size integer,
  ai_summary    text,
  ai_job_id     uuid references public.ai_jobs(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (business_id, month)
);

create index idx_monthly_reports_business on public.business_monthly_reports (business_id, month desc);
create index idx_monthly_reports_city on public.business_monthly_reports (city_id);

create trigger trg_monthly_reports_updated
  before update on public.business_monthly_reports
  for each row execute function public.set_updated_at();

alter table public.business_monthly_reports enable row level security;

create policy "monthly_reports_read" on public.business_monthly_reports for select
  using (public.manages_business(business_id) or public.is_city_admin(city_id));

create policy "monthly_reports_write" on public.business_monthly_reports for all
  using (public.manages_business(business_id) or public.is_city_admin(city_id))
  with check (public.manages_business(business_id) or public.is_city_admin(city_id));

-- ── RPC: somatórios do mês (business_daily_stats) ───────────────────────────
-- security definer cruza stats de terceiros: o guard manages_business garante
-- que o chamador só lê os próprios números (dono/manager/city_admin). Sem o
-- guard, qualquer um chamaria a RPC direto via PostgREST e leria métricas
-- alheias, pulando o assertManagesBusiness da Server Action.
create or replace function public.monthly_business_metrics(p_business_id uuid, p_month date)
returns table (
  views bigint, phone_clicks bigint, whatsapp_clicks bigint,
  map_clicks bigint, website_clicks bigint, total_events bigint
)
language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(views), 0),
    coalesce(sum(phone_clicks), 0),
    coalesce(sum(whatsapp_clicks), 0),
    coalesce(sum(map_clicks), 0),
    coalesce(sum(website_clicks), 0),
    coalesce(sum(total_events), 0)
  from business_daily_stats
  where business_id = p_business_id
    and public.manages_business(p_business_id)
    and date >= date_trunc('month', p_month)
    and date <  (date_trunc('month', p_month) + interval '1 month');
$$;

-- ── RPC: favoritos novos no mês ─────────────────────────────────────────────
create or replace function public.monthly_favorites_count(p_business_id uuid, p_month date)
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int
  from business_favorites
  where business_id = p_business_id
    and public.manages_business(p_business_id)
    and created_at >= date_trunc('month', p_month)
    and created_at <  (date_trunc('month', p_month) + interval '1 month');
$$;

-- ── RPC: rank por views na categoria primária, no mês ───────────────────────
create or replace function public.monthly_category_rank(p_business_id uuid, p_month date)
returns table (category_slug text, rank int, category_size int)
language plpgsql stable security definer set search_path = public as $$
declare
  v_cat uuid;
begin
  -- Guard: só quem gerencia o negócio enxerga o próprio ranking.
  if not public.manages_business(p_business_id) then
    return;
  end if;

  select category_id into v_cat
  from business_category_assignments
  where business_id = p_business_id and is_primary = true
  limit 1;

  if v_cat is null then
    return;
  end if;

  return query
  with sums as (
    select bca.business_id, coalesce(sum(s.views), 0) as v
    from business_category_assignments bca
    left join business_daily_stats s
      on s.business_id = bca.business_id
     and s.date >= date_trunc('month', p_month)
     and s.date <  (date_trunc('month', p_month) + interval '1 month')
    where bca.category_id = v_cat and bca.is_primary = true
    group by bca.business_id
  ), ranked as (
    select business_id,
           rank() over (order by v desc) as r,
           count(*) over () as n
    from sums
  )
  select
    (select slug from business_categories where id = v_cat),
    (select r::int from ranked where business_id = p_business_id),
    (select max(n)::int from ranked);
end;
$$;

-- security definer + revoke do anon/public: além do guard manages_business, nega
-- o EXECUTE default a quem não está logado. A Server Action usa o cliente
-- authenticated (passa o JWT, então auth.uid() resolve dentro das funções).
revoke all on function public.monthly_business_metrics(uuid, date) from public, anon;
revoke all on function public.monthly_favorites_count(uuid, date) from public, anon;
revoke all on function public.monthly_category_rank(uuid, date) from public, anon;
grant execute on function public.monthly_business_metrics(uuid, date) to authenticated, service_role;
grant execute on function public.monthly_favorites_count(uuid, date) to authenticated, service_role;
grant execute on function public.monthly_category_rank(uuid, date) to authenticated, service_role;

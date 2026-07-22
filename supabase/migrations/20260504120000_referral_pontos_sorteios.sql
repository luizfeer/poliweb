-- ============================================================================
-- Sprint 11 — Sistema de indicação + pontos + sorteios
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabelas
-- ----------------------------------------------------------------------------

create table public.referral_codes (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  city_id     uuid not null references public.cities(id) on delete cascade,
  code        varchar(10) not null,
  created_at  timestamptz not null default now(),
  unique (code, city_id),
  unique (profile_id, city_id)
);

create table public.referral_conversions (
  id                  uuid primary key default gen_random_uuid(),
  referral_code       varchar(10) not null,
  referrer_profile_id uuid not null references public.profiles(id),
  referred_profile_id uuid not null references public.profiles(id),
  city_id             uuid not null references public.cities(id),
  converted_at        timestamptz not null default now(),
  unique (referred_profile_id, city_id)
);

create index referral_conversions_referrer_idx
  on public.referral_conversions(referrer_profile_id, city_id);

create table public.citizen_points (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  city_id         uuid not null references public.cities(id) on delete cascade,
  balance         integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0,
  updated_at      timestamptz not null default now(),
  unique (profile_id, city_id)
);

create table public.point_transactions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id),
  city_id       uuid not null references public.cities(id),
  delta         integer not null,
  reason        varchar(60) not null,
  reference_id  uuid,
  balance_after integer not null,
  created_at    timestamptz not null default now()
);

create index point_transactions_profile_idx
  on public.point_transactions(profile_id, city_id, created_at desc);

create table public.raffles (
  id                      uuid primary key default gen_random_uuid(),
  city_id                 uuid not null references public.cities(id),
  slug                    varchar(120) not null,
  title                   varchar(200) not null,
  description             text,
  prize_description       text not null,
  prize_value_cents       integer,
  cover_url               text,
  sponsor_business_id     uuid references public.businesses(id),
  entry_cost_points       integer not null default 100 check (entry_cost_points > 0),
  max_entries_per_profile integer not null default 5 check (max_entries_per_profile > 0),
  draw_at                 timestamptz not null,
  drawn_at                timestamptz,
  winner_profile_id       uuid references public.profiles(id),
  status                  varchar(20) not null default 'draft'
    check (status in ('draft', 'active', 'drawn', 'cancelled')),
  created_by_profile_id   uuid references public.profiles(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (slug, city_id)
);

create index raffles_city_status_idx on public.raffles(city_id, status, draw_at);

create table public.raffle_entries (
  id            uuid primary key default gen_random_uuid(),
  raffle_id     uuid not null references public.raffles(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id),
  city_id       uuid not null references public.cities(id),
  points_spent  integer not null check (points_spent > 0),
  entries_count integer not null default 1 check (entries_count > 0),
  created_at    timestamptz not null default now()
);

create index raffle_entries_raffle_idx on public.raffle_entries(raffle_id);
create index raffle_entries_profile_idx on public.raffle_entries(profile_id, raffle_id);

-- ----------------------------------------------------------------------------
-- 2. RLS
-- ----------------------------------------------------------------------------

alter table public.referral_codes        enable row level security;
alter table public.referral_conversions  enable row level security;
alter table public.citizen_points        enable row level security;
alter table public.point_transactions    enable row level security;
alter table public.raffles               enable row level security;
alter table public.raffle_entries        enable row level security;

-- referral_codes: o próprio usuário lê/escreve o seu
create policy "referral_codes_own" on public.referral_codes
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- referral_conversions: referidor, referido ou admin da cidade leem
create policy "referral_conversions_read" on public.referral_conversions
  for select using (
    referrer_profile_id = auth.uid()
    or referred_profile_id = auth.uid()
    or public.is_city_admin(city_id)
  );

-- citizen_points: dono ou admin
create policy "citizen_points_read" on public.citizen_points
  for select using (
    profile_id = auth.uid() or public.is_city_admin(city_id)
  );

-- point_transactions: dono ou admin
create policy "point_transactions_read" on public.point_transactions
  for select using (
    profile_id = auth.uid() or public.is_city_admin(city_id)
  );

-- raffles: público lê ativos/sorteados; admin gerencia tudo
create policy "raffles_public_read" on public.raffles
  for select using (status in ('active', 'drawn'));

create policy "raffles_admin_all" on public.raffles
  for all using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));

-- raffle_entries: dono ou admin lê; insere o próprio
create policy "raffle_entries_own_read" on public.raffle_entries
  for select using (
    profile_id = auth.uid() or public.is_city_admin(city_id)
  );

create policy "raffle_entries_own_insert" on public.raffle_entries
  for insert with check (profile_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. Funções
-- ----------------------------------------------------------------------------

-- Crédita/debita pontos atomicamente e registra a transação
create or replace function public.award_points(
  p_profile_id uuid,
  p_city_id    uuid,
  p_delta      integer,
  p_reason     varchar,
  p_reference  uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_balance integer;
begin
  if p_delta = 0 then
    raise exception 'delta_zero_not_allowed';
  end if;

  insert into public.citizen_points (profile_id, city_id, balance, lifetime_earned)
  values (
    p_profile_id, p_city_id,
    greatest(0, p_delta),
    greatest(0, p_delta)
  )
  on conflict (profile_id, city_id) do update
    set balance         = public.citizen_points.balance + p_delta,
        lifetime_earned = public.citizen_points.lifetime_earned + greatest(0, p_delta),
        updated_at      = now()
  returning balance into v_balance;

  insert into public.point_transactions (
    profile_id, city_id, delta, reason, reference_id, balance_after
  )
  values (p_profile_id, p_city_id, p_delta, p_reason, p_reference, v_balance);

  return v_balance;
end;
$$;

revoke all on function public.award_points(uuid, uuid, integer, varchar, uuid) from public, anon;
grant execute on function public.award_points(uuid, uuid, integer, varchar, uuid) to authenticated, service_role;

-- Gera ou recupera código de indicação do usuário (idempotente)
create or replace function public.generate_referral_code(
  p_profile_id uuid,
  p_city_id    uuid
)
returns varchar
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code   varchar;
  v_exists boolean;
  v_tries  integer := 0;
begin
  select code into v_code
  from public.referral_codes
  where profile_id = p_profile_id and city_id = p_city_id;

  if v_code is not null then
    return v_code;
  end if;

  loop
    v_tries := v_tries + 1;
    if v_tries > 20 then
      raise exception 'could_not_generate_unique_code';
    end if;

    v_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    select exists (
      select 1 from public.referral_codes
      where code = v_code and city_id = p_city_id
    ) into v_exists;

    exit when not v_exists;
  end loop;

  insert into public.referral_codes (profile_id, city_id, code)
  values (p_profile_id, p_city_id, v_code)
  on conflict (profile_id, city_id) do update
    set code = public.referral_codes.code
  returning code into v_code;

  return v_code;
end;
$$;

revoke all on function public.generate_referral_code(uuid, uuid) from public, anon;
grant execute on function public.generate_referral_code(uuid, uuid) to authenticated, service_role;

-- Sorteia o ganhador de um sorteio ativo (ponderado por entries_count)
create or replace function public.draw_raffle_winner(p_raffle_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_winner  uuid;
  v_city_id uuid;
begin
  select city_id into v_city_id
  from public.raffles
  where id = p_raffle_id and status = 'active';

  if v_city_id is null then
    raise exception 'raffle_not_active';
  end if;

  with expanded as (
    select e.profile_id
    from public.raffle_entries e, generate_series(1, e.entries_count)
    where e.raffle_id = p_raffle_id
  )
  select profile_id into v_winner
  from expanded
  order by random()
  limit 1;

  update public.raffles set
    winner_profile_id = v_winner,
    drawn_at          = now(),
    status            = 'drawn',
    updated_at        = now()
  where id = p_raffle_id;

  return v_winner;
end;
$$;

revoke all on function public.draw_raffle_winner(uuid) from public, anon;
grant execute on function public.draw_raffle_winner(uuid) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. Trigger updated_at em raffles (usa set_updated_at existente do core)
-- ----------------------------------------------------------------------------

create trigger trg_raffles_updated
  before update on public.raffles
  for each row
  execute function public.set_updated_at();

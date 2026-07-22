-- ============================================================================
-- 0025 - Classifieds: specialized details, approval cycle, reports and pricing
-- ============================================================================

do $$ begin
  create type classified_payment_status as enum ('not_required', 'pending', 'paid', 'waived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type classified_review_status as enum ('pending', 'approved', 'rejected', 'needs_changes');
exception when duplicate_object then null; end $$;

do $$ begin
  create type classified_job_contract_kind as enum ('clt', 'pj', 'temporario');
exception when duplicate_object then null; end $$;

do $$ begin
  create type classified_job_work_mode as enum ('presencial', 'remoto', 'hibrido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type classified_item_condition as enum ('novo', 'seminovo', 'usado');
exception when duplicate_object then null; end $$;

alter table public.classifieds
  add column if not exists slug text,
  add column if not exists payment_status classified_payment_status not null default 'not_required',
  add column if not exists payment_amount_cents int not null default 0 check (payment_amount_cents >= 0),
  add column if not exists payment_provider_ref text,
  add column if not exists review_status classified_review_status not null default 'pending',
  add column if not exists rejection_reason text,
  add column if not exists review_decided_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists review_decided_at timestamptz,
  add column if not exists sold_at timestamptz,
  add column if not exists featured_until timestamptz;

update public.classifieds
set slug = coalesce(
  slug,
  lower(regexp_replace(regexp_replace(title, '[^[:alnum:]]+', '-', 'g'), '(^-|-$)', '', 'g')) || '-' || left(id::text, 8)
)
where slug is null;

alter table public.classifieds
  alter column slug set not null;

do $$ begin
  alter table public.classifieds add constraint classifieds_city_slug_key unique (city_id, slug);
exception when duplicate_object then null; end $$;

update public.classifieds
set review_status = 'approved'
where status = 'published' and review_status = 'pending';

create table if not exists public.classified_vehicles (
  classified_id uuid primary key references public.classifieds(id) on delete cascade,
  marca text not null,
  modelo text not null,
  ano_modelo int check (ano_modelo between 1950 and 2100),
  ano_fabricacao int check (ano_fabricacao between 1950 and 2100),
  km int check (km >= 0),
  combustivel text,
  cambio text,
  cor text,
  placa_final text check (placa_final is null or placa_final ~ '^[0-9]$'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.classified_jobs (
  classified_id uuid primary key references public.classifieds(id) on delete cascade,
  tipo classified_job_contract_kind not null,
  faixa_salarial text,
  modalidade classified_job_work_mode not null default 'presencial',
  beneficios jsonb default '[]'::jsonb,
  requisitos text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.classified_services (
  classified_id uuid primary key references public.classifieds(id) on delete cascade,
  area_atuacao text not null,
  atende_em_casa boolean not null default false,
  raio_atendimento_km int check (raio_atendimento_km is null or raio_atendimento_km >= 0),
  faixa_preco text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.classified_items (
  classified_id uuid primary key references public.classifieds(id) on delete cascade,
  condicao classified_item_condition not null default 'usado',
  marca text,
  aceita_troca boolean not null default false,
  motivo_venda text,
  is_free_item boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.classified_reports (
  id uuid primary key default gen_random_uuid(),
  classified_id uuid not null references public.classifieds(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete restrict,
  reporter_profile_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'golpe', 'inadequado', 'incorreto')),
  notes text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique (classified_id, reporter_profile_id)
);

create index if not exists idx_classifieds_city_type_review_created
  on public.classifieds(city_id, type, review_status, created_at desc);

create index if not exists idx_classifieds_public
  on public.classifieds(city_id, type, created_at desc)
  where status = 'published' and review_status = 'approved';

create index if not exists idx_classifieds_payment_ref
  on public.classifieds(payment_provider_ref)
  where payment_provider_ref is not null;

create index if not exists idx_classified_reports_classified_created
  on public.classified_reports(classified_id, created_at desc);

alter table public.classified_vehicles enable row level security;
alter table public.classified_jobs enable row level security;
alter table public.classified_services enable row level security;
alter table public.classified_items enable row level security;
alter table public.classified_reports enable row level security;

drop policy if exists "classifieds_read" on public.classifieds;
create policy "classifieds_read" on public.classifieds for select using (
  (
    status = 'published'
    and review_status = 'approved'
    and (expires_at is null or expires_at > now())
  )
  or author_profile_id = auth.uid()
  or public.is_city_admin(city_id)
);

drop policy if exists "classified_details_read" on public.classified_vehicles;
create policy "classified_details_read" on public.classified_vehicles for select using (
  exists (select 1 from public.classifieds c where c.id = classified_id)
);

drop policy if exists "classified_jobs_read" on public.classified_jobs;
create policy "classified_jobs_read" on public.classified_jobs for select using (
  exists (select 1 from public.classifieds c where c.id = classified_id)
);

drop policy if exists "classified_services_read" on public.classified_services;
create policy "classified_services_read" on public.classified_services for select using (
  exists (select 1 from public.classifieds c where c.id = classified_id)
);

drop policy if exists "classified_items_read" on public.classified_items;
create policy "classified_items_read" on public.classified_items for select using (
  exists (select 1 from public.classifieds c where c.id = classified_id)
);

drop policy if exists "classified_vehicles_write" on public.classified_vehicles;
create policy "classified_vehicles_write" on public.classified_vehicles for all to authenticated using (
  exists (
    select 1 from public.classifieds c
    where c.id = classified_id
      and (c.author_profile_id = auth.uid() or public.is_city_admin(c.city_id))
  )
) with check (
  exists (
    select 1 from public.classifieds c
    where c.id = classified_id
      and (c.author_profile_id = auth.uid() or public.is_city_admin(c.city_id))
  )
);

drop policy if exists "classified_jobs_write" on public.classified_jobs;
create policy "classified_jobs_write" on public.classified_jobs for all to authenticated using (
  exists (
    select 1 from public.classifieds c
    where c.id = classified_id
      and (c.author_profile_id = auth.uid() or public.is_city_admin(c.city_id))
  )
) with check (
  exists (
    select 1 from public.classifieds c
    where c.id = classified_id
      and (c.author_profile_id = auth.uid() or public.is_city_admin(c.city_id))
  )
);

drop policy if exists "classified_services_write" on public.classified_services;
create policy "classified_services_write" on public.classified_services for all to authenticated using (
  exists (
    select 1 from public.classifieds c
    where c.id = classified_id
      and (c.author_profile_id = auth.uid() or public.is_city_admin(c.city_id))
  )
) with check (
  exists (
    select 1 from public.classifieds c
    where c.id = classified_id
      and (c.author_profile_id = auth.uid() or public.is_city_admin(c.city_id))
  )
);

drop policy if exists "classified_items_write" on public.classified_items;
create policy "classified_items_write" on public.classified_items for all to authenticated using (
  exists (
    select 1 from public.classifieds c
    where c.id = classified_id
      and (c.author_profile_id = auth.uid() or public.is_city_admin(c.city_id))
  )
) with check (
  exists (
    select 1 from public.classifieds c
    where c.id = classified_id
      and (c.author_profile_id = auth.uid() or public.is_city_admin(c.city_id))
  )
);

drop policy if exists "classified_reports_self_insert" on public.classified_reports;
create policy "classified_reports_self_insert" on public.classified_reports for insert to authenticated with check (
  reporter_profile_id = auth.uid()
  and exists (
    select 1 from public.classifieds c
    where c.id = classified_id
      and c.city_id = city_id
      and c.status = 'published'
      and c.review_status = 'approved'
  )
);

drop policy if exists "classified_reports_read" on public.classified_reports;
create policy "classified_reports_read" on public.classified_reports for select to authenticated using (
  reporter_profile_id = auth.uid() or public.is_city_admin(city_id)
);

drop policy if exists "classified_reports_admin_update" on public.classified_reports;
create policy "classified_reports_admin_update" on public.classified_reports for update to authenticated using (
  public.is_city_admin(city_id)
) with check (
  public.is_city_admin(city_id)
);

create or replace function public.auto_unpublish_classified_after_reports()
returns trigger
language plpgsql
security definer
as $$
declare
  recent_reports int;
begin
  select count(*)
  into recent_reports
  from public.classified_reports
  where classified_id = new.classified_id
    and created_at >= now() - interval '24 hours';

  if recent_reports >= 3 then
    update public.classifieds
    set status = 'pending',
        review_status = 'pending',
        updated_at = now()
    where id = new.classified_id
      and status = 'published';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_classified_reports_auto_unpublish on public.classified_reports;
create trigger trg_classified_reports_auto_unpublish
after insert on public.classified_reports
for each row execute function public.auto_unpublish_classified_after_reports();

create or replace function public.archive_expired_classifieds()
returns integer
language plpgsql
security definer
as $$
declare
  archived_count integer;
begin
  update public.classifieds
  set status = 'archived',
      updated_at = now()
  where status = 'published'
    and expires_at is not null
    and expires_at < now();

  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;

update public.city_modules
set config = coalesce(config, '{}'::jsonb)
  || jsonb_build_object(
    'classifieds_payment_active', false,
    'pricing_cents', jsonb_build_object(
      'item', 5000,
      'vehicle', 5000,
      'service', 1000,
      'job', 0,
      'other', 0
    )
  )
where module_key = 'classifieds'
  and not (coalesce(config, '{}'::jsonb) ? 'classifieds_payment_active');

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.unschedule('archive_expired_classifieds');
    perform cron.schedule('archive_expired_classifieds', '20 3 * * *', 'select public.archive_expired_classifieds();');
  end if;
exception when others then
  null;
end $$;

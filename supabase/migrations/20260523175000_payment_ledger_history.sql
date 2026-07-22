do $$ begin
  create type portal_payment_provider as enum ('asaas');
exception when duplicate_object then null; end $$;

do $$ begin
  create type portal_payment_status as enum (
    'pending',
    'paid',
    'overdue',
    'failed',
    'cancelled',
    'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type portal_payment_source as enum (
    'business_subscription',
    'feature_order',
    'publication',
    'manual',
    'unknown'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.portal_payments (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  provider portal_payment_provider not null default 'asaas',
  provider_payment_id text,
  provider_subscription_id text,
  provider_customer_id text,
  source_type portal_payment_source not null default 'unknown',
  source_id uuid,
  entity_type text,
  entity_id uuid,
  description text,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  net_amount_cents integer check (net_amount_cents is null or net_amount_cents >= 0),
  status portal_payment_status not null default 'pending',
  billing_type text,
  invoice_url text,
  due_date date,
  paid_at timestamptz,
  external_reference text,
  asaas_raw jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists portal_payments_provider_payment_uidx
  on public.portal_payments (provider, provider_payment_id)
  where provider_payment_id is not null;

create index if not exists portal_payments_profile_created_idx
  on public.portal_payments (profile_id, created_at desc);

create index if not exists portal_payments_city_status_due_idx
  on public.portal_payments (city_id, status, due_date desc nulls last);

create index if not exists portal_payments_subscription_idx
  on public.portal_payments (provider_subscription_id, due_date desc nulls last)
  where provider_subscription_id is not null;

create index if not exists portal_payments_source_idx
  on public.portal_payments (source_type, source_id)
  where source_id is not null;

alter table public.portal_payments enable row level security;

drop policy if exists "portal_payments_owner_read" on public.portal_payments;
create policy "portal_payments_owner_read"
  on public.portal_payments
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or public.is_super_admin()
    or (city_id is not null and public.is_city_admin(city_id))
  );

create table if not exists public.portal_payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.portal_payments(id) on delete cascade,
  asaas_webhook_event_id uuid references public.asaas_webhook_events(id) on delete set null,
  provider portal_payment_provider not null default 'asaas',
  provider_event_id text,
  event_type text not null,
  provider_status text,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists portal_payment_events_payment_idx
  on public.portal_payment_events (payment_id, created_at desc);

create index if not exists portal_payment_events_provider_event_idx
  on public.portal_payment_events (provider_event_id)
  where provider_event_id is not null;

alter table public.portal_payment_events enable row level security;

drop policy if exists "portal_payment_events_owner_read" on public.portal_payment_events;
create policy "portal_payment_events_owner_read"
  on public.portal_payment_events
  for select
  to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1
      from public.portal_payments p
      where p.id = portal_payment_events.payment_id
        and (
          p.profile_id = auth.uid()
          or (p.city_id is not null and public.is_city_admin(p.city_id))
        )
    )
  );

alter table public.asaas_webhook_events
  add column if not exists portal_payment_id uuid references public.portal_payments(id) on delete set null;

create index if not exists asaas_webhook_events_portal_payment_idx
  on public.asaas_webhook_events (portal_payment_id)
  where portal_payment_id is not null;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_portal_payments_updated_at on public.portal_payments;
create trigger trg_portal_payments_updated_at
before update on public.portal_payments
for each row execute function public.set_updated_at_timestamp();

insert into public.portal_payments (
  city_id,
  profile_id,
  provider_payment_id,
  provider_subscription_id,
  provider_customer_id,
  source_type,
  source_id,
  entity_type,
  entity_id,
  description,
  amount_cents,
  status,
  billing_type,
  invoice_url,
  external_reference,
  metadata,
  created_at,
  updated_at
)
select
  fo.city_id,
  fo.profile_id,
  fo.asaas_payment_id,
  null,
  fo.asaas_customer_id,
  'feature_order'::portal_payment_source,
  fo.id,
  fo.target_type::text,
  fo.target_id,
  'Destaque pago',
  fo.amount_cents,
  case
    when fo.status = 'paid' then 'paid'::portal_payment_status
    when fo.status = 'refunded' then 'refunded'::portal_payment_status
    when fo.status = 'expired' then 'overdue'::portal_payment_status
    when fo.status = 'failed' then 'failed'::portal_payment_status
    else 'pending'::portal_payment_status
  end,
  fo.billing_type,
  fo.asaas_invoice_url,
  concat('feature_order:', fo.id),
  jsonb_build_object('duration_days', fo.duration_days, 'granted_until', fo.granted_until),
  fo.created_at,
  fo.updated_at
from public.feature_orders fo
where fo.asaas_payment_id is not null
on conflict (provider, provider_payment_id) where provider_payment_id is not null do update
set
  status = excluded.status,
  invoice_url = excluded.invoice_url,
  updated_at = now();

insert into public.portal_payments (
  city_id,
  profile_id,
  provider_payment_id,
  source_type,
  entity_type,
  entity_id,
  description,
  amount_cents,
  status,
  external_reference,
  created_at,
  updated_at
)
select
  c.city_id,
  c.author_profile_id,
  c.payment_provider_ref,
  'publication'::portal_payment_source,
  'classified',
  c.id,
  c.title,
  coalesce(c.payment_amount_cents, 0),
  case
    when c.payment_status = 'paid' then 'paid'::portal_payment_status
    when c.payment_status = 'waived' then 'cancelled'::portal_payment_status
    else 'pending'::portal_payment_status
  end,
  concat('publication:classified:', c.id),
  c.created_at,
  c.updated_at
from public.classifieds c
where c.payment_provider_ref is not null
on conflict (provider, provider_payment_id) where provider_payment_id is not null do update
set
  status = excluded.status,
  updated_at = now();

insert into public.portal_payments (
  city_id,
  profile_id,
  provider_payment_id,
  source_type,
  entity_type,
  entity_id,
  description,
  amount_cents,
  status,
  external_reference,
  created_at,
  updated_at
)
select
  p.city_id,
  p.owner_profile_id,
  p.payment_provider_ref,
  'publication'::portal_payment_source,
  'property',
  p.id,
  p.title,
  coalesce(p.payment_amount_cents, 0),
  case
    when p.payment_status = 'paid' then 'paid'::portal_payment_status
    when p.payment_status = 'waived' then 'cancelled'::portal_payment_status
    else 'pending'::portal_payment_status
  end,
  concat('publication:property:', p.id),
  p.created_at,
  p.updated_at
from public.properties p
where p.payment_provider_ref is not null
on conflict (provider, provider_payment_id) where provider_payment_id is not null do update
set
  status = excluded.status,
  updated_at = now();

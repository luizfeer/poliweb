create table if not exists public.business_plans (
  slug text primary key,
  name text not null,
  description text not null,
  monthly_value_cents integer not null check (monthly_value_cents >= 0),
  features jsonb not null default '[]'::jsonb,
  highlight boolean not null default false,
  display_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'coming_soon', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_plans enable row level security;

drop policy if exists "anyone can read business_plans" on public.business_plans;
create policy "anyone can read business_plans"
  on public.business_plans
  for select
  to anon, authenticated
  using (status <> 'archived');

insert into public.business_plans (slug, name, description, monthly_value_cents, features, highlight, display_order, status)
values
  (
    'basico',
    'Básico',
    'Ficha completa do seu comércio no portal — para começar.',
    1990,
    jsonb_build_array(
      'Ficha pública completa: fotos, horário, mapa, WhatsApp',
      'Posts e novidades do comércio',
      'Receber avaliações dos clientes',
      'Painel pra editar e atualizar quando quiser'
    ),
    false,
    1,
    'active'
  ),
  (
    'destaque',
    'Destaque',
    'Para aparecer primeiro e ser mais encontrado.',
    4900,
    jsonb_build_array(
      'Tudo do plano Básico',
      'Selo verificado',
      'Prioridade em buscas e listagens da categoria',
      'Badge "Em destaque" na home',
      'Suporte prioritário por WhatsApp'
    ),
    true,
    2,
    'active'
  ),
  (
    'anuncio',
    'Com anúncio',
    'Para quem quer máxima visibilidade na cidade. Em breve.',
    8990,
    jsonb_build_array(
      'Tudo do plano Destaque',
      'Slot rotativo de anúncio (home, comércio e assistente)',
      'Uma promoção em destaque por mês'
    ),
    false,
    3,
    'coming_soon'
  )
on conflict (slug) do update
  set
    name = excluded.name,
    description = excluded.description,
    monthly_value_cents = excluded.monthly_value_cents,
    features = excluded.features,
    highlight = excluded.highlight,
    display_order = excluded.display_order,
    status = excluded.status,
    updated_at = now();

drop policy if exists "owner can insert business_leads" on public.business_leads;

alter table public.business_leads
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id,
  drop column if exists stripe_subscription_status;

alter table public.business_leads
  add column if not exists plan_slug text references public.business_plans(slug) on delete set null,
  add column if not exists document text,
  add column if not exists asaas_customer_id text,
  add column if not exists asaas_subscription_id text,
  add column if not exists asaas_subscription_status text,
  add column if not exists asaas_next_due_date date,
  add column if not exists asaas_payment_link text;

create index if not exists business_leads_asaas_customer_idx
  on public.business_leads (asaas_customer_id)
  where asaas_customer_id is not null;

create index if not exists business_leads_asaas_subscription_idx
  on public.business_leads (asaas_subscription_id)
  where asaas_subscription_id is not null;

drop policy if exists "owner can insert business_leads" on public.business_leads;
create policy "owner can insert business_leads"
  on public.business_leads
  for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    and consent = true
    and status = 'pending'
    and approved_at is null
    and approved_by is null
    and asaas_customer_id is null
    and asaas_subscription_id is null
  );

create table if not exists public.asaas_webhook_events (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  event_type text not null,
  event_id text,
  payment_id text,
  subscription_id text,
  customer_id text,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  error_message text
);

create index if not exists asaas_webhook_events_event_id_idx
  on public.asaas_webhook_events (event_id)
  where event_id is not null;

create index if not exists asaas_webhook_events_subscription_idx
  on public.asaas_webhook_events (subscription_id)
  where subscription_id is not null;

alter table public.asaas_webhook_events enable row level security;

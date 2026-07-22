-- Approval flow para business_leads:
--  * `business_id` liga o lead à ficha criada no momento da aprovação
--  * nudges de fim de trial (D-7 e D-2) para o merchant
--  * marcador de despublicação por inadimplência (5 dias após overdue)

alter table public.business_leads
  add column if not exists business_id uuid references public.businesses(id) on delete set null,
  add column if not exists nudge_d7_sent_at timestamptz,
  add column if not exists nudge_d2_sent_at timestamptz,
  add column if not exists overdue_unpublished_at timestamptz;

create index if not exists business_leads_business_id_idx
  on public.business_leads (business_id);

create index if not exists business_leads_trial_ends_at_idx
  on public.business_leads (trial_ends_at)
  where status = 'approved';

create index if not exists business_leads_asaas_status_idx
  on public.business_leads (asaas_subscription_status)
  where asaas_subscription_status is not null;

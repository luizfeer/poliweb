alter table public.business_leads
  add column if not exists free_forever boolean not null default false,
  add column if not exists free_reason text;

create index if not exists business_leads_free_forever_idx
  on public.business_leads (free_forever)
  where free_forever = true;

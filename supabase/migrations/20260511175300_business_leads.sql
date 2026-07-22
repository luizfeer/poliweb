create table if not exists public.business_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  city_id uuid not null references public.cities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  whatsapp text,
  category_hint text,
  address text,
  website text,
  instagram text,
  message text,
  consent boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'converted')),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  rejected_reason text,
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  notes text
);

create index if not exists business_leads_city_status_idx
  on public.business_leads (city_id, status, created_at desc);

create index if not exists business_leads_profile_idx
  on public.business_leads (profile_id, created_at desc);

create unique index if not exists business_leads_active_per_profile_city
  on public.business_leads (profile_id, city_id)
  where status in ('pending', 'approved');

create or replace function public.business_leads_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists business_leads_set_updated_at on public.business_leads;
create trigger business_leads_set_updated_at
  before update on public.business_leads
  for each row execute function public.business_leads_set_updated_at();

alter table public.business_leads enable row level security;

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
    and stripe_customer_id is null
    and stripe_subscription_id is null
  );

drop policy if exists "owner can read own business_leads" on public.business_leads;
create policy "owner can read own business_leads"
  on public.business_leads
  for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "city admins can read business_leads" on public.business_leads;
create policy "city admins can read business_leads"
  on public.business_leads
  for select
  to authenticated
  using (public.is_city_admin(city_id));

drop policy if exists "city admins can update business_leads" on public.business_leads;
create policy "city admins can update business_leads"
  on public.business_leads
  for update
  to authenticated
  using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));

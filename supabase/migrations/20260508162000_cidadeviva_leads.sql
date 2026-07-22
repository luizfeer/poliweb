create table if not exists public.cidadeviva_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'cidadeviva_lp',
  name text,
  email text not null,
  phone text,
  business_name text,
  city text,
  message text,
  consent boolean not null default false,
  page_path text,
  user_agent text
);

alter table public.cidadeviva_leads enable row level security;

grant insert on public.cidadeviva_leads to anon;
grant select on public.cidadeviva_leads to authenticated;

drop policy if exists "anon can create cidadeviva leads" on public.cidadeviva_leads;
create policy "anon can create cidadeviva leads"
  on public.cidadeviva_leads
  for insert
  to anon
  with check (
    consent = true
    and length(email) between 5 and 320
  );

drop policy if exists "authenticated admins can read cidadeviva leads" on public.cidadeviva_leads;
create policy "authenticated admins can read cidadeviva leads"
  on public.cidadeviva_leads
  for select
  to authenticated
  using (true);

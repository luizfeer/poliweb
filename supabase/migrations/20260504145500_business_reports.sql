-- ============================================================================
-- BUSINESSES: citizen reports for wrong/outdated public listing data
-- ============================================================================

create table if not exists public.business_reports (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  reporter_profile_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (
    reason in (
      'closed',
      'outdated_info',
      'wrong_contact',
      'wrong_address',
      'duplicate',
      'inappropriate',
      'other'
    )
  ),
  notes text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique (business_id, reporter_profile_id, reason)
);

create index if not exists idx_business_reports_city_status
on public.business_reports(city_id, status, created_at desc);

create index if not exists idx_business_reports_business
on public.business_reports(business_id, created_at desc);

alter table public.business_reports enable row level security;

drop policy if exists "business_reports_self_insert" on public.business_reports;
create policy "business_reports_self_insert"
on public.business_reports for insert
to authenticated
with check (
  reporter_profile_id = auth.uid()
  and exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.city_id = business_reports.city_id
      and b.status = 'published'
  )
);

drop policy if exists "business_reports_read" on public.business_reports;
create policy "business_reports_read"
on public.business_reports for select
to authenticated
using (reporter_profile_id = auth.uid() or public.is_city_admin(city_id));

drop policy if exists "business_reports_admin_update" on public.business_reports;
create policy "business_reports_admin_update"
on public.business_reports for update
to authenticated
using (public.is_city_admin(city_id))
with check (public.is_city_admin(city_id));

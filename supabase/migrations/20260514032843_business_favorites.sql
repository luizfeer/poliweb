create table public.business_favorites (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (profile_id, business_id)
);

create index idx_business_favorites_business on public.business_favorites(business_id, created_at desc);

alter table public.business_favorites enable row level security;

create policy "business_favorites_self" on public.business_favorites for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

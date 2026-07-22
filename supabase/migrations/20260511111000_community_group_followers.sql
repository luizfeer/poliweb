-- ============================================================================
-- 0022 - COMMUNITY GROUP FOLLOWERS: seguir grupos e coletivos
-- ============================================================================

create table if not exists public.community_group_followers (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  group_id uuid not null references public.community_groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'follower' check (role in ('follower')),
  created_at timestamptz not null default now(),
  unique (group_id, profile_id)
);

create index if not exists idx_community_group_followers_group
on public.community_group_followers(group_id, created_at desc);

create index if not exists idx_community_group_followers_profile
on public.community_group_followers(profile_id, created_at desc);

alter table public.community_group_followers enable row level security;

drop policy if exists "community_group_followers_self_read" on public.community_group_followers;
create policy "community_group_followers_self_read"
on public.community_group_followers for select
to authenticated
using (profile_id = auth.uid() or public.is_city_admin(city_id));

drop policy if exists "community_group_followers_self_insert" on public.community_group_followers;
create policy "community_group_followers_self_insert"
on public.community_group_followers for insert
to authenticated
with check (
  profile_id = auth.uid()
  and role = 'follower'
  and exists (
    select 1
    from public.community_groups g
    where g.id = community_group_followers.group_id
      and g.city_id = community_group_followers.city_id
      and g.status = 'published'
  )
);

drop policy if exists "community_group_followers_self_delete" on public.community_group_followers;
create policy "community_group_followers_self_delete"
on public.community_group_followers for delete
to authenticated
using (profile_id = auth.uid() or public.is_city_admin(city_id));

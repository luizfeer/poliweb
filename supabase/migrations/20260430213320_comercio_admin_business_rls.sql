-- ============================================================================
-- Plano 01 — RLS explícita para criação/edição de negócios
-- ============================================================================

drop policy if exists "biz_create" on public.businesses;
create policy "biz_create"
on public.businesses for insert
with check (
  owner_profile_id = (select auth.uid())
  or exists (
    select 1
    from public.profile_roles pr
    where pr.profile_id = (select auth.uid())
      and pr.city_id = businesses.city_id
      and pr.role in ('merchant', 'city_admin', 'moderator')
  )
  or exists (
    select 1
    from public.profile_roles pr
    where pr.profile_id = (select auth.uid())
      and pr.city_id is null
      and pr.role = 'super_admin'
  )
);

drop policy if exists "biz_update" on public.businesses;
create policy "biz_update"
on public.businesses for update
using (
  owner_profile_id = (select auth.uid())
  or public.manages_entity('business', id)
  or exists (
    select 1
    from public.profile_roles pr
    where pr.profile_id = (select auth.uid())
      and pr.city_id = businesses.city_id
      and pr.role in ('city_admin', 'moderator')
  )
  or exists (
    select 1
    from public.profile_roles pr
    where pr.profile_id = (select auth.uid())
      and pr.city_id is null
      and pr.role = 'super_admin'
  )
)
with check (
  owner_profile_id = (select auth.uid())
  or public.manages_entity('business', id)
  or exists (
    select 1
    from public.profile_roles pr
    where pr.profile_id = (select auth.uid())
      and pr.city_id = businesses.city_id
      and pr.role in ('city_admin', 'moderator')
  )
  or exists (
    select 1
    from public.profile_roles pr
    where pr.profile_id = (select auth.uid())
      and pr.city_id is null
      and pr.role = 'super_admin'
  )
);

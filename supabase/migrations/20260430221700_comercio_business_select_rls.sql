-- ============================================================================
-- Plano 01 — SELECT explícito para INSERT/UPDATE returning em negócios
-- ============================================================================

drop policy if exists "biz_public_read" on public.businesses;
create policy "biz_public_read"
on public.businesses for select
using (
  status = 'published'::public.entity_status
  or owner_profile_id = (select auth.uid())
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

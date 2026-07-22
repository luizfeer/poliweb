-- ============================================================================
-- 0012 — AUTH: city_admin pode ler perfis vinculados à cidade
-- ============================================================================

drop policy if exists "profiles_city_admin_read" on public.profiles;
create policy "profiles_city_admin_read"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.profile_roles pr
    where pr.profile_id = profiles.id
      and pr.city_id is not null
      and public.is_city_admin(pr.city_id)
  )
);

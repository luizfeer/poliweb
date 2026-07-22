-- ============================================================================
-- BUSINESS CLAIMS: city_admin can read profiles attached to claims in the city
-- ============================================================================

drop policy if exists "profiles_city_admin_claim_read" on public.profiles;
create policy "profiles_city_admin_claim_read"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.business_claims bc
    join public.businesses b on b.id = bc.business_id
    where bc.profile_id = profiles.id
      and public.is_city_admin(b.city_id)
  )
);

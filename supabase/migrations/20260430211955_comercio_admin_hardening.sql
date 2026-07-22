-- ============================================================================
-- Plano 01 — Hardening pós-advisor para comércio
-- ============================================================================

create or replace function public.set_business_published_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'published'::public.entity_status
     and (old.status is distinct from new.status)
     and new.published_at is null then
    new.published_at = now();
  end if;

  return new;
end;
$$;

revoke all on public.mv_business_search from anon, authenticated;

drop policy if exists "claims_admin_update" on public.business_claims;
create policy "claims_admin_update"
on public.business_claims for update
using (
  exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and public.is_city_admin(b.city_id)
  )
)
with check (
  exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and public.is_city_admin(b.city_id)
  )
);

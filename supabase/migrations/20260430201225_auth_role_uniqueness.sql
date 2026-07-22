-- ============================================================================
-- 0011 — AUTH: unicidade de papéis globais
-- ============================================================================

create unique index if not exists uq_profile_roles_global_role
on public.profile_roles (profile_id, role)
where city_id is null;

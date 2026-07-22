-- ============================================================================
-- 0010 — AUTH: papéis, grant citizen, auditoria e solicitações merchant
-- ============================================================================

create or replace function public.grant_citizen_role(p_city_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if not exists (
    select 1 from public.cities c
    where c.id = p_city_id
      and c.status = 'active'
  ) then
    raise exception 'invalid_city';
  end if;

  insert into public.profile_roles (profile_id, city_id, role, granted_by)
  values (auth.uid(), p_city_id, 'citizen', auth.uid())
  on conflict (profile_id, city_id, role) do nothing;
end;
$$;

revoke all on function public.grant_citizen_role(uuid) from public, anon;
grant execute on function public.grant_citizen_role(uuid) to authenticated;

create or replace function public.audit_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_city_id uuid;
  v_profile_id uuid;
  v_role public.role_kind;
  v_entity_id uuid;
begin
  if tg_op = 'INSERT' then
    v_city_id := new.city_id;
    v_profile_id := new.profile_id;
    v_role := new.role;
    v_entity_id := new.id;

    insert into public.audit_log (actor_id, city_id, action, entity_type, entity_id, diff)
    values (
      coalesce(v_actor, new.granted_by),
      v_city_id,
      'profile_role.insert',
      'profile_role',
      v_entity_id,
      jsonb_build_object(
        'profile_id', v_profile_id,
        'city_id', v_city_id,
        'role', v_role,
        'granted_by', new.granted_by
      )
    );

    return new;
  end if;

  v_city_id := old.city_id;
  v_profile_id := old.profile_id;
  v_role := old.role;
  v_entity_id := old.id;

  insert into public.audit_log (actor_id, city_id, action, entity_type, entity_id, diff)
  values (
    v_actor,
    v_city_id,
    'profile_role.delete',
    'profile_role',
    v_entity_id,
    jsonb_build_object(
      'profile_id', v_profile_id,
      'city_id', v_city_id,
      'role', v_role,
      'granted_by', old.granted_by
    )
  );

  return old;
end;
$$;

revoke all on function public.audit_profile_role_change() from public, anon, authenticated;

drop trigger if exists tg_audit_role_change on public.profile_roles;
create trigger tg_audit_role_change
after insert or delete on public.profile_roles
for each row execute function public.audit_profile_role_change();

drop policy if exists "profile_roles_self_citizen_insert" on public.profile_roles;
create policy "profile_roles_self_citizen_insert"
on public.profile_roles
for insert
to authenticated
with check (
  profile_id = auth.uid()
  and role = 'citizen'
  and city_id is not null
  and exists (
    select 1 from public.cities c
    where c.id = city_id
      and c.status = 'active'
  )
);

create table if not exists public.merchant_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  business_hint text,
  justification text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (profile_id, city_id, status)
);

create index if not exists idx_merchant_requests_city_status
on public.merchant_requests(city_id, status, created_at desc);

create trigger trg_merchant_requests_updated
before update on public.merchant_requests
for each row execute function public.set_updated_at();

alter table public.merchant_requests enable row level security;

drop policy if exists "merchant_requests_self_create" on public.merchant_requests;
drop policy if exists "merchant_requests_self_read" on public.merchant_requests;
drop policy if exists "merchant_requests_admin_read" on public.merchant_requests;
drop policy if exists "merchant_requests_admin_update" on public.merchant_requests;

create policy "merchant_requests_self_create"
on public.merchant_requests
for insert
to authenticated
with check (
  profile_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.cities c
    where c.id = city_id
      and c.status = 'active'
  )
);

create policy "merchant_requests_self_read"
on public.merchant_requests
for select
to authenticated
using (profile_id = auth.uid());

create policy "merchant_requests_admin_read"
on public.merchant_requests
for select
to authenticated
using (public.is_city_admin(city_id));

create policy "merchant_requests_admin_update"
on public.merchant_requests
for update
to authenticated
using (public.is_city_admin(city_id))
with check (public.is_city_admin(city_id));

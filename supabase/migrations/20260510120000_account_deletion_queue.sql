-- Fila de exclusão de conta com aprovação manual por super_admin.
-- Substitui o caminho de exclusão imediata: o usuário pede; super_admin revisa.

create type account_deletion_status as enum ('pending', 'approved', 'rejected', 'completed', 'canceled');

create table account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  status account_deletion_status not null default 'pending',
  reason text,
  requested_email text,
  requested_at timestamptz not null default now(),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uniq_account_deletion_pending
  on account_deletion_requests(profile_id)
  where status = 'pending';

create index idx_account_deletion_status on account_deletion_requests(status, requested_at desc);

create trigger trg_account_deletion_updated
  before update on account_deletion_requests
  for each row execute function public.set_updated_at();

alter table account_deletion_requests enable row level security;

create policy "deletion_self_read"
  on account_deletion_requests for select
  using (profile_id = auth.uid() or public.is_super_admin());

create policy "deletion_self_cancel"
  on account_deletion_requests for update
  using (profile_id = auth.uid() and status = 'pending')
  with check (profile_id = auth.uid() and status in ('pending', 'canceled'));

create policy "deletion_admin_all"
  on account_deletion_requests for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Solicitação feita pelo próprio usuário.
create or replace function public.request_account_deletion(p_reason text)
returns uuid
language plpgsql
security definer
as $$
declare
  v_profile uuid := auth.uid();
  v_email text;
  v_id uuid;
begin
  if v_profile is null then
    raise exception 'unauthorized';
  end if;

  if exists (
    select 1 from account_deletion_requests
    where profile_id = v_profile and status = 'pending'
  ) then
    raise exception 'pending_request_exists';
  end if;

  select email into v_email from auth.users where id = v_profile;

  insert into account_deletion_requests (profile_id, reason, requested_email)
  values (v_profile, nullif(trim(p_reason), ''), v_email)
  returning id into v_id;

  insert into audit_log (actor_id, action, entity_type, entity_id, diff)
  values (v_profile, 'deletion_requested', 'account_deletion_request', v_id,
          jsonb_build_object('reason', p_reason));

  return v_id;
end;
$$;

-- Cancelamento pelo próprio usuário.
create or replace function public.cancel_account_deletion(p_request_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_profile uuid := auth.uid();
begin
  if v_profile is null then
    raise exception 'unauthorized';
  end if;

  update account_deletion_requests
  set status = 'canceled', updated_at = now()
  where id = p_request_id and profile_id = v_profile and status = 'pending';

  if not found then
    raise exception 'request_not_found_or_not_pending';
  end if;

  insert into audit_log (actor_id, action, entity_type, entity_id)
  values (v_profile, 'deletion_canceled', 'account_deletion_request', p_request_id);
end;
$$;

-- Aprovação por super_admin: anonimiza o perfil e marca como concluído.
create or replace function public.approve_account_deletion(p_request_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
as $$
declare
  v_actor uuid := auth.uid();
  v_profile uuid;
begin
  if not public.is_super_admin() then
    raise exception 'not_allowed';
  end if;

  select profile_id into v_profile
  from account_deletion_requests
  where id = p_request_id and status = 'pending'
  for update;

  if v_profile is null then
    raise exception 'request_not_found_or_not_pending';
  end if;

  perform public.delete_user_data(v_profile);

  update account_deletion_requests
  set status = 'completed',
      reviewed_by = v_actor,
      reviewed_at = now(),
      completed_at = now(),
      review_notes = nullif(trim(p_notes), ''),
      updated_at = now()
  where id = p_request_id;

  insert into audit_log (actor_id, action, entity_type, entity_id, diff)
  values (v_actor, 'deletion_approved', 'account_deletion_request', p_request_id,
          jsonb_build_object('profile_id', v_profile, 'notes', p_notes));
end;
$$;

-- Rejeição por super_admin: registra motivo.
create or replace function public.reject_account_deletion(p_request_id uuid, p_notes text)
returns void
language plpgsql
security definer
as $$
declare
  v_actor uuid := auth.uid();
begin
  if not public.is_super_admin() then
    raise exception 'not_allowed';
  end if;

  if nullif(trim(p_notes), '') is null then
    raise exception 'notes_required';
  end if;

  update account_deletion_requests
  set status = 'rejected',
      reviewed_by = v_actor,
      reviewed_at = now(),
      review_notes = p_notes,
      updated_at = now()
  where id = p_request_id and status = 'pending';

  if not found then
    raise exception 'request_not_found_or_not_pending';
  end if;

  insert into audit_log (actor_id, action, entity_type, entity_id, diff)
  values (v_actor, 'deletion_rejected', 'account_deletion_request', p_request_id,
          jsonb_build_object('notes', p_notes));
end;
$$;

grant execute on function public.request_account_deletion(text) to authenticated;
grant execute on function public.cancel_account_deletion(uuid) to authenticated;
grant execute on function public.approve_account_deletion(uuid, text) to authenticated;
grant execute on function public.reject_account_deletion(uuid, text) to authenticated;

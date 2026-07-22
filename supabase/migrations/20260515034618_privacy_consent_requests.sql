-- Sprint privacidade: consentimento granular, versoes de politica e pedidos LGPD.
-- Mantem a fila existente de exclusao de conta e adiciona uma camada geral auditavel.

do $$
begin
  create type public.privacy_consent_purpose as enum (
    'necessary',
    'analytics',
    'ads_measurement',
    'marketing_email',
    'push_notifications',
    'ai_processing',
    'public_listing'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.privacy_consent_event_type as enum (
    'grant',
    'revoke',
    'update'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.privacy_request_type as enum (
    'access',
    'export',
    'correction',
    'deletion',
    'anonymization',
    'consent_revocation',
    'objection',
    'sharing_info',
    'automated_decision_review'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.privacy_request_status as enum (
    'open',
    'in_review',
    'waiting_user',
    'approved',
    'rejected',
    'completed',
    'canceled'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.privacy_policy_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title text not null,
  published_at timestamptz not null default now(),
  public_url text not null default '/privacidade',
  changelog text,
  created_at timestamptz not null default now()
);

insert into public.privacy_policy_versions (version, title, published_at, public_url, changelog)
values (
  '2026-05-15',
  'Politica de privacidade LGPD e Apple',
  now(),
  '/privacidade',
  'Adiciona consentimento granular, inventario de dados e preparacao para App Store Privacy Labels.'
)
on conflict (version) do nothing;

create table if not exists public.privacy_consents (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete cascade,
  anonymous_id text,
  purpose public.privacy_consent_purpose not null,
  granted boolean not null default false,
  policy_version text not null references public.privacy_policy_versions(version),
  source text not null default 'web',
  ip_hash text,
  user_agent_hash text,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint privacy_consents_subject_check check (
    profile_id is not null or nullif(trim(anonymous_id), '') is not null
  )
);

create unique index if not exists uniq_privacy_consents_profile_purpose
on public.privacy_consents(profile_id, purpose)
where profile_id is not null;

create unique index if not exists uniq_privacy_consents_anonymous_purpose
on public.privacy_consents(anonymous_id, purpose)
where profile_id is null and anonymous_id is not null;

create index if not exists idx_privacy_consents_city_purpose
on public.privacy_consents(city_id, purpose, updated_at desc);

create trigger trg_privacy_consents_updated
before update on public.privacy_consents
for each row execute function public.set_updated_at();

create table if not exists public.privacy_consent_events (
  id uuid primary key default gen_random_uuid(),
  consent_id uuid references public.privacy_consents(id) on delete set null,
  city_id uuid references public.cities(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  anonymous_id text,
  purpose public.privacy_consent_purpose not null,
  event_type public.privacy_consent_event_type not null,
  granted boolean not null,
  policy_version text not null references public.privacy_policy_versions(version),
  source text not null default 'web',
  ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_privacy_consent_events_profile_created
on public.privacy_consent_events(profile_id, created_at desc);

create index if not exists idx_privacy_consent_events_city_created
on public.privacy_consent_events(city_id, created_at desc);

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  request_type public.privacy_request_type not null,
  status public.privacy_request_status not null default 'open',
  requester_email text,
  details text,
  response_notes text,
  export_storage_path text,
  due_at timestamptz not null default (now() + interval '15 days'),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint privacy_requests_subject_check check (
    profile_id is not null or nullif(trim(requester_email), '') is not null
  )
);

create index if not exists idx_privacy_requests_status_due
on public.privacy_requests(status, due_at asc);

create index if not exists idx_privacy_requests_profile_created
on public.privacy_requests(profile_id, created_at desc);

create trigger trg_privacy_requests_updated
before update on public.privacy_requests
for each row execute function public.set_updated_at();

alter table public.privacy_policy_versions enable row level security;
alter table public.privacy_consents enable row level security;
alter table public.privacy_consent_events enable row level security;
alter table public.privacy_requests enable row level security;

drop policy if exists "privacy_policy_public_read" on public.privacy_policy_versions;
create policy "privacy_policy_public_read"
on public.privacy_policy_versions for select
to anon, authenticated
using (true);

drop policy if exists "privacy_policy_super_admin_write" on public.privacy_policy_versions;
create policy "privacy_policy_super_admin_write"
on public.privacy_policy_versions for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "privacy_consents_insert" on public.privacy_consents;
create policy "privacy_consents_insert"
on public.privacy_consents for insert
to anon, authenticated
with check (
  purpose <> 'necessary'
  and (profile_id is null or profile_id = auth.uid())
);

drop policy if exists "privacy_consents_self_read" on public.privacy_consents;
create policy "privacy_consents_self_read"
on public.privacy_consents for select
to authenticated
using (profile_id = auth.uid() or public.is_city_admin(city_id) or public.is_super_admin());

drop policy if exists "privacy_consents_self_update" on public.privacy_consents;
create policy "privacy_consents_self_update"
on public.privacy_consents for update
to authenticated
using (profile_id = auth.uid() or public.is_super_admin())
with check (profile_id = auth.uid() or public.is_super_admin());

drop policy if exists "privacy_consent_events_insert" on public.privacy_consent_events;
create policy "privacy_consent_events_insert"
on public.privacy_consent_events for insert
to anon, authenticated
with check (profile_id is null or profile_id = auth.uid());

drop policy if exists "privacy_consent_events_self_read" on public.privacy_consent_events;
create policy "privacy_consent_events_self_read"
on public.privacy_consent_events for select
to authenticated
using (profile_id = auth.uid() or public.is_city_admin(city_id) or public.is_super_admin());

drop policy if exists "privacy_requests_self_insert" on public.privacy_requests;
create policy "privacy_requests_self_insert"
on public.privacy_requests for insert
to anon, authenticated
with check (profile_id is null or profile_id = auth.uid());

drop policy if exists "privacy_requests_self_read" on public.privacy_requests;
create policy "privacy_requests_self_read"
on public.privacy_requests for select
to authenticated
using (profile_id = auth.uid() or public.is_city_admin(city_id) or public.is_super_admin());

drop policy if exists "privacy_requests_admin_write" on public.privacy_requests;
create policy "privacy_requests_admin_write"
on public.privacy_requests for all
to authenticated
using (public.is_city_admin(city_id) or public.is_super_admin())
with check (public.is_city_admin(city_id) or public.is_super_admin());

create or replace function public.delete_user_data(p_profile_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if auth.uid() <> p_profile_id and not public.is_super_admin() then
    raise exception 'not allowed';
  end if;

  update public.profiles
  set full_name = 'Conta excluida',
      phone = null,
      avatar_url = null,
      bio = null,
      consent_marketing = false,
      updated_at = now()
  where id = p_profile_id;

  update public.privacy_consents
  set granted = false,
      revoked_at = coalesce(revoked_at, now()),
      updated_at = now()
  where profile_id = p_profile_id
    and purpose <> 'necessary';

  insert into public.privacy_consent_events (
    consent_id,
    city_id,
    profile_id,
    anonymous_id,
    purpose,
    event_type,
    granted,
    policy_version,
    source,
    metadata
  )
  select
    pc.id,
    pc.city_id,
    pc.profile_id,
    pc.anonymous_id,
    pc.purpose,
    'revoke',
    false,
    pc.policy_version,
    'account_deletion',
    jsonb_build_object('reason', 'account_deletion')
  from public.privacy_consents pc
  where pc.profile_id = p_profile_id
    and pc.purpose <> 'necessary';

  update public.newsletter_subscribers
  set unsubscribed_at = coalesce(unsubscribed_at, now()),
      email = concat('deleted+', id::text, '@example.invalid'),
      confirmation_token_hash = null,
      unsubscribe_token_hash = null
  where email in (select email from auth.users where id = p_profile_id);

  update public.audit_log
  set actor_id = null,
      diff = coalesce(diff, '{}'::jsonb) || jsonb_build_object('actor_redacted', true)
  where actor_id = p_profile_id;
end;
$$;

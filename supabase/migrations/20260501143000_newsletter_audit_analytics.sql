-- ============================================================================
-- 0026 - SEO polish: newsletter, consent audit, analytics and privacy RPC
-- ============================================================================

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  email text not null,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text not null default 'site',
  consent_text_version text not null default '2026-05-01',
  confirmation_token_hash text,
  unsubscribe_token_hash text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_newsletter_active_email
on public.newsletter_subscribers(city_id, lower(email))
where unsubscribed_at is null;

create index if not exists idx_newsletter_city_status
on public.newsletter_subscribers(city_id, confirmed_at, unsubscribed_at);

create trigger trg_newsletter_subscribers_updated
before update on public.newsletter_subscribers
for each row execute function public.set_updated_at();

create table if not exists public.newsletter_consent_history (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  subscriber_id uuid references public.newsletter_subscribers(id) on delete set null,
  email text not null,
  event text not null check (event in ('subscribe', 'confirm', 'unsubscribe', 'export', 'delete_request')),
  source text,
  consent_text_version text,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz default now()
);

create index if not exists idx_newsletter_consent_city_created
on public.newsletter_consent_history(city_id, created_at desc);

create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  subject text not null,
  html_storage_path text,
  sent_at timestamptz,
  recipients_count int not null default 0 check (recipients_count >= 0),
  opens_count int not null default 0 check (opens_count >= 0),
  clicks_count int not null default 0 check (clicks_count >= 0),
  created_at timestamptz default now()
);

create index if not exists idx_newsletter_campaigns_city_sent
on public.newsletter_campaigns(city_id, sent_at desc nulls last);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities(id) on delete set null,
  event_name text not null,
  path text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_analytics_events_city_created
on public.analytics_events(city_id, created_at desc);

create index if not exists idx_analytics_events_name_created
on public.analytics_events(event_name, created_at desc);

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_consent_history enable row level security;
alter table public.newsletter_campaigns enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "newsletter_public_insert" on public.newsletter_subscribers;
create policy "newsletter_public_insert"
on public.newsletter_subscribers for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.city_modules cm
    where cm.city_id = city_id
      and cm.module_key = 'community'
      and cm.enabled
  )
);

drop policy if exists "newsletter_public_update_token" on public.newsletter_subscribers;
create policy "newsletter_public_update_token"
on public.newsletter_subscribers for update
to anon, authenticated
using (confirmation_token_hash is not null or unsubscribe_token_hash is not null)
with check (true);

drop policy if exists "newsletter_admin_read" on public.newsletter_subscribers;
create policy "newsletter_admin_read"
on public.newsletter_subscribers for select
to authenticated
using (public.is_city_admin(city_id) or public.is_super_admin());

drop policy if exists "newsletter_public_token_read" on public.newsletter_subscribers;
create policy "newsletter_public_token_read"
on public.newsletter_subscribers for select
to anon, authenticated
using (confirmation_token_hash is not null or unsubscribe_token_hash is not null);

drop policy if exists "newsletter_admin_write" on public.newsletter_subscribers;
create policy "newsletter_admin_write"
on public.newsletter_subscribers for all
to authenticated
using (public.is_city_admin(city_id) or public.is_super_admin())
with check (public.is_city_admin(city_id) or public.is_super_admin());

drop policy if exists "newsletter_consent_insert" on public.newsletter_consent_history;
create policy "newsletter_consent_insert"
on public.newsletter_consent_history for insert
to anon, authenticated
with check (true);

drop policy if exists "newsletter_consent_admin_read" on public.newsletter_consent_history;
create policy "newsletter_consent_admin_read"
on public.newsletter_consent_history for select
to authenticated
using (public.is_city_admin(city_id) or public.is_super_admin());

drop policy if exists "newsletter_campaigns_admin" on public.newsletter_campaigns;
create policy "newsletter_campaigns_admin"
on public.newsletter_campaigns for all
to authenticated
using (public.is_city_admin(city_id) or public.is_super_admin())
with check (public.is_city_admin(city_id) or public.is_super_admin());

drop policy if exists "analytics_events_public_insert" on public.analytics_events;
create policy "analytics_events_public_insert"
on public.analytics_events for insert
to anon, authenticated
with check (true);

drop policy if exists "analytics_events_admin_read" on public.analytics_events;
create policy "analytics_events_admin_read"
on public.analytics_events for select
to authenticated
using (city_id is null or public.is_city_admin(city_id) or public.is_super_admin());

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

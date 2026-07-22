do $$ begin
  create type notification_audience as enum ('user', 'city_admin', 'super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_channel as enum ('in_app', 'email', 'push');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_delivery_status as enum ('pending', 'sent', 'failed', 'skipped');
exception when duplicate_object then null; end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  audience notification_audience not null default 'user',
  type text not null,
  priority notification_priority not null default 'normal',
  title text not null,
  body text,
  target_url text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  push_payload jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  archived_at timestamptz,
  constraint notifications_target_url_internal check (
    target_url like '/%' and target_url not like '//%'
  )
);

create index if not exists idx_notifications_recipient_unread
  on public.notifications(recipient_profile_id, created_at desc)
  where read_at is null and archived_at is null;

create index if not exists idx_notifications_city_admin_unread
  on public.notifications(city_id, audience, created_at desc)
  where read_at is null and archived_at is null;

create index if not exists idx_notifications_entity
  on public.notifications(entity_type, entity_id)
  where entity_type is not null and entity_id is not null;

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel notification_channel not null,
  status notification_delivery_status not null default 'pending',
  provider text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  failed_at timestamptz,
  unique (notification_id, channel)
);

create index if not exists idx_notification_deliveries_notification
  on public.notification_deliveries(notification_id);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  city_id uuid references public.cities(id) on delete cascade,
  type text not null,
  email_enabled boolean not null default false,
  push_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, city_id, type)
);

create index if not exists idx_notification_preferences_profile
  on public.notification_preferences(profile_id, city_id);

create table if not exists public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'firebase',
  token_hash text not null,
  token_encrypted text,
  platform text,
  last_seen_at timestamptz not null default now(),
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, token_hash)
);

create index if not exists idx_notification_devices_profile
  on public.notification_devices(profile_id)
  where disabled_at is null;

alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_devices enable row level security;

drop policy if exists "notifications_read" on public.notifications;
create policy "notifications_read" on public.notifications
  for select to authenticated
  using (
    recipient_profile_id = auth.uid()
    or public.is_super_admin()
    or (audience = 'city_admin' and city_id is not null and public.is_city_admin(city_id))
  );

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update to authenticated
  using (
    recipient_profile_id = auth.uid()
    or public.is_super_admin()
    or (audience = 'city_admin' and city_id is not null and public.is_city_admin(city_id))
  )
  with check (
    recipient_profile_id = auth.uid()
    or public.is_super_admin()
    or (audience = 'city_admin' and city_id is not null and public.is_city_admin(city_id))
  );

drop policy if exists "notification_deliveries_read" on public.notification_deliveries;
create policy "notification_deliveries_read" on public.notification_deliveries
  for select to authenticated
  using (
    exists (
      select 1 from public.notifications n
      where n.id = notification_id
        and (
          n.recipient_profile_id = auth.uid()
          or public.is_super_admin()
          or (n.audience = 'city_admin' and n.city_id is not null and public.is_city_admin(n.city_id))
        )
    )
  );

drop policy if exists "notification_deliveries_update" on public.notification_deliveries;
create policy "notification_deliveries_update" on public.notification_deliveries
  for update to authenticated
  using (
    exists (
      select 1 from public.notifications n
      where n.id = notification_id
        and (
          n.recipient_profile_id = auth.uid()
          or public.is_super_admin()
          or (n.audience = 'city_admin' and n.city_id is not null and public.is_city_admin(n.city_id))
        )
    )
  )
  with check (
    exists (
      select 1 from public.notifications n
      where n.id = notification_id
        and (
          n.recipient_profile_id = auth.uid()
          or public.is_super_admin()
          or (n.audience = 'city_admin' and n.city_id is not null and public.is_city_admin(n.city_id))
        )
    )
  );

drop policy if exists "notification_preferences_self" on public.notification_preferences;
create policy "notification_preferences_self" on public.notification_preferences
  for all to authenticated
  using (profile_id = auth.uid() or public.is_super_admin())
  with check (profile_id = auth.uid() or public.is_super_admin());

drop policy if exists "notification_devices_self" on public.notification_devices;
create policy "notification_devices_self" on public.notification_devices
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create trigger trg_notification_preferences_updated
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create trigger trg_notification_devices_updated
  before update on public.notification_devices
  for each row execute function public.set_updated_at();

create or replace function public.create_notification(
  p_recipient_profile_id uuid,
  p_city_id uuid,
  p_audience notification_audience,
  p_type text,
  p_priority notification_priority,
  p_title text,
  p_body text,
  p_target_url text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_send_email boolean default false,
  p_push_payload jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  if p_target_url is null or p_target_url not like '/%' or p_target_url like '//%' then
    raise exception 'target_url must be an internal path';
  end if;

  if p_recipient_profile_id <> auth.uid()
    and not public.is_super_admin()
    and not (p_city_id is not null and public.is_city_admin(p_city_id))
    and not (
      p_audience = 'city_admin'
      and p_city_id is not null
      and exists (
        select 1 from public.profile_roles pr
        where pr.profile_id = p_recipient_profile_id
          and pr.city_id = p_city_id
          and pr.role in ('city_admin', 'moderator')
      )
    )
  then
    raise exception 'not allowed to create notification for recipient';
  end if;

  insert into public.notifications (
    city_id,
    recipient_profile_id,
    audience,
    type,
    priority,
    title,
    body,
    target_url,
    entity_type,
    entity_id,
    metadata,
    push_payload
  )
  values (
    p_city_id,
    p_recipient_profile_id,
    p_audience,
    p_type,
    p_priority,
    p_title,
    p_body,
    p_target_url,
    p_entity_type,
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb),
    p_push_payload
  )
  returning id into v_notification_id;

  insert into public.notification_deliveries (notification_id, channel, status)
  values (v_notification_id, 'in_app', 'sent');

  insert into public.notification_deliveries (notification_id, channel, status, provider)
  values (v_notification_id, 'email', case when p_send_email then 'pending' else 'skipped' end, 'resend');

  insert into public.notification_deliveries (notification_id, channel, status, provider)
  values (v_notification_id, 'push', 'skipped', 'firebase');

  return v_notification_id;
end;
$$;

create or replace function public.notify_city_admins(
  p_city_id uuid,
  p_type text,
  p_priority notification_priority,
  p_title text,
  p_body text,
  p_target_url text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_send_email boolean default false,
  p_push_payload jsonb default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  if p_target_url is null or p_target_url not like '/%' or p_target_url like '//%' then
    raise exception 'target_url must be an internal path';
  end if;

  for v_recipient in
    select distinct pr.profile_id
    from public.profile_roles pr
    where pr.city_id = p_city_id
      and pr.role in ('city_admin', 'moderator')
  loop
    perform public.create_notification(
      v_recipient,
      p_city_id,
      'city_admin',
      p_type,
      p_priority,
      p_title,
      p_body,
      p_target_url,
      p_entity_type,
      p_entity_id,
      p_metadata,
      p_send_email,
      p_push_payload
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.notify_cidadeviva_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_city_id uuid;
  v_notification_id uuid;
  v_title text;
begin
  v_city_id := new.city_id;
  v_title := 'Novo lead CidadeViva';

  for v_recipient in
    select pr.profile_id
    from public.profile_roles pr
    where (
      (v_city_id is not null and pr.city_id = v_city_id and pr.role in ('city_admin', 'moderator'))
      or (v_city_id is null and pr.role = 'super_admin')
    )
  loop
    insert into public.notifications (
      city_id,
      recipient_profile_id,
      audience,
      type,
      priority,
      title,
      body,
      target_url,
      entity_type,
      entity_id,
      metadata
    )
    values (
      v_city_id,
      v_recipient,
      case when v_city_id is null then 'super_admin'::notification_audience else 'city_admin'::notification_audience end,
      'lead.received',
      'high',
      v_title,
      coalesce(new.business_name, new.name, new.email),
      case when v_city_id is null then '/painel/notificacoes?filtro=leads' else '/painel/cidade/notificacoes?tipo=lead' end,
      'cidadeviva_lead',
      new.id,
      jsonb_build_object('email', new.email, 'phone', new.phone, 'source', new.source, 'form_type', new.form_type)
    )
    returning id into v_notification_id;

    insert into public.notification_deliveries (notification_id, channel, status)
    values (v_notification_id, 'in_app', 'sent');
    insert into public.notification_deliveries (notification_id, channel, status, provider)
    values (v_notification_id, 'email', 'skipped', 'resend');
    insert into public.notification_deliveries (notification_id, channel, status, provider)
    values (v_notification_id, 'push', 'skipped', 'firebase');
  end loop;

  return new;
end;
$$;

alter table public.cidadeviva_leads
  add column if not exists city_id uuid references public.cities(id) on delete set null,
  add column if not exists business_id uuid references public.businesses(id) on delete set null,
  add column if not exists form_type text not null default 'landing_page',
  add column if not exists status text not null default 'new';

create index if not exists idx_cidadeviva_leads_city_status
  on public.cidadeviva_leads(city_id, status, created_at desc);

drop trigger if exists trg_cidadeviva_lead_notification on public.cidadeviva_leads;
create trigger trg_cidadeviva_lead_notification
  after insert on public.cidadeviva_leads
  for each row execute function public.notify_cidadeviva_lead();

create or replace function public.notify_property_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property record;
  v_recipient uuid;
  v_notification_id uuid;
begin
  select id, city_id, title, slug, owner_profile_id, realtor_id
  into v_property
  from public.properties
  where id = new.property_id;

  if v_property.id is null then
    return new;
  end if;

  for v_recipient in
    select distinct profile_id
    from (
      select v_property.owner_profile_id as profile_id
      union
      select em.profile_id
      from public.entity_managers em
      where em.entity_type = 'realtor'
        and em.entity_id = v_property.realtor_id
    ) recipients
    where profile_id is not null
  loop
    insert into public.notifications (
      city_id,
      recipient_profile_id,
      audience,
      type,
      priority,
      title,
      body,
      target_url,
      entity_type,
      entity_id,
      metadata
    )
    values (
      v_property.city_id,
      v_recipient,
      'user',
      'lead.received',
      'high',
      'Novo lead de imóvel',
      coalesce(new.requester_name, 'Visitante') || ' pediu contato sobre ' || v_property.title,
      '/painel/imobiliaria',
      'property_inquiry',
      new.id,
      jsonb_build_object(
        'property_id', new.property_id,
        'requester_name', new.requester_name,
        'requester_phone', new.requester_phone
      )
    )
    returning id into v_notification_id;

    insert into public.notification_deliveries (notification_id, channel, status)
    values (v_notification_id, 'in_app', 'sent');
    insert into public.notification_deliveries (notification_id, channel, status, provider)
    values (v_notification_id, 'email', 'skipped', 'resend');
    insert into public.notification_deliveries (notification_id, channel, status, provider)
    values (v_notification_id, 'push', 'skipped', 'firebase');
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_property_inquiry_notification on public.property_inquiries;
create trigger trg_property_inquiry_notification
  after insert on public.property_inquiries
  for each row execute function public.notify_property_inquiry();

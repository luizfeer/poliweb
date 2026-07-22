-- Push delivery pipeline:
-- 1) tabela web_push_subscriptions (browser Web Push padrão W3C/VAPID)
-- 2) ajusta create_notification e triggers existentes pra enfileirar push em 'pending' (provider 'expo')
-- 3) função public.toggle_web_push_subscription pro client

create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  city_id uuid references public.cities(id) on delete set null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, endpoint)
);

create index if not exists idx_web_push_subscriptions_profile
  on public.web_push_subscriptions(profile_id);

alter table public.web_push_subscriptions enable row level security;

drop policy if exists "owner can read own web push" on public.web_push_subscriptions;
create policy "owner can read own web push"
  on public.web_push_subscriptions for select
  using (auth.uid() = profile_id);

drop policy if exists "owner can insert own web push" on public.web_push_subscriptions;
create policy "owner can insert own web push"
  on public.web_push_subscriptions for insert
  with check (auth.uid() = profile_id);

drop policy if exists "owner can update own web push" on public.web_push_subscriptions;
create policy "owner can update own web push"
  on public.web_push_subscriptions for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

drop policy if exists "owner can delete own web push" on public.web_push_subscriptions;
create policy "owner can delete own web push"
  on public.web_push_subscriptions for delete
  using (auth.uid() = profile_id);

create or replace function public.tg_web_push_subscriptions_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.last_seen_at := now();
  return new;
end;
$$;

drop trigger if exists web_push_subscriptions_touch on public.web_push_subscriptions;
create trigger web_push_subscriptions_touch
  before update on public.web_push_subscriptions
  for each row execute function public.tg_web_push_subscriptions_touch();

-- Helper: verifica se o usuário tem algum destino push (Expo OU Web)
create or replace function public.has_push_target(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.device_push_tokens d where d.profile_id = p_profile_id)
    or exists (select 1 from public.web_push_subscriptions w where w.profile_id = p_profile_id);
$$;

-- Helper: verifica preferência push do usuário pra um tipo de notificação
-- Default = enabled (opt-out, não opt-in) pra não quebrar fluxos existentes.
create or replace function public.push_enabled_for(p_profile_id uuid, p_type text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select push_enabled
      from public.notification_preferences
      where profile_id = p_profile_id
        and type = p_type
      limit 1
    ),
    true
  );
$$;

-- Override create_notification: agora push entra como 'pending' (provider 'expo')
-- quando o usuário tem destino E preferência permite. Caso contrário 'skipped'.
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
  v_push_status notification_delivery_status;
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
    city_id, recipient_profile_id, audience, type, priority,
    title, body, target_url, entity_type, entity_id, metadata, push_payload
  )
  values (
    p_city_id, p_recipient_profile_id, p_audience, p_type, p_priority,
    p_title, p_body, p_target_url, p_entity_type, p_entity_id,
    coalesce(p_metadata, '{}'::jsonb), p_push_payload
  )
  returning id into v_notification_id;

  insert into public.notification_deliveries (notification_id, channel, status)
  values (v_notification_id, 'in_app', 'sent');

  insert into public.notification_deliveries (notification_id, channel, status, provider)
  values (v_notification_id, 'email', case when p_send_email then 'pending' else 'skipped' end, 'resend');

  if public.has_push_target(p_recipient_profile_id)
     and public.push_enabled_for(p_recipient_profile_id, p_type)
  then
    v_push_status := 'pending';
  else
    v_push_status := 'skipped';
  end if;

  insert into public.notification_deliveries (notification_id, channel, status, provider)
  values (v_notification_id, 'push', v_push_status, 'expo');

  return v_notification_id;
end;
$$;

-- Rewire as duas triggers que inseriam direto em notifications (sem passar por create_notification)
-- pra também respeitarem preferência/destino.
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
  v_push_status notification_delivery_status;
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
      city_id, recipient_profile_id, audience, type, priority,
      title, body, target_url, entity_type, entity_id, metadata
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

    if public.has_push_target(v_recipient)
       and public.push_enabled_for(v_recipient, 'lead.received')
    then
      v_push_status := 'pending';
    else
      v_push_status := 'skipped';
    end if;

    insert into public.notification_deliveries (notification_id, channel, status, provider)
    values (v_notification_id, 'push', v_push_status, 'expo');
  end loop;

  return new;
end;
$$;

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
  v_push_status notification_delivery_status;
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
      city_id, recipient_profile_id, audience, type, priority,
      title, body, target_url, entity_type, entity_id, metadata
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
      jsonb_build_object('property_id', new.property_id, 'requester_name', new.requester_name, 'requester_phone', new.requester_phone)
    )
    returning id into v_notification_id;

    insert into public.notification_deliveries (notification_id, channel, status)
    values (v_notification_id, 'in_app', 'sent');
    insert into public.notification_deliveries (notification_id, channel, status, provider)
    values (v_notification_id, 'email', 'skipped', 'resend');

    if public.has_push_target(v_recipient)
       and public.push_enabled_for(v_recipient, 'lead.received')
    then
      v_push_status := 'pending';
    else
      v_push_status := 'skipped';
    end if;

    insert into public.notification_deliveries (notification_id, channel, status, provider)
    values (v_notification_id, 'push', v_push_status, 'expo');
  end loop;

  return new;
end;
$$;

comment on table public.web_push_subscriptions is
  'PushSubscription do navegador (Web Push API, VAPID). 1 linha por (profile, endpoint).';

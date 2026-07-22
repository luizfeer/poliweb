-- Email passa a ser entregue por um worker externo (Brevo).
-- Atualiza o provider default de 'resend' para 'brevo' em create_notification.

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
  values (
    v_notification_id,
    'email',
    case when p_send_email then 'pending' else 'skipped' end,
    'brevo'
  );

  insert into public.notification_deliveries (notification_id, channel, status, provider)
  values (v_notification_id, 'push', 'skipped', 'firebase');

  return v_notification_id;
end;
$$;

-- Limpa pendentes antigas marcadas com 'resend' (ficaram presas porque o
-- caminho síncrono via Resend foi removido). Reaponta para 'brevo' para
-- que o worker novo as processe.
update public.notification_deliveries
   set provider = 'brevo'
 where channel = 'email'
   and status = 'pending'
   and (provider is null or provider = 'resend');

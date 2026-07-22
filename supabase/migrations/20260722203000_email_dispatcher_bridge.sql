create table if not exists public.email_dispatch_jobs (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  to_email text not null,
  to_name text,
  subject text not null,
  text_body text,
  html_body text,
  target_url text,
  cta_label text,
  brand_name text,
  footnote text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  provider text not null default 'brevo',
  provider_message_id text,
  attempt_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_dispatch_jobs_to_email_check check (position('@' in to_email) > 1),
  constraint email_dispatch_jobs_content_check check (
    nullif(trim(coalesce(text_body, '')), '') is not null
    or nullif(trim(coalesce(html_body, '')), '') is not null
  )
);

create table if not exists public.email_dispatch_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.email_dispatch_jobs(id) on delete cascade,
  service text not null,
  status text not null,
  provider text not null default 'brevo',
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_dispatch_jobs_pending
  on public.email_dispatch_jobs(status, next_attempt_at, created_at)
  where status in ('pending', 'failed', 'processing');

create index if not exists idx_email_dispatch_jobs_service_created
  on public.email_dispatch_jobs(service, created_at desc);

create index if not exists idx_email_dispatch_logs_job
  on public.email_dispatch_logs(job_id, created_at desc);

alter table public.email_dispatch_jobs enable row level security;
alter table public.email_dispatch_logs enable row level security;

create or replace function public.claim_email_dispatch_jobs(p_limit integer default 25)
returns setof public.email_dispatch_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select id
    from public.email_dispatch_jobs
    where status in ('pending', 'failed')
      and next_attempt_at <= now()
    order by created_at asc
    limit greatest(1, least(coalesce(p_limit, 25), 100))
    for update skip locked
  )
  update public.email_dispatch_jobs j
  set status = 'processing',
      locked_at = now(),
      attempt_count = j.attempt_count + 1,
      updated_at = now()
  from candidates c
  where j.id = c.id
  returning j.*;
end;
$$;

create or replace function public.enqueue_email_dispatch_from_notification()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  notification_row public.notifications%rowtype;
  recipient_email text;
  email_tags text[];
begin
  if new.channel <> 'email' or new.status <> 'pending' then
    return new;
  end if;

  select *
    into notification_row
  from public.notifications
  where id = new.notification_id;

  if notification_row.id is null then
    return new;
  end if;

  recipient_email := nullif(notification_row.metadata->>'email_to', '');
  if recipient_email is null then
    select email
      into recipient_email
    from auth.users
    where id = notification_row.recipient_profile_id;
  end if;

  if recipient_email is null or position('@' in recipient_email) <= 1 then
    return new;
  end if;

  select coalesce(array_agg(tag), array[]::text[])
    into email_tags
  from jsonb_array_elements_text(coalesce(notification_row.metadata->'email_tags', '[]'::jsonb)) as tag;

  insert into public.email_dispatch_jobs (
    service,
    to_email,
    subject,
    text_body,
    target_url,
    cta_label,
    brand_name,
    footnote,
    tags,
    metadata,
    status,
    provider
  ) values (
    coalesce(nullif(notification_row.metadata->>'email_service', ''), 'hail_mary'),
    recipient_email,
    notification_row.title,
    notification_row.body,
    notification_row.target_url,
    coalesce(nullif(notification_row.metadata->>'email_cta_label', ''), 'Abrir no painel'),
    coalesce(nullif(notification_row.metadata->>'email_brand_name', ''), 'Portal Carmelitano'),
    notification_row.metadata->>'email_footnote',
    email_tags,
    jsonb_build_object(
      'source', 'hail_mary.notification_deliveries',
      'notification_id', notification_row.id,
      'delivery_id', new.id,
      'type', notification_row.type,
      'city_id', notification_row.city_id,
      'entity_type', notification_row.entity_type,
      'entity_id', notification_row.entity_id
    ),
    'pending',
    'brevo'
  );

  update public.notification_deliveries
    set status = 'sent',
        provider = 'email_dispatcher',
        sent_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_enqueue_email_dispatch_from_notification on public.notification_deliveries;
create trigger trg_enqueue_email_dispatch_from_notification
after insert on public.notification_deliveries
for each row
execute function public.enqueue_email_dispatch_from_notification();

comment on table public.email_dispatch_jobs is 'Fila central de emails transacionais consumida pelo projeto email-dispatcher.';
comment on table public.email_dispatch_logs is 'Logs de tentativas de envio gravados pelo projeto email-dispatcher.';

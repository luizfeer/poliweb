create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  type text not null,
  subject text not null,
  related_page text,
  contact text,
  message text not null,
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_submissions_type_check check (
    type in ('erro-telefone', 'correcao', 'pauta', 'parceria', 'outro')
  ),
  constraint contact_submissions_status_check check (
    status in ('new', 'reviewing', 'resolved', 'archived')
  ),
  constraint contact_submissions_related_page_internal check (
    related_page is null or (related_page like '/%' and related_page not like '//%')
  )
);

create index if not exists idx_contact_submissions_city_status
  on public.contact_submissions(city_id, status, created_at desc);

alter table public.contact_submissions enable row level security;

drop policy if exists "contact_submissions_public_insert" on public.contact_submissions;
create policy "contact_submissions_public_insert" on public.contact_submissions
  for insert to anon, authenticated
  with check (
    message <> ''
    and subject <> ''
  );

drop policy if exists "contact_submissions_admin_read" on public.contact_submissions;
create policy "contact_submissions_admin_read" on public.contact_submissions
  for select to authenticated
  using (
    public.is_super_admin()
    or public.is_city_admin(city_id)
  );

drop policy if exists "contact_submissions_admin_update" on public.contact_submissions;
create policy "contact_submissions_admin_update" on public.contact_submissions
  for update to authenticated
  using (
    public.is_super_admin()
    or public.is_city_admin(city_id)
  )
  with check (
    public.is_super_admin()
    or public.is_city_admin(city_id)
  );

drop trigger if exists trg_contact_submissions_updated_at on public.contact_submissions;
create trigger trg_contact_submissions_updated_at
  before update on public.contact_submissions
  for each row execute function public.set_updated_at();

create or replace function public.notify_contact_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_notification_id uuid;
  v_target_url text := '/painel/cidade/notificacoes';
begin
  for v_recipient in
    select distinct pr.profile_id
    from public.profile_roles pr
    where pr.city_id = new.city_id
      and pr.role in ('city_admin', 'moderator')
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
      new.city_id,
      v_recipient,
      'city_admin',
      'system.summary',
      case when new.type = 'erro-telefone' then 'high'::notification_priority else 'normal'::notification_priority end,
      case
        when new.type = 'erro-telefone' then 'Correção de telefone enviada'
        when new.type = 'correcao' then 'Correção enviada pelo portal'
        when new.type = 'pauta' then 'Sugestão de pauta enviada'
        when new.type = 'parceria' then 'Contato de parceria enviado'
        else 'Mensagem enviada pelo contato'
      end,
      left(
        concat_ws(
          E'\n',
          new.subject,
          case when new.related_page is not null then 'Página: ' || new.related_page else null end,
          case when new.contact is not null then 'Contato: ' || new.contact else null end,
          new.message
        ),
        1200
      ),
      v_target_url,
      'contact_submission',
      new.id,
      jsonb_build_object(
        'type', new.type,
        'subject', new.subject,
        'related_page', new.related_page,
        'contact', new.contact,
        'message', new.message
      ) || coalesce(new.metadata, '{}'::jsonb)
    )
    returning id into v_notification_id;

    insert into public.notification_deliveries (notification_id, channel, status)
    values (v_notification_id, 'in_app', 'sent')
    on conflict (notification_id, channel) do nothing;

    insert into public.notification_deliveries (notification_id, channel, status, provider)
    values (v_notification_id, 'email', 'skipped', 'resend')
    on conflict (notification_id, channel) do nothing;

    insert into public.notification_deliveries (notification_id, channel, status, provider)
    values (v_notification_id, 'push', 'skipped', 'firebase')
    on conflict (notification_id, channel) do nothing;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_contact_submission_notify on public.contact_submissions;
create trigger trg_contact_submission_notify
  after insert on public.contact_submissions
  for each row execute function public.notify_contact_submission();

-- ============================================================================
-- WhatsApp Hub — canais, mensagens, filas, templates, opt-ins
-- Multi-cidade desde o dia 1: tudo pendurado em wa_channels.city_id.
-- Operação: outbound transacional + inbound assistente IA.
-- Provedor: Meta WhatsApp Cloud API (oficial).
-- ============================================================================

-- ── Enums ───────────────────────────────────────────────────────────────────

do $$ begin
  create type wa_channel_kind as enum ('transactional', 'assistant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wa_direction as enum ('in', 'out');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wa_message_kind as enum ('text', 'template', 'interactive', 'media', 'location', 'contacts', 'reaction', 'system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wa_message_status as enum (
    'received',     -- inbound persistido
    'queued',       -- outbound aguardando envio
    'sending',      -- worker pegou
    'sent',         -- API Meta aceitou
    'delivered',    -- entregue ao device
    'read',         -- lida pelo destinatário
    'failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type wa_template_status as enum ('draft', 'pending', 'approved', 'rejected', 'paused', 'disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wa_template_category as enum ('UTILITY', 'AUTHENTICATION', 'MARKETING');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wa_opt_in_kind as enum ('transactional', 'marketing', 'assistant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wa_queue_status as enum ('pending', 'processing', 'done', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ── Canais (1 por número de WhatsApp) ───────────────────────────────────────

create table wa_channels (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  kind wa_channel_kind not null,
  display_name text not null,
  -- IDs Meta
  waba_id text not null,                    -- WhatsApp Business Account ID
  phone_number_id text not null unique,     -- ID do número (vai no path da API)
  display_number text not null,             -- +55..., só pra mostrar
  -- Segredos: armazenados no Vault do Supabase ou em env vars; aqui só referência.
  meta_secret_ref text,                     -- nome da env var ou chave no vault
  webhook_verify_token text not null,       -- string usada no handshake do webhook
  -- Limites
  daily_cap int default 1000,
  enabled boolean not null default true,
  quality_rating text,                      -- 'GREEN' | 'YELLOW' | 'RED'
  quality_checked_at timestamptz,
  -- Auditoria
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (city_id, kind)                    -- 1 número TX + 1 IA por cidade
);

create index idx_wa_channels_city on wa_channels(city_id);

create trigger trg_wa_channels_updated before update on wa_channels
  for each row execute function public.set_updated_at();

-- ── Templates (mirror dos templates aprovados na Meta) ──────────────────────

create table wa_templates (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references wa_channels(id) on delete cascade,
  name text not null,
  language text not null default 'pt_BR',
  category wa_template_category not null,
  status wa_template_status not null default 'draft',
  -- Definição (corpo + botões etc) — formato Meta
  components jsonb not null,
  -- Espelho da Meta
  meta_id text,
  rejected_reason text,
  -- Versionamento local (hash do components pra detectar drift)
  local_hash text not null,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (channel_id, name, language)
);

create index idx_wa_templates_channel on wa_templates(channel_id);
create index idx_wa_templates_status on wa_templates(status);

create trigger trg_wa_templates_updated before update on wa_templates
  for each row execute function public.set_updated_at();

-- ── Mensagens (uma linha por mensagem, in ou out) ───────────────────────────

create table wa_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references wa_channels(id) on delete restrict,
  direction wa_direction not null,
  kind wa_message_kind not null,
  status wa_message_status not null,
  -- Identificadores
  wamid text,                               -- id da Meta (única por msg, mas pode faltar antes do sent)
  from_number text not null,
  to_number text not null,
  -- Quem é o usuário do nosso lado (se conseguir resolver)
  profile_id uuid references profiles(id) on delete set null,
  -- Conteúdo
  text_body text,                           -- pra busca/leitura rápida em inbound text
  template_name text,
  template_language text,
  template_variables jsonb,
  payload jsonb not null,                   -- payload bruto que mandamos OU recebemos
  -- Erros (quando status=failed)
  error_code text,
  error_message text,
  -- Timestamps por estágio (vindos da Meta)
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index idx_wa_messages_channel_created on wa_messages(channel_id, created_at desc);
create index idx_wa_messages_wamid on wa_messages(wamid) where wamid is not null;
create index idx_wa_messages_contact on wa_messages(channel_id, from_number, to_number, created_at desc);
create index idx_wa_messages_profile on wa_messages(profile_id) where profile_id is not null;

-- ── Janela de 24h (regra de negócio do Meta) ────────────────────────────────
-- Toda inbound de um contato abre/renova a janela. Fora dela, só template.

create table wa_sessions (
  channel_id uuid not null references wa_channels(id) on delete cascade,
  contact_number text not null,
  opened_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  last_message_id uuid references wa_messages(id) on delete set null,
  primary key (channel_id, contact_number)
);

create index idx_wa_sessions_expires on wa_sessions(expires_at);

-- ── Fila inbound (worker IA consome) ────────────────────────────────────────

create table wa_inbound_queue (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references wa_messages(id) on delete cascade,
  channel_id uuid not null references wa_channels(id) on delete cascade,
  status wa_queue_status not null default 'pending',
  attempts int not null default 0,
  picked_at timestamptz,
  processed_at timestamptz,
  error text,
  created_at timestamptz default now(),
  unique (message_id)
);

create index idx_wa_inbound_pending on wa_inbound_queue(channel_id, created_at)
  where status = 'pending';

-- ── Fila outbound (server actions enfileiram, worker dispara) ──────────────

create table wa_outbound_queue (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references wa_channels(id) on delete restrict,
  to_number text not null,
  -- Conteúdo (template é o caminho 95% — texto livre só dentro de janela 24h)
  kind wa_message_kind not null default 'template',
  template_name text,
  template_language text default 'pt_BR',
  template_variables jsonb,                  -- {"1": "Luiz", "2": "Pousada do Lago"}
  text_body text,                            -- só usado quando kind=text e janela aberta
  -- Origem (pra auditoria + idempotência)
  related_entity_type text,
  related_entity_id uuid,
  dedup_key text unique,                     -- ex: "claim_aprovado:business:<id>"
  -- Agendamento
  scheduled_for timestamptz default now(),
  -- Execução
  status wa_queue_status not null default 'pending',
  attempts int not null default 0,
  picked_at timestamptz,
  processed_at timestamptz,
  message_id uuid references wa_messages(id) on delete set null,
  error text,
  created_at timestamptz default now()
);

create index idx_wa_outbound_ready on wa_outbound_queue(scheduled_for)
  where status = 'pending';
create index idx_wa_outbound_entity on wa_outbound_queue(related_entity_type, related_entity_id);

-- ── Consentimento LGPD (granular por tipo) ──────────────────────────────────

create table wa_opt_ins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  channel_id uuid not null references wa_channels(id) on delete cascade,
  kind wa_opt_in_kind not null,
  phone_number text not null,                -- número que o usuário consentiu receber
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  source text,                               -- ex: "signup", "painel", "whatsapp_reply"
  created_at timestamptz default now(),
  unique (profile_id, channel_id, kind)
);

create index idx_wa_opt_ins_channel_active on wa_opt_ins(channel_id, kind)
  where revoked_at is null;

-- ── Log cru de webhook (TTL curto — só pra debug) ──────────────────────────

create table wa_webhook_log (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz default now(),
  signature_ok boolean not null,
  payload jsonb not null,
  processed boolean not null default false,
  error text
);

create index idx_wa_webhook_log_recent on wa_webhook_log(received_at desc);

-- TTL: rodar manualmente ou via cron — apaga > 7 dias
-- delete from wa_webhook_log where received_at < now() - interval '7 days';

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table wa_channels        enable row level security;
alter table wa_templates       enable row level security;
alter table wa_messages        enable row level security;
alter table wa_sessions        enable row level security;
alter table wa_inbound_queue   enable row level security;
alter table wa_outbound_queue  enable row level security;
alter table wa_opt_ins         enable row level security;
alter table wa_webhook_log     enable row level security;

-- wa_channels: leitura para city_admin da cidade; escrita só super_admin
create policy "wa_channels_read" on wa_channels for select
  using (public.is_city_admin(city_id));
create policy "wa_channels_write" on wa_channels for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- wa_templates: gestão por city_admin (mas approval real é na Meta)
create policy "wa_templates_read" on wa_templates for select
  using (exists (
    select 1 from wa_channels c
    where c.id = channel_id and public.is_city_admin(c.city_id)
  ));
create policy "wa_templates_write" on wa_templates for all
  using (exists (
    select 1 from wa_channels c
    where c.id = channel_id and public.is_city_admin(c.city_id)
  ))
  with check (exists (
    select 1 from wa_channels c
    where c.id = channel_id and public.is_city_admin(c.city_id)
  ));

-- wa_messages: city_admin vê tudo da cidade; o próprio usuário vê as suas
create policy "wa_messages_admin_read" on wa_messages for select
  using (exists (
    select 1 from wa_channels c
    where c.id = channel_id and public.is_city_admin(c.city_id)
  ));
create policy "wa_messages_self_read" on wa_messages for select
  using (profile_id = auth.uid());

-- wa_sessions / queues / webhook_log: apenas service_role + admin
create policy "wa_sessions_admin" on wa_sessions for select
  using (exists (
    select 1 from wa_channels c
    where c.id = channel_id and public.is_city_admin(c.city_id)
  ));

create policy "wa_inbound_queue_admin" on wa_inbound_queue for select
  using (exists (
    select 1 from wa_channels c
    where c.id = channel_id and public.is_city_admin(c.city_id)
  ));

create policy "wa_outbound_queue_admin_read" on wa_outbound_queue for select
  using (exists (
    select 1 from wa_channels c
    where c.id = channel_id and public.is_city_admin(c.city_id)
  ));
create policy "wa_outbound_queue_admin_write" on wa_outbound_queue for all
  using (exists (
    select 1 from wa_channels c
    where c.id = channel_id and public.is_city_admin(c.city_id)
  ))
  with check (exists (
    select 1 from wa_channels c
    where c.id = channel_id and public.is_city_admin(c.city_id)
  ));

create policy "wa_webhook_log_admin" on wa_webhook_log for select
  using (public.is_super_admin());

-- wa_opt_ins: dono lê e altera os próprios; admin lê tudo
create policy "wa_opt_ins_self_read" on wa_opt_ins for select
  using (profile_id = auth.uid() or exists (
    select 1 from wa_channels c
    where c.id = channel_id and public.is_city_admin(c.city_id)
  ));
create policy "wa_opt_ins_self_write" on wa_opt_ins for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ── Helpers ─────────────────────────────────────────────────────────────────

-- Janela 24h aberta?
create or replace function public.wa_session_open(p_channel_id uuid, p_contact text)
returns boolean language sql stable as $$
  select exists (
    select 1 from wa_sessions
    where channel_id = p_channel_id
      and contact_number = p_contact
      and expires_at > now()
  );
$$;

-- Marca sessão (chamado quando recebe inbound)
create or replace function public.wa_touch_session(
  p_channel_id uuid, p_contact text, p_message_id uuid
) returns void language plpgsql as $$
begin
  insert into wa_sessions (channel_id, contact_number, opened_at, expires_at, last_message_id)
  values (p_channel_id, p_contact, now(), now() + interval '24 hours', p_message_id)
  on conflict (channel_id, contact_number)
  do update set
    opened_at = now(),
    expires_at = now() + interval '24 hours',
    last_message_id = excluded.last_message_id;
end;
$$;

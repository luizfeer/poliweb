-- Config publica do app mobile, leitura via anon, escrita so super_admin.
-- Permite rotacionar URLs / flags / chaves publicas (Sentry DSN, PostHog, etc)
-- sem rebuildar e resubmeter o app pras lojas.

create table if not exists public.mobile_config (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null,
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mobile_config_key_idx on public.mobile_config (key);

alter table public.mobile_config enable row level security;

drop policy if exists "public reads mobile_config" on public.mobile_config;
create policy "public reads mobile_config"
  on public.mobile_config for select
  to anon, authenticated
  using (true);

drop policy if exists "super_admin writes mobile_config" on public.mobile_config;
create policy "super_admin writes mobile_config"
  on public.mobile_config for insert
  with check (public.is_super_admin());

drop policy if exists "super_admin updates mobile_config" on public.mobile_config;
create policy "super_admin updates mobile_config"
  on public.mobile_config for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "super_admin deletes mobile_config" on public.mobile_config;
create policy "super_admin deletes mobile_config"
  on public.mobile_config for delete
  using (public.is_super_admin());

create or replace function public.tg_mobile_config_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists mobile_config_touch on public.mobile_config;
create trigger mobile_config_touch
  before update on public.mobile_config
  for each row execute function public.tg_mobile_config_touch();

comment on table public.mobile_config is
  'Config publica do app mobile (URLs, flags, chaves publicas de SDKs). Leitura via anon, escrita so super_admin. Permite rotacionar sem rebuild.';

-- Seed dos valores atuais do app
insert into public.mobile_config (key, value, description) values
  ('WEB_BASE_URL', 'https://portalcarmelitano.com.br', 'URL base do site web (deeplinks, webview, OG).'),
  ('DEFAULT_CITY_SLUG', 'carmo-do-rio-claro', 'Cidade default quando o usuario abre o app sem selecionar.'),
  ('SUPPORT_WHATSAPP', '', 'WhatsApp de suporte mostrado no perfil/ajuda. Vazio = esconde.'),
  ('FEATURE_ASSISTANT_ENABLED', 'true', 'Liga/desliga o assistente IA no app.'),
  ('FEATURE_PUSH_PROMPT_ENABLED', 'true', 'Liga/desliga o prompt de pedir permissao de push.')
on conflict (key) do nothing;

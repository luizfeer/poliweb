-- Cofre de segredos (chaves de API, tokens) e canais de OTA do mobile.
-- Segredos sao cifrados na aplicacao (AES-GCM) com master key vinda do env;
-- o banco guarda so o ciphertext + nonce. RLS restringe tudo a super_admin.

-- =====================================================================
-- app_secrets: cofre de credenciais rotacionaveis
-- =====================================================================

create table if not exists public.app_secrets (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  scope text not null default 'global' check (scope in ('global', 'city')),
  city_id uuid references public.cities(id) on delete cascade,
  ciphertext text not null,
  nonce text not null,
  key_version integer not null default 1,
  description text,
  rotated_at timestamptz,
  rotated_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_secrets_scope_city_chk check (
    (scope = 'global' and city_id is null) or
    (scope = 'city' and city_id is not null)
  )
);

create unique index if not exists app_secrets_global_key_uidx
  on public.app_secrets (key)
  where scope = 'global';

create unique index if not exists app_secrets_city_key_uidx
  on public.app_secrets (city_id, key)
  where scope = 'city';

alter table public.app_secrets enable row level security;

drop policy if exists "super_admin reads secrets" on public.app_secrets;
create policy "super_admin reads secrets"
  on public.app_secrets for select
  using (public.is_super_admin());

drop policy if exists "super_admin writes secrets" on public.app_secrets;
create policy "super_admin writes secrets"
  on public.app_secrets for insert
  with check (public.is_super_admin());

drop policy if exists "super_admin updates secrets" on public.app_secrets;
create policy "super_admin updates secrets"
  on public.app_secrets for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "super_admin deletes secrets" on public.app_secrets;
create policy "super_admin deletes secrets"
  on public.app_secrets for delete
  using (public.is_super_admin());

create or replace function public.tg_app_secrets_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.ciphertext is distinct from old.ciphertext then
    new.rotated_at := now();
    new.key_version := coalesce(old.key_version, 0) + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists app_secrets_touch on public.app_secrets;
create trigger app_secrets_touch
  before update on public.app_secrets
  for each row execute function public.tg_app_secrets_touch();

comment on table public.app_secrets is
  'Cofre de credenciais cifradas (API keys, tokens). Decifra na aplicacao com master key do env. Apenas super_admin.';

-- =====================================================================
-- mobile_update_channels: URLs de OTA do Expo (primario + fallback)
-- =====================================================================

create table if not exists public.mobile_update_channels (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('production', 'preview', 'development')),
  label text not null,
  url text not null,
  runtime_version text,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  priority integer not null default 0,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- No maximo 1 primario ativo por canal.
create unique index if not exists mobile_update_channels_primary_uidx
  on public.mobile_update_channels (channel)
  where is_primary and is_active;

create index if not exists mobile_update_channels_channel_idx
  on public.mobile_update_channels (channel, priority desc)
  where is_active;

alter table public.mobile_update_channels enable row level security;

-- Leitura: super_admin pelo painel. O app mobile nao le direto daqui (consome via endpoint publico).
drop policy if exists "super_admin reads update channels" on public.mobile_update_channels;
create policy "super_admin reads update channels"
  on public.mobile_update_channels for select
  using (public.is_super_admin());

drop policy if exists "super_admin writes update channels" on public.mobile_update_channels;
create policy "super_admin writes update channels"
  on public.mobile_update_channels for insert
  with check (public.is_super_admin());

drop policy if exists "super_admin updates update channels" on public.mobile_update_channels;
create policy "super_admin updates update channels"
  on public.mobile_update_channels for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "super_admin deletes update channels" on public.mobile_update_channels;
create policy "super_admin deletes update channels"
  on public.mobile_update_channels for delete
  using (public.is_super_admin());

create or replace function public.tg_mobile_update_channels_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists mobile_update_channels_touch on public.mobile_update_channels;
create trigger mobile_update_channels_touch
  before update on public.mobile_update_channels
  for each row execute function public.tg_mobile_update_channels_touch();

comment on table public.mobile_update_channels is
  'URLs de OTA do Expo por canal (production/preview/dev). 1 primario por canal + secundarios como fallback para rotacao sem rebuild.';

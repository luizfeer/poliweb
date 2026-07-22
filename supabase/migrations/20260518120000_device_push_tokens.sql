-- Device push tokens for the React Native app (Expo push).
-- Each user can have multiple devices; we upsert by (profile_id, token).

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  app_version text,
  device_name text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, token)
);

create index if not exists device_push_tokens_profile_idx
  on public.device_push_tokens (profile_id);

create index if not exists device_push_tokens_token_idx
  on public.device_push_tokens (token);

alter table public.device_push_tokens enable row level security;

drop policy if exists "owner can read own tokens" on public.device_push_tokens;
create policy "owner can read own tokens"
  on public.device_push_tokens
  for select
  using (auth.uid() = profile_id);

drop policy if exists "owner can insert own tokens" on public.device_push_tokens;
create policy "owner can insert own tokens"
  on public.device_push_tokens
  for insert
  with check (auth.uid() = profile_id);

drop policy if exists "owner can update own tokens" on public.device_push_tokens;
create policy "owner can update own tokens"
  on public.device_push_tokens
  for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

drop policy if exists "owner can delete own tokens" on public.device_push_tokens;
create policy "owner can delete own tokens"
  on public.device_push_tokens
  for delete
  using (auth.uid() = profile_id);

-- Trigger to keep updated_at fresh.
create or replace function public.tg_device_push_tokens_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.last_seen_at := now();
  return new;
end;
$$;

drop trigger if exists device_push_tokens_touch on public.device_push_tokens;
create trigger device_push_tokens_touch
  before update on public.device_push_tokens
  for each row execute function public.tg_device_push_tokens_touch();

comment on table public.device_push_tokens is
  'Expo push tokens registrados pelo app mobile (apps/mobile). 1 linha por dispositivo por usuário.';

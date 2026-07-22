-- Permite provider 'r2' (Cloudflare R2) em media_assets.
-- Mantemos 'bunny' aceito por enquanto pra não quebrar linhas legadas.

alter table media_assets
  drop constraint if exists media_assets_provider_check;

alter table media_assets
  add constraint media_assets_provider_check
  check (provider in ('bunny', 'r2'));

alter table media_assets
  alter column provider set default 'r2';

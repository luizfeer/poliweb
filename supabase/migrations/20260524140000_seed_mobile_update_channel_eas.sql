-- Registra a URL atual do EAS Update Cloud como canal primario de producao.
-- Documental por enquanto: o app le do env EAS_UPDATE_URL no build (app.config.ts).
-- Quando migrar pra self-hosted, esta tabela vira a fonte da verdade do switch.

insert into public.mobile_update_channels
  (channel, label, url, runtime_version, is_primary, is_active, priority, description)
values (
  'production',
  'EAS Update Cloud',
  'https://u.expo.dev/43bce470-5e95-41b4-ab2e-133b1dd45b88',
  null,
  true,
  true,
  100,
  'Servidor padrao do Expo. Trocar para self-hosted quando bater limite de MAU.'
)
on conflict do nothing;

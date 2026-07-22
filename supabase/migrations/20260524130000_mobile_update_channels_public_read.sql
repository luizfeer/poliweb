-- Permite leitura publica (anon) de canais OTA ativos. O app mobile consulta
-- direto via supabase-js no boot, sem precisar de endpoint intermediario no Next.

drop policy if exists "public reads active update channels" on public.mobile_update_channels;
create policy "public reads active update channels"
  on public.mobile_update_channels for select
  to anon, authenticated
  using (is_active = true);

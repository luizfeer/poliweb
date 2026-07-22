/**
 * Sincroniza os templates definidos em lib/whatsapp/templates/ com a Meta.
 *
 * Uso:
 *   tsx apps/web/scripts/wa-sync-templates.ts <channel_id>
 *   # ou exporta WA_CHANNEL_ID e roda sem args
 *
 * Pré-requisitos:
 *   - SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL no env
 *   - META_WA_ACCESS_TOKEN no env (ou outra var apontada por meta_secret_ref do canal)
 *   - O canal já tem que existir na tabela wa_channels (inserir manualmente 1× via SQL)
 */

import { syncTemplatesForChannel } from '../lib/whatsapp/sync-templates';

async function main() {
  const channelId = process.argv[2] ?? process.env.WA_CHANNEL_ID;
  if (!channelId) {
    console.error('uso: tsx scripts/wa-sync-templates.ts <channel_id>');
    process.exit(1);
  }

  console.log(`▶ sincronizando templates para canal ${channelId}`);
  const result = await syncTemplatesForChannel(channelId);

  console.log('\n── locais ─────────────────────────');
  console.log(` criados : ${result.created.join(', ') || '—'}`);
  console.log(` atualiz.: ${result.updated.join(', ') || '—'}`);
  console.log(` iguais  : ${result.unchanged.join(', ') || '—'}`);
  console.log('\n── remotos na Meta ────────────────');
  for (const r of result.remote) {
    const tag = r.status.padEnd(10);
    const reason = r.rejected_reason ? ` (${r.rejected_reason})` : '';
    console.log(` ${tag} ${r.name}${reason}`);
  }
}

main().catch((err) => {
  console.error('✖ falhou:', err);
  process.exit(1);
});

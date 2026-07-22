import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/service';

import { createMetaClient } from './meta-client';
import { templateHash, TEMPLATES } from './templates';
import type { WaTemplate } from './types';

// Untipado até `supabase gen types` rodar pós-migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sb(): any {
  return createServiceRoleClient();
}

type SyncResult = {
  channelId: string;
  created: string[];
  updated: string[];
  unchanged: string[];
  remote: { name: string; status: string; rejected_reason?: string }[];
};

export async function syncTemplatesForChannel(channelId: string): Promise<SyncResult> {
  const { data: channel, error } = await sb()
    .from('wa_channels')
    .select('id, waba_id, phone_number_id, meta_secret_ref')
    .eq('id', channelId)
    .single();
  if (error || !channel) throw new Error(`channel ${channelId} not found`);

  const accessToken = resolveSecret(channel.meta_secret_ref);
  if (!accessToken) throw new Error('META access token not configured');

  const meta = createMetaClient({
    accessToken,
    phoneNumberId: channel.phone_number_id,
    wabaId: channel.waba_id,
  });

  const remote = await meta.listTemplates();
  const remoteByKey = new Map(remote.data.map((r) => [`${r.name}::${r.language}`, r]));

  const result: SyncResult = {
    channelId,
    created: [],
    updated: [],
    unchanged: [],
    remote: remote.data.map((r) => ({
      name: r.name,
      status: r.status,
      rejected_reason: r.rejected_reason,
    })),
  };

  for (const local of TEMPLATES) {
    const key = `${local.name}::${local.language}`;
    const remoteTpl = remoteByKey.get(key);
    const hash = templateHash(local);

    if (!remoteTpl) {
      const created = await meta.createTemplate(local);
      await upsertLocal(channelId, local, hash, {
        meta_id: created.id,
        status: 'pending',
      });
      result.created.push(local.name);
      continue;
    }

    const { data: dbRow } = await sb()
      .from('wa_templates')
      .select('id, local_hash, status')
      .eq('channel_id', channelId)
      .eq('name', local.name)
      .eq('language', local.language)
      .maybeSingle();

    if (dbRow?.local_hash === hash && dbRow.status === remoteTpl.status.toLowerCase()) {
      result.unchanged.push(local.name);
      continue;
    }

    // Mudanças reais de body da Meta exigem template novo com sufixo de versão —
    // este sync apenas espelha status remoto. Para alterar body, crie *_v2.
    await upsertLocal(channelId, local, hash, {
      meta_id: remoteTpl.id,
      status: remoteTpl.status.toLowerCase(),
      rejected_reason: remoteTpl.rejected_reason ?? null,
    });
    result.updated.push(local.name);
  }

  return result;
}

async function upsertLocal(
  channelId: string,
  t: WaTemplate,
  hash: string,
  extras: { meta_id?: string; status?: string; rejected_reason?: string | null },
) {
  await sb()
    .from('wa_templates')
    .upsert(
      {
        channel_id: channelId,
        name: t.name,
        language: t.language,
        category: t.category,
        components: t.components,
        local_hash: hash,
        last_synced_at: new Date().toISOString(),
        ...extras,
      },
      { onConflict: 'channel_id,name,language' },
    );
}

function resolveSecret(ref: string | null): string | undefined {
  if (!ref) return process.env.META_WA_ACCESS_TOKEN;
  return process.env[ref] ?? process.env.META_WA_ACCESS_TOKEN;
}

import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/service';

// As tabelas wa_* só aparecem em Database depois de rodar `supabase gen types`
// pós-migration 20260518150000_whatsapp.sql. Até lá, usa cliente sem tipos.
function sb() {
  return createServiceRoleClient() as unknown as {
    from: (table: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      insert: (row: any) => any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: (cols?: string) => any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      upsert: (row: any, opts?: any) => any;
    };
  };
}

type EnqueueTemplate = {
  channelId: string;
  to: string;
  templateName: string;
  templateLanguage?: string;
  variables?: Record<string, string>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  dedupKey?: string;
  scheduledFor?: Date;
};

export async function enqueueTemplate(input: EnqueueTemplate) {
  const { data, error } = await sb()
    .from('wa_outbound_queue')
    .insert({
      channel_id: input.channelId,
      to_number: normalize(input.to),
      kind: 'template',
      template_name: input.templateName,
      template_language: input.templateLanguage ?? 'pt_BR',
      template_variables: input.variables ?? {},
      related_entity_type: input.relatedEntityType ?? null,
      related_entity_id: input.relatedEntityId ?? null,
      dedup_key: input.dedupKey ?? null,
      scheduled_for: input.scheduledFor?.toISOString() ?? new Date().toISOString(),
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505' && input.dedupKey) {
      const { data: existing } = await sb()
        .from('wa_outbound_queue')
        .select('id')
        .eq('dedup_key', input.dedupKey)
        .single();
      return { id: existing?.id as string | undefined, deduped: true };
    }
    throw error;
  }
  return { id: data.id as string, deduped: false };
}

/**
 * Normaliza pra E.164 sem `+`, conforme exigido pela Meta.
 * "+55 35 99999-9999", "5535999999999", "(35) 99999-9999" → "5535999999999".
 */
export function normalize(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 || digits.length === 10) return `55${digits}`;
  return digits;
}

export async function resolveChannel(opts: {
  cityId: string;
  kind: 'transactional' | 'assistant';
}) {
  const { data, error } = await sb()
    .from('wa_channels')
    .select('id, phone_number_id, enabled')
    .eq('city_id', opts.cityId)
    .eq('kind', opts.kind)
    .single();
  if (error || !data) throw new Error(`wa_channel não configurado: ${opts.cityId}/${opts.kind}`);
  if (!data.enabled) throw new Error(`wa_channel desabilitado: ${data.id}`);
  return data as { id: string; phone_number_id: string; enabled: boolean };
}

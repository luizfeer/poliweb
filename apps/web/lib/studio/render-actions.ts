'use server';

import { z } from 'zod';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { artDocumentSchema, RAMO_IDS } from './types';

// studio_renders ainda não está no database.types — cast permissivo + best-effort
// (a feature funciona mesmo antes da migration ser aplicada; só não grava histórico).
async function db() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as unknown as { from: (t: string) => any; rpc: (fn: string, args?: unknown) => any };
}

async function assertManagesBusiness(businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc('manages_business', { p_business_id: businessId });
  if (!data) throw new Error('Sem permissão para esse negócio.');
}

const renderSchema = z.object({
  businessId: z.string().uuid(),
  ramo: z.enum(RAMO_IDS),
  document: artDocumentSchema,
});

export async function renderReelAction(
  input: z.input<typeof renderSchema>,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };
  const auth = await requireProfile();
  const parsed = renderSchema.parse(input);
  await assertManagesBusiness(parsed.businessId);

  const processorUrl = process.env.NEXT_PUBLIC_MEDIA_PROCESSOR_URL ?? process.env.MEDIA_PROCESSOR_URL;
  const secret = process.env.MEDIA_PROCESSOR_SECRET;
  if (!processorUrl || !secret) {
    return { ok: false, error: 'Render de vídeo indisponível: configure MEDIA_PROCESSOR_URL/SECRET.' };
  }

  const supabase = await db();

  // histórico (best-effort: tabela pode ainda não existir)
  let renderId: string | null = null;
  try {
    const { data } = await supabase
      .from('studio_renders')
      .insert({
        city_id: city.id,
        business_id: parsed.businessId,
        status: 'rendering',
        created_by: auth.profile.id,
      })
      .select('id')
      .single();
    renderId = (data?.id as string | undefined) ?? null;
  } catch {
    // segue sem histórico
  }

  try {
    const res = await fetch(`${processorUrl.replace(/\/$/, '')}/v1/render-reel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        citySlug: city.slug,
        entityType: 'business',
        entityId: parsed.businessId,
        role: 'ad',
        ramo: parsed.ramo,
        document: parsed.document,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Processor respondeu ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as { cdnUrl?: string };
    const url = data.cdnUrl;
    if (!url) throw new Error('Processor não retornou a URL do vídeo.');

    if (renderId) {
      await supabase
        .from('studio_renders')
        .update({ status: 'done', video_url: url, updated_at: new Date().toISOString() })
        .eq('id', renderId);
    }

    return { ok: true, url };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Falha ao renderizar o vídeo.';
    if (renderId) {
      try {
        await supabase
          .from('studio_renders')
          .update({ status: 'error', error: message, updated_at: new Date().toISOString() })
          .eq('id', renderId);
      } catch {
        // ignore
      }
    }
    return { ok: false, error: message };
  }
}

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireProfile, requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { BLOCK_CATALOG } from '@/lib/home/block-catalog';
import { artDocumentSchema, FORMAT_IDS, RAMO_IDS } from './types';

// Tabelas novas (art_pieces, home_banner_requests) ainda não estão no
// database.types gerado — cast permissivo até regenerar, como em lib/home/client.
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

// ── Salvar peça ─────────────────────────────────────────────────────────────
const saveSchema = z.object({
  id: z.string().uuid().optional(),
  businessId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  ramo: z.enum(RAMO_IDS),
  format: z.enum(FORMAT_IDS),
  document: artDocumentSchema,
});

export async function saveArtPieceAction(
  input: z.input<typeof saveSchema>,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };

  const auth = await requireProfile();
  const parsed = saveSchema.parse(input);
  await assertManagesBusiness(parsed.businessId);

  const supabase = await db();
  const payload = {
    city_id: city.id,
    business_id: parsed.businessId,
    name: parsed.name,
    ramo: parsed.ramo,
    format: parsed.format,
    document: parsed.document,
  };

  if (parsed.id) {
    const { error } = await supabase
      .from('art_pieces')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', parsed.id)
      .eq('city_id', city.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/painel/comercio/${parsed.businessId}/studio`);
    return { ok: true, id: parsed.id };
  }

  const { data, error } = await supabase
    .from('art_pieces')
    .insert({ ...payload, created_by: auth.profile.id })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/painel/comercio/${parsed.businessId}/studio`);
  return { ok: true, id: data?.id };
}

// ── Pedir banner na home ────────────────────────────────────────────────────
const bannerReqSchema = z.object({
  businessId: z.string().uuid(),
  artPieceId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url(),
  imageAssetId: z.string().uuid().optional().nullable(),
  title: z.string().trim().max(120).optional().nullable(),
  linkUrl: z.string().trim().max(500).optional().nullable(),
});

export async function requestHomeBannerAction(
  input: z.input<typeof bannerReqSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };

  const auth = await requireProfile();
  const parsed = bannerReqSchema.parse(input);
  await assertManagesBusiness(parsed.businessId);

  const supabase = await db();
  const { error } = await supabase.from('home_banner_requests').insert({
    city_id: city.id,
    business_id: parsed.businessId,
    art_piece_id: parsed.artPieceId ?? null,
    image_url: parsed.imageUrl,
    image_asset_id: parsed.imageAssetId ?? null,
    title: parsed.title ?? null,
    link_url: parsed.linkUrl ?? null,
    status: 'pending',
    created_by: auth.profile.id,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/painel/comercio/${parsed.businessId}/studio`);
  revalidatePath('/painel/cidade/home/banners');
  return { ok: true };
}

// ── Admin: aprovar / recusar ────────────────────────────────────────────────
async function ensureBannerCarouselBlock(cityId: string): Promise<string> {
  const supabase = await db();
  const layoutId = await supabase.rpc('ensure_home_layout', { p_city_id: cityId }).then(
    (r: { data: unknown }) => (typeof r.data === 'string' ? r.data : null),
  );
  if (!layoutId) throw new Error('Falha ao garantir layout da home.');

  const { data: existing } = await supabase
    .from('home_blocks')
    .select('id')
    .eq('layout_id', layoutId)
    .eq('type', 'banner_carousel')
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: maxRow } = await supabase
    .from('home_blocks')
    .select('position')
    .eq('layout_id', layoutId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = ((maxRow?.position as number | undefined) ?? -1) + 1;

  const { data: created, error } = await supabase
    .from('home_blocks')
    .insert({
      layout_id: layoutId,
      city_id: cityId,
      type: 'banner_carousel',
      position: nextPosition,
      enabled: true,
      title: null,
      config: BLOCK_CATALOG.banner_carousel.defaultConfig as unknown,
    })
    .select('id')
    .single();
  if (error || !created?.id) throw new Error(error?.message ?? 'Falha ao criar bloco de banner.');
  return created.id;
}

export async function approveBannerRequestAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };
  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const requestId = z.string().uuid().parse(formData.get('request_id'));
  const supabase = await db();

  const { data: req } = await supabase
    .from('home_banner_requests')
    .select('id, business_id, image_asset_id, title, link_url, status')
    .eq('id', requestId)
    .eq('city_id', city.id)
    .maybeSingle();
  if (!req) return { ok: false, error: 'Pedido não encontrado.' };
  if (!req.image_asset_id) return { ok: false, error: 'Pedido sem imagem registrada na mídia.' };

  try {
    const blockId = await ensureBannerCarouselBlock(city.id);

    const { data: maxRow } = await supabase
      .from('home_block_banners')
      .select('position')
      .eq('block_id', blockId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPosition = ((maxRow?.position as number | undefined) ?? -1) + 1;

    const { error: bannerError } = await supabase.from('home_block_banners').insert({
      block_id: blockId,
      city_id: city.id,
      position: nextPosition,
      title: req.title,
      subtitle: null,
      image_asset_id: req.image_asset_id,
      link_type: req.link_url ? 'external' : 'none',
      link_url: req.link_url,
      link_target: '_blank',
      active: true,
    });
    if (bannerError) return { ok: false, error: bannerError.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha ao publicar banner.' };
  }

  const { error } = await supabase
    .from('home_banner_requests')
    .update({ status: 'approved', reviewed_by: auth.profile.id, reviewed_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('city_id', city.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/painel/cidade/home/banners');
  revalidatePath('/painel/cidade/home');
  revalidatePath('/');
  return { ok: true };
}

export async function rejectBannerRequestAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };
  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const requestId = z.string().uuid().parse(formData.get('request_id'));
  const note = z.string().trim().max(300).optional().parse(formData.get('note') || undefined);

  const supabase = await db();
  const { error } = await supabase
    .from('home_banner_requests')
    .update({
      status: 'rejected',
      review_note: note ?? null,
      reviewed_by: auth.profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('city_id', city.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/painel/cidade/home/banners');
  return { ok: true };
}

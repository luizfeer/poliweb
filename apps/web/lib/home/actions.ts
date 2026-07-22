'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { BLOCK_CATALOG, BLOCK_TYPES } from './block-catalog';
import { createHomeClient } from './client';
import { sanitizeHomeRawHtml } from './sanitize-raw-html';
import type { HomeBlockType } from './types';

const PUBLIC_HOME = '/';
const ADMIN_HOME = '/painel/cidade/home';

function revalidateHome() {
  revalidatePath(PUBLIC_HOME);
  revalidatePath(ADMIN_HOME);
}

async function getCityForAdmin() {
  const city = await getCurrentCity();
  if (!city) throw new Error('Cidade nao resolvida.');
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  return city;
}

async function ensureLayout(cityId: string): Promise<string> {
  const supabase = await createHomeClient();
  const { data, error } = await supabase.rpc('ensure_home_layout', { p_city_id: cityId });
  if (error) throw new Error(error.message);
  if (typeof data === 'string') return data;
  throw new Error('Falha ao garantir layout da home.');
}

// ── Layout (config geral: margem topo, fade) ───────────────────────────────

const layoutConfigSchema = z.object({
  topMargin: z.enum(['none', 'sm', 'md', 'lg']).optional(),
  headerFade: z.boolean().optional(),
});

export async function updateHomeLayoutConfigAction(input: z.input<typeof layoutConfigSchema>) {
  const city = await getCityForAdmin();
  const parsed = layoutConfigSchema.parse(input);

  const layoutId = await ensureLayout(city.id);
  const supabase = await createHomeClient();

  const { error } = await supabase
    .from('home_layouts')
    .update({ config: parsed })
    .eq('id', layoutId)
    .eq('city_id', city.id);

  if (error) throw new Error(error.message);
  revalidateHome();
}

// ── Blocos ──────────────────────────────────────────────────────────────────

const blockTypeSchema = z.enum(BLOCK_TYPES);

const createBlockSchema = z.object({
  type: blockTypeSchema,
  title: z.string().trim().max(120).optional().transform((v) => v || null),
});

export async function createHomeBlockAction(formData: FormData) {
  const city = await getCityForAdmin();
  const parsed = createBlockSchema.parse({
    type: formData.get('type'),
    title: formData.get('title') || undefined,
  });

  const layoutId = await ensureLayout(city.id);
  const supabase = await createHomeClient();

  const { data: maxRow } = await supabase
    .from('home_blocks')
    .select('position')
    .eq('layout_id', layoutId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = ((maxRow as { position: number } | null)?.position ?? -1) + 1;
  const meta = BLOCK_CATALOG[parsed.type as HomeBlockType];

  const { error } = await supabase.from('home_blocks').insert({
    layout_id: layoutId,
    city_id: city.id,
    type: parsed.type,
    position: nextPosition,
    enabled: true,
    title: parsed.title ?? meta.defaultTitle,
    config: meta.defaultConfig as unknown,
  });

  if (error) throw new Error(error.message);
  revalidateHome();
}

const updateBlockSchema = z.object({
  blockId: z.string().uuid(),
  title: z.string().trim().max(120).optional().transform((v) => v || null),
  config: z.string().min(2),
  groupWithNext: z.coerce.boolean().optional(),
  groupTitle: z.string().trim().max(120).optional().transform((v) => v || null),
});

export async function updateHomeBlockAction(formData: FormData) {
  const city = await getCityForAdmin();
  const parsed = updateBlockSchema.parse({
    blockId: formData.get('block_id'),
    title: formData.get('title') || undefined,
    config: formData.get('config'),
    groupWithNext:
      formData.get('group_with_next') === 'on' ||
      formData.get('group_with_next') === 'true',
    groupTitle: formData.get('group_title') || undefined,
  });

  let configJson: unknown;
  try {
    configJson = JSON.parse(parsed.config);
  } catch {
    throw new Error('Configuracao JSON invalida.');
  }

  const supabase = await createHomeClient();

  // Descobrir o tipo do bloco pra saber se precisa reconciliar media_links.
  const { data: blockRow } = await supabase
    .from('home_blocks')
    .select('type')
    .eq('id', parsed.blockId)
    .eq('city_id', city.id)
    .maybeSingle();

  const blockType = (blockRow as { type: HomeBlockType } | null)?.type ?? null;

  // Sanitiza o HTML cru na ESCRITA — o DB nunca guarda markup sujo. Isso protege
  // o mobile (que injeta o html direto num WebView) e o web (que sanitiza de novo
  // no render como segunda barreira).
  if (blockType === 'raw_html') {
    configJson = sanitizeRawHtmlConfig(configJson);
  }

  const { error } = await supabase
    .from('home_blocks')
    .update({
      title: parsed.title,
      config: configJson,
      group_with_next: parsed.groupWithNext ?? false,
      group_title: parsed.groupTitle,
    })
    .eq('id', parsed.blockId)
    .eq('city_id', city.id);

  if (error) throw new Error(error.message);

  // Reconcilia media_links com os assetIds atualmente referenciados no config.
  if (
    blockType === 'hero_composite' ||
    blockType === 'featured_promo_grid' ||
    blockType === 'raw_html'
  ) {
    await reconcileBlockMediaLinks(parsed.blockId, city.id, blockType, configJson);
  }

  revalidateHome();
}

function sanitizeRawHtmlConfig(config: unknown): unknown {
  if (!config || typeof config !== 'object') return config;
  const html = (config as { html?: unknown }).html;
  if (typeof html !== 'string') return config;
  return { ...(config as Record<string, unknown>), html: sanitizeHomeRawHtml(html) };
}

type AssetLink = { assetId: string; role: 'cover' | 'gallery' };

type ReconcilableBlockType = 'hero_composite' | 'featured_promo_grid' | 'raw_html';

function collectAssetLinks(
  blockType: ReconcilableBlockType,
  config: unknown,
): AssetLink[] {
  if (!config || typeof config !== 'object') return [];
  const out: AssetLink[] = [];

  if (blockType === 'hero_composite') {
    const hero = (config as { hero?: { imageAssetId?: unknown } }).hero;
    const id = hero?.imageAssetId;
    if (typeof id === 'string' && id) out.push({ assetId: id, role: 'cover' });
  }

  if (blockType === 'featured_promo_grid') {
    const items = (config as { items?: Array<{ imageAssetId?: unknown }> }).items ?? [];
    for (const item of items) {
      const id = item?.imageAssetId;
      if (typeof id === 'string' && id) out.push({ assetId: id, role: 'gallery' });
    }
  }

  if (blockType === 'raw_html') {
    const gallery = (config as { gallery?: Array<{ assetId?: unknown }> }).gallery ?? [];
    for (const item of gallery) {
      const id = item?.assetId;
      if (typeof id === 'string' && id) out.push({ assetId: id, role: 'gallery' });
    }
  }

  // Dedupe por assetId — um mesmo asset reusado em 2 slots vira 1 link só.
  const seen = new Set<string>();
  return out.filter((l) => (seen.has(l.assetId) ? false : (seen.add(l.assetId), true)));
}

async function reconcileBlockMediaLinks(
  blockId: string,
  cityId: string,
  blockType: ReconcilableBlockType,
  config: unknown,
) {
  const supabase = await createHomeClient();
  const desired = collectAssetLinks(blockType, config);

  // Drop tudo que tem hoje pra esse block e reinsere com base no estado atual.
  // Idempotente e simples — N pequeno (até ~10 cards).
  await supabase
    .from('media_links')
    .delete()
    .eq('city_id', cityId)
    .eq('entity_type', 'home_block')
    .eq('entity_id', blockId);

  if (desired.length === 0) return;

  await supabase.from('media_links').insert(
    desired.map((link) => ({
      city_id: cityId,
      entity_type: 'home_block',
      entity_id: blockId,
      asset_id: link.assetId,
      role: link.role,
    })),
  );
}

const toggleBlockSchema = z.object({
  blockId: z.string().uuid(),
  enabled: z.coerce.boolean(),
});

export async function toggleHomeBlockAction(formData: FormData) {
  const city = await getCityForAdmin();
  const parsed = toggleBlockSchema.parse({
    blockId: formData.get('block_id'),
    enabled: formData.get('enabled') === 'on' || formData.get('enabled') === 'true',
  });

  const supabase = await createHomeClient();
  const { error } = await supabase
    .from('home_blocks')
    .update({ enabled: parsed.enabled })
    .eq('id', parsed.blockId)
    .eq('city_id', city.id);

  if (error) throw new Error(error.message);
  revalidateHome();
}

const moveBlockSchema = z.object({
  blockId: z.string().uuid(),
  direction: z.enum(['up', 'down']),
});

export async function moveHomeBlockAction(formData: FormData) {
  const city = await getCityForAdmin();
  const parsed = moveBlockSchema.parse({
    blockId: formData.get('block_id'),
    direction: formData.get('direction'),
  });

  const supabase = await createHomeClient();
  const { data: current } = await supabase
    .from('home_blocks')
    .select('id, layout_id, position')
    .eq('id', parsed.blockId)
    .eq('city_id', city.id)
    .maybeSingle();

  if (!current) return;
  const me = current as { id: string; layout_id: string; position: number };

  const op = parsed.direction === 'up' ? 'lt' : 'gt';
  const order = parsed.direction === 'up' ? false : true;

  const { data: neighbor } = await supabase
    .from('home_blocks')
    .select('id, position')
    .eq('layout_id', me.layout_id)
    [op]('position', me.position)
    .order('position', { ascending: order })
    .limit(1)
    .maybeSingle();

  if (!neighbor) return;
  const other = neighbor as { id: string; position: number };

  await supabase
    .from('home_blocks')
    .update({ position: other.position })
    .eq('id', me.id);
  await supabase
    .from('home_blocks')
    .update({ position: me.position })
    .eq('id', other.id);

  revalidateHome();
}

const reorderBlocksSchema = z.object({
  blockIds: z.array(z.string().uuid()).min(1).max(200),
});

export async function reorderHomeBlocksAction(input: z.input<typeof reorderBlocksSchema>) {
  const city = await getCityForAdmin();
  const parsed = reorderBlocksSchema.parse(input);

  const supabase = await createHomeClient();

  // Verifica que todos os blocos pertencem a essa cidade antes de reordenar.
  const { data: existing } = await supabase
    .from('home_blocks')
    .select('id')
    .eq('city_id', city.id)
    .in('id', parsed.blockIds);

  const validIds = new Set(((existing ?? []) as { id: string }[]).map((row) => row.id));
  const valid = parsed.blockIds.filter((id) => validIds.has(id));

  // Atualiza em sequencia (poucos blocos, sem necessidade de RPC dedicada).
  for (let index = 0; index < valid.length; index += 1) {
    await supabase
      .from('home_blocks')
      .update({ position: index })
      .eq('id', valid[index])
      .eq('city_id', city.id);
  }

  revalidateHome();
}

const reorderBannersSchema = z.object({
  blockId: z.string().uuid(),
  bannerIds: z.array(z.string().uuid()).min(1).max(200),
});

export async function reorderHomeBannersAction(input: z.input<typeof reorderBannersSchema>) {
  const city = await getCityForAdmin();
  const parsed = reorderBannersSchema.parse(input);

  const supabase = await createHomeClient();
  const { data: existing } = await supabase
    .from('home_block_banners')
    .select('id')
    .eq('city_id', city.id)
    .eq('block_id', parsed.blockId)
    .in('id', parsed.bannerIds);

  const validIds = new Set(((existing ?? []) as { id: string }[]).map((row) => row.id));
  const valid = parsed.bannerIds.filter((id) => validIds.has(id));

  for (let index = 0; index < valid.length; index += 1) {
    await supabase
      .from('home_block_banners')
      .update({ position: index })
      .eq('id', valid[index])
      .eq('city_id', city.id);
  }

  revalidateHome();
}

const deleteBlockSchema = z.object({ blockId: z.string().uuid() });

export async function deleteHomeBlockAction(formData: FormData) {
  const city = await getCityForAdmin();
  const parsed = deleteBlockSchema.parse({ blockId: formData.get('block_id') });

  const supabase = await createHomeClient();
  const { error } = await supabase
    .from('home_blocks')
    .delete()
    .eq('id', parsed.blockId)
    .eq('city_id', city.id);

  if (error) throw new Error(error.message);
  revalidateHome();
}

// ── Banners ─────────────────────────────────────────────────────────────────

const createBannerSchema = z.object({
  blockId: z.string().uuid(),
  imageAssetId: z.string().uuid(),
  videoAssetId: z.string().uuid().optional().nullable(),
  title: z.string().trim().max(120).optional().transform((v) => v || null),
  subtitle: z.string().trim().max(200).optional().transform((v) => v || null),
  linkType: z.enum(['internal', 'external', 'none']).default('none'),
  linkUrl: z.string().trim().max(500).optional().transform((v) => v || null),
  linkTarget: z.enum(['_self', '_blank']).default('_self'),
  startAt: z.string().trim().optional().transform((v) => v || null),
  endAt: z.string().trim().optional().transform((v) => v || null),
});

export async function createHomeBannerAction(input: z.input<typeof createBannerSchema>) {
  const city = await getCityForAdmin();
  const parsed = createBannerSchema.parse(input);

  const supabase = await createHomeClient();

  // Verifica que o bloco existe na cidade e aceita midia de banner.
  const { data: block } = await supabase
    .from('home_blocks')
    .select('id, type')
    .eq('id', parsed.blockId)
    .eq('city_id', city.id)
    .maybeSingle();

  const b = block as { id: string; type: HomeBlockType } | null;
  if (
    !b ||
    !['banner_carousel', 'wide_banner', 'custom_hero_banner'].includes(b.type)
  ) {
    throw new Error('Bloco invalido para banners.');
  }

  if (parsed.linkType !== 'none' && !parsed.linkUrl) {
    throw new Error('Informe a URL do link.');
  }

  const { data: maxRow } = await supabase
    .from('home_block_banners')
    .select('position')
    .eq('block_id', parsed.blockId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = ((maxRow as { position: number } | null)?.position ?? -1) + 1;

  const { error } = await supabase.from('home_block_banners').insert({
    block_id: parsed.blockId,
    city_id: city.id,
    position: nextPosition,
    title: parsed.title,
    subtitle: parsed.subtitle,
    image_asset_id: parsed.imageAssetId,
    video_asset_id: parsed.videoAssetId ?? null,
    link_type: parsed.linkType,
    link_url: parsed.linkUrl,
    link_target: parsed.linkTarget,
    active: true,
    start_at: parsed.startAt,
    end_at: parsed.endAt,
  });

  if (error) throw new Error(error.message);
  revalidateHome();
}

const updateBannerSchema = createBannerSchema.extend({
  bannerId: z.string().uuid(),
  active: z.coerce.boolean().optional(),
});

export async function updateHomeBannerAction(input: z.input<typeof updateBannerSchema>) {
  const city = await getCityForAdmin();
  const parsed = updateBannerSchema.parse(input);

  const supabase = await createHomeClient();
  const { error } = await supabase
    .from('home_block_banners')
    .update({
      title: parsed.title,
      subtitle: parsed.subtitle,
      image_asset_id: parsed.imageAssetId,
      video_asset_id: parsed.videoAssetId ?? null,
      link_type: parsed.linkType,
      link_url: parsed.linkUrl,
      link_target: parsed.linkTarget,
      start_at: parsed.startAt,
      end_at: parsed.endAt,
      active: parsed.active ?? true,
    })
    .eq('id', parsed.bannerId)
    .eq('city_id', city.id);

  if (error) throw new Error(error.message);
  revalidateHome();
}

const moveBannerSchema = z.object({
  bannerId: z.string().uuid(),
  direction: z.enum(['up', 'down']),
});

export async function moveHomeBannerAction(formData: FormData) {
  const city = await getCityForAdmin();
  const parsed = moveBannerSchema.parse({
    bannerId: formData.get('banner_id'),
    direction: formData.get('direction'),
  });

  const supabase = await createHomeClient();
  const { data: current } = await supabase
    .from('home_block_banners')
    .select('id, block_id, position')
    .eq('id', parsed.bannerId)
    .eq('city_id', city.id)
    .maybeSingle();

  if (!current) return;
  const me = current as { id: string; block_id: string; position: number };

  const op = parsed.direction === 'up' ? 'lt' : 'gt';
  const order = parsed.direction === 'up' ? false : true;

  const { data: neighbor } = await supabase
    .from('home_block_banners')
    .select('id, position')
    .eq('block_id', me.block_id)
    [op]('position', me.position)
    .order('position', { ascending: order })
    .limit(1)
    .maybeSingle();

  if (!neighbor) return;
  const other = neighbor as { id: string; position: number };

  await supabase
    .from('home_block_banners')
    .update({ position: other.position })
    .eq('id', me.id);
  await supabase
    .from('home_block_banners')
    .update({ position: me.position })
    .eq('id', other.id);

  revalidateHome();
}

const toggleBannerSchema = z.object({
  bannerId: z.string().uuid(),
  active: z.coerce.boolean(),
});

export async function toggleHomeBannerAction(formData: FormData) {
  const city = await getCityForAdmin();
  const parsed = toggleBannerSchema.parse({
    bannerId: formData.get('banner_id'),
    active: formData.get('active') === 'on' || formData.get('active') === 'true',
  });

  const supabase = await createHomeClient();
  const { error } = await supabase
    .from('home_block_banners')
    .update({ active: parsed.active })
    .eq('id', parsed.bannerId)
    .eq('city_id', city.id);

  if (error) throw new Error(error.message);
  revalidateHome();
}

const deleteBannerSchema = z.object({ bannerId: z.string().uuid() });

export async function deleteHomeBannerAction(formData: FormData) {
  const city = await getCityForAdmin();
  const parsed = deleteBannerSchema.parse({ bannerId: formData.get('banner_id') });

  const supabase = await createHomeClient();
  const { error } = await supabase
    .from('home_block_banners')
    .delete()
    .eq('id', parsed.bannerId)
    .eq('city_id', city.id);

  if (error) throw new Error(error.message);
  revalidateHome();
}

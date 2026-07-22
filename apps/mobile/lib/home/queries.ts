import { supabase } from '@/lib/supabase';

import { homeCacheGet, homeCacheSet, HOME_CACHE_TTL_MS } from './cache';
import type { HomeBanner, HomeBlock, HomeBlockType, HomeLayout, HomeLayoutConfig } from './types';

type BlockRow = {
  id: string;
  layout_id: string;
  city_id: string;
  type: HomeBlockType;
  position: number;
  enabled: boolean;
  title: string | null;
  config: Record<string, unknown>;
  group_with_next: boolean | null;
  group_title: string | null;
};

type BannerRow = {
  id: string;
  block_id: string;
  position: number;
  title: string | null;
  subtitle: string | null;
  image_asset_id: string;
  video_asset_id: string | null;
  link_type: 'internal' | 'external' | 'none';
  link_url: string | null;
  link_target: '_self' | '_blank';
  active: boolean;
  start_at: string | null;
  end_at: string | null;
  image: { cdn_url: string; alt_text: string | null } | null;
  video: { cdn_url: string; content_type: string } | null;
};

type LayoutRow = { id: string; city_id: string; config?: Record<string, unknown> | null };

function toLayoutConfig(raw: Record<string, unknown> | null | undefined): HomeLayoutConfig {
  const defaults: HomeLayoutConfig = { topMargin: 'none', headerFade: false };
  if (!raw || typeof raw !== 'object') return defaults;
  const topMargin = raw.topMargin;
  const headerFade = raw.headerFade;
  return {
    topMargin:
      topMargin === 'none' || topMargin === 'sm' || topMargin === 'md' || topMargin === 'lg'
        ? topMargin
        : defaults.topMargin,
    headerFade: typeof headerFade === 'boolean' ? headerFade : defaults.headerFade,
  };
}

function toBanner(row: BannerRow): HomeBanner | null {
  if (!row.image?.cdn_url) return null;
  return {
    id: row.id,
    blockId: row.block_id,
    position: row.position,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image.cdn_url,
    imageAlt: row.image.alt_text,
    videoUrl: row.video?.cdn_url ?? null,
    videoContentType: row.video?.content_type ?? null,
    linkType: row.link_type,
    linkUrl: row.link_url,
    linkTarget: row.link_target,
    active: row.active,
    startAt: row.start_at,
    endAt: row.end_at,
  };
}

function isBannerActiveNow(banner: HomeBanner, nowMs: number): boolean {
  if (!banner.active) return false;
  if (banner.startAt && Date.parse(banner.startAt) > nowMs) return false;
  if (banner.endAt && Date.parse(banner.endAt) < nowMs) return false;
  return true;
}

async function loadHomeLayoutUncached(cityId: string): Promise<HomeLayout | null> {
  const { data: layout } = await supabase
    .from('home_layouts')
    .select('id, city_id, config')
    .eq('city_id', cityId)
    .maybeSingle<LayoutRow>();

  if (!layout) return null;
  const layoutConfig = toLayoutConfig(layout.config);

  const { data: blocksRaw } = await supabase
    .from('home_blocks')
    .select('id, layout_id, city_id, type, position, enabled, title, config, group_with_next, group_title')
    .eq('layout_id', layout.id)
    .eq('enabled', true)
    .order('position', { ascending: true });

  const blocks = (blocksRaw ?? []) as BlockRow[];
  if (blocks.length === 0) {
    return { id: layout.id, cityId, config: layoutConfig, blocks: [] };
  }

  const carouselIds = blocks
    .filter(
      (b) =>
        b.type === 'banner_carousel' ||
        b.type === 'wide_banner' ||
        b.type === 'custom_hero_banner',
    )
    .map((b) => b.id);

  const bannersByBlock = new Map<string, HomeBanner[]>();
  if (carouselIds.length > 0) {
    const { data: bannerRows } = await supabase
      .from('home_block_banners')
      .select(
        'id, block_id, position, title, subtitle, image_asset_id, video_asset_id, link_type, link_url, link_target, active, start_at, end_at, image:media_assets!image_asset_id(cdn_url, alt_text), video:media_assets!video_asset_id(cdn_url, content_type)',
      )
      .in('block_id', carouselIds)
      .order('position', { ascending: true });

    const now = Date.now();
    for (const row of (bannerRows ?? []) as unknown as BannerRow[]) {
      const banner = toBanner(row);
      if (!banner || !isBannerActiveNow(banner, now)) continue;
      const list = bannersByBlock.get(banner.blockId) ?? [];
      list.push(banner);
      bannersByBlock.set(banner.blockId, list);
    }
  }

  const hydrated: HomeBlock[] = blocks.map((b) => ({
    id: b.id,
    layoutId: b.layout_id,
    cityId: b.city_id,
    type: b.type,
    position: b.position,
    enabled: b.enabled,
    title: b.title,
    config: b.config as HomeBlock['config'],
    banners: bannersByBlock.get(b.id) ?? [],
    groupWithNext: b.group_with_next ?? false,
    groupTitle: b.group_title,
  }));

  return { id: layout.id, cityId, config: layoutConfig, blocks: hydrated };
}

export async function getHomeLayoutForMobile(cityId: string): Promise<HomeLayout | null> {
  const cacheKey = `home:layout:${cityId}`;
  const cached = homeCacheGet<HomeLayout | null>(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const layout = await loadHomeLayoutUncached(cityId);
  homeCacheSet(cacheKey, layout, HOME_CACHE_TTL_MS);
  return layout;
}

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

import { loadHomeBlockData, type HomeBlockDataBag } from './block-data';
import {
  homeCacheGet,
  homeCacheInvalidate,
  homeCachePersistClear,
  homeCachePersistGet,
  homeCachePersistSet,
  homeCacheSet,
  HOME_CACHE_TTL_MS,
} from './cache';
import { getHomeLayoutForMobile } from './queries';
import type { HomeBanner, HomeLayout } from './types';
import {
  clearVideoCache,
  ensureVideoCached,
  getCachedVideoUri,
  pruneVideoCache,
} from './video-cache';

export type HomeCity = {
  id: string;
  name: string;
  slug: string;
  modules: string[];
};

export type HomeVideoAd = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string;
  clickUrl: string;
  videoUrl: string;
  posterUrl: string | null;
  aspectRatio: number;
  muteDefault: boolean;
  businessId: string | null;
};

export type HomeChurchEvent = {
  id: string;
  title: string;
  time: string;
  churchSlug: string;
  churchName: string | null;
};

/** Extras ainda fora do Home Builder — renderizados no fim da home. */
export type HomeMobileExtras = {
  videoAds: HomeVideoAd[];
  churchSchedule: HomeChurchEvent[];
};

export type HomeScreenPayload = {
  city: HomeCity | null;
  layout: HomeLayout | null;
  data: HomeBlockDataBag;
  mobileExtras: HomeMobileExtras;
};

const EMPTY_DATA: HomeBlockDataBag = {
  featuredBusinesses: [],
  recentBusinesses: [],
  lodgings: [],
  attractions: [],
  promotions: [],
  weather: null,
  transparency: null,
  dutyPharmacyName: null,
  alertTitle: null,
  alertArea: null,
};

const EMPTY: HomeScreenPayload = {
  city: null,
  layout: null,
  data: EMPTY_DATA,
  mobileExtras: { videoAds: [], churchSchedule: [] },
};

type CityRow = {
  id: string;
  slug: string;
  name: string;
  city_modules: { module_key: string; enabled: boolean | null }[] | null;
};

/**
 * Home unificada: layout do Home Builder (Supabase) + dados dos blocos, com cache em memória (60s).
 */
async function rewriteAdsWithLocalVideos(extras: HomeMobileExtras): Promise<HomeMobileExtras> {
  if (extras.videoAds.length === 0) return extras;
  const ads = await Promise.all(
    extras.videoAds.map(async (ad) => {
      const local = await getCachedVideoUri(ad.videoUrl);
      return local ? { ...ad, videoUrl: local } : ad;
    }),
  );
  return { ...extras, videoAds: ads };
}

function collectBannerVideoUrls(layout: HomeLayout | null): string[] {
  if (!layout) return [];
  const urls: string[] = [];
  for (const block of layout.blocks) {
    for (const banner of block.banners) {
      if (banner.videoUrl && !banner.videoUrl.startsWith('file://')) {
        urls.push(banner.videoUrl);
      }
    }
  }
  return urls;
}

async function rewriteLayoutWithLocalBannerVideos(
  layout: HomeLayout | null,
): Promise<HomeLayout | null> {
  if (!layout) return layout;
  const blocks = await Promise.all(
    layout.blocks.map(async (block) => {
      if (block.banners.length === 0) return block;
      const banners: HomeBanner[] = await Promise.all(
        block.banners.map(async (banner) => {
          if (!banner.videoUrl) return banner;
          const local = await getCachedVideoUri(banner.videoUrl);
          return local ? { ...banner, videoUrl: local } : banner;
        }),
      );
      return { ...block, banners };
    }),
  );
  return { ...layout, blocks };
}

/** Lê o último snapshot persistido, sem rede. Usado no boot pra pintar a home instantaneamente. */
export async function getHomeScreenPersisted(
  citySlug = env.defaultCitySlug,
): Promise<HomeScreenPayload | null> {
  const persisted = await homeCachePersistGet<HomeScreenPayload>(`screen:${citySlug}`);
  if (!persisted) return null;
  const [mobileExtras, layout] = await Promise.all([
    rewriteAdsWithLocalVideos(persisted.mobileExtras),
    rewriteLayoutWithLocalBannerVideos(persisted.layout),
  ]);
  return { ...persisted, mobileExtras, layout };
}

export async function fetchHomeScreen(citySlug = env.defaultCitySlug): Promise<HomeScreenPayload> {
  const cacheKey = `home:screen:${citySlug}`;
  const cached = homeCacheGet<HomeScreenPayload>(cacheKey);
  if (cached) return cached;

  try {
    const { data: city } = await supabase
      .from('cities')
      .select('id, slug, name, city_modules(module_key, enabled)')
      .eq('slug', citySlug)
      .maybeSingle<CityRow>();

    if (!city) return EMPTY;

    const modules = (city.city_modules ?? [])
      .filter((m) => m.enabled !== false)
      .map((m) => m.module_key);

    const homeCity: HomeCity = {
      id: city.id,
      slug: city.slug,
      name: city.name,
      modules,
    };

    const layout = await getHomeLayoutForMobile(city.id);
    const blocks = layout?.blocks ?? [];
    const data =
      blocks.length > 0 ? await loadHomeBlockData(city.id, blocks, modules) : EMPTY_DATA;

    const mobileExtras = await loadMobileExtras(city.id);

    const payload: HomeScreenPayload = {
      city: homeCity,
      layout,
      data,
      mobileExtras,
    };
    homeCacheSet(cacheKey, payload, HOME_CACHE_TTL_MS);

    // Persiste pra próximo cold start e mantém cache de vídeos sincronizado.
    void homeCachePersistSet(`screen:${citySlug}`, payload);
    const remoteAdUrls = mobileExtras.videoAds
      .map((a) => a.videoUrl)
      .filter((u) => !u.startsWith('file://'));
    const remoteBannerUrls = collectBannerVideoUrls(layout);
    const remoteVideoUrls = [...remoteAdUrls, ...remoteBannerUrls];
    void pruneVideoCache(remoteVideoUrls);
    for (const url of remoteVideoUrls) {
      void ensureVideoCached(url);
    }

    // Devolve com URIs locais quando já existem em disco.
    const [withLocalAds, withLocalLayout] = await Promise.all([
      rewriteAdsWithLocalVideos(mobileExtras),
      rewriteLayoutWithLocalBannerVideos(layout),
    ]);
    return { ...payload, mobileExtras: withLocalAds, layout: withLocalLayout };
  } catch (error) {
    if (__DEV__) console.warn('[fetchHomeScreen]', error);
    return EMPTY;
  }
}

/** Invalida cache após pull-to-refresh. */
async function loadMobileExtras(cityId: string): Promise<HomeMobileExtras> {
  const { data, error } = await supabase
    .from('home_video_ads')
    .select(
      'id, title, subtitle, cta_label, click_url, video_url, poster_url, aspect_ratio, mute_default, business_id',
    )
    .eq('city_id', cityId)
    .eq('status', 'active')
    .order('priority', { ascending: false })
    .limit(6);

  if (error || !data) {
    return { videoAds: [], churchSchedule: [] };
  }

  const videoAds: HomeVideoAd[] = (
    data as Array<{
      id: string;
      title: string;
      subtitle: string | null;
      cta_label: string;
      click_url: string;
      video_url: string;
      poster_url: string | null;
      aspect_ratio: number | string;
      mute_default: boolean;
      business_id: string | null;
    }>
  ).map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    ctaLabel: row.cta_label,
    clickUrl: row.click_url,
    videoUrl: row.video_url,
    posterUrl: row.poster_url,
    aspectRatio: Number(row.aspect_ratio) || 16 / 9,
    muteDefault: row.mute_default,
    businessId: row.business_id,
  }));

  return { videoAds, churchSchedule: [] };
}

export function invalidateHomeScreenCache(citySlug?: string): void {
  const slug = citySlug ?? env.defaultCitySlug;
  homeCacheInvalidate(`home:screen:${slug}`);
  homeCacheInvalidate('home:layout:');
  homeCacheInvalidate('home:data:');
}

/** Limpa tudo (memória + disco + vídeos). Chamar no signOut. */
export async function clearHomeScreenCacheFully(): Promise<void> {
  homeCacheInvalidate('home:');
  await Promise.all([homeCachePersistClear(), clearVideoCache()]);
}

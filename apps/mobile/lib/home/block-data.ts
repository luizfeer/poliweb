import {
  categorySlugsFromAssignments,
  hasPousadaCategory,
} from '@/lib/businesses/pousadas-category';
import { getBusinessRating } from '@/lib/businesses/business-rating';
import { resolveAttractionCover } from '@/lib/media/cover-image';
import { supabase } from '@/lib/supabase';

import { homeCacheGet, homeCacheSet, HOME_CACHE_TTL_MS } from './cache';
import type { HomeBlock, HomeBlockType } from './types';

export type HomeBusiness = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  district: string | null;
  rating: number | null;
  reviewsCount: number | null;
  coverUrl: string | null;
  featured: boolean;
  lat?: number | null;
  lng?: number | null;
};

export type HomePromotion = {
  id: string;
  title: string;
  businessName: string;
  businessSlug: string;
  discountPercent: number | null;
};

export type HomeAttraction = {
  id: string;
  slug: string;
  name: string;
  coverUrl: string | null;
  shortDescription: string | null;
  kind: string | null;
  rating: number | null;
  reviewsCount: number | null;
  featured: boolean;
};

export type HomeWeatherDay = {
  date: string;
  weatherCode: number | null;
  tempMax: number | null;
  tempMin: number | null;
  precipitationProbabilityMax: number | null;
};

export type HomeWeather = {
  temperature: number | null;
  weatherCode: number | null;
  description: string | null;
  high: number | null;
  low: number | null;
  daily: HomeWeatherDay[];
};

export type TransparencyPulseData = {
  highlightTitle: string;
  highlightMeta: string;
  newsCount: number;
  officialCount: number;
};

export type HomeBlockDataBag = {
  featuredBusinesses: HomeBusiness[];
  recentBusinesses: HomeBusiness[];
  lodgings: HomeBusiness[];
  attractions: HomeAttraction[];
  promotions: HomePromotion[];
  weather: HomeWeather | null;
  transparency: TransparencyPulseData | null;
  dutyPharmacyName: string | null;
  alertTitle: string | null;
  alertArea: string | null;
};

const EMPTY_BAG: HomeBlockDataBag = {
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

type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  cover_url: string | null;
  logo_url: string | null;
  photos: unknown;
  import_source: unknown;
  featured: boolean | null;
  lat: number | null;
  lng: number | null;
  created_at: string | null;
  districts: { name: string | null } | null;
  business_category_assignments:
    | {
        is_primary: boolean | null;
        business_categories: { slug: string; name: string } | null;
      }[]
    | null;
  business_reviews: { rating: number | null; status: string | null }[] | null;
};

type AttractionRow = {
  id: string;
  slug: string;
  name: string;
  type: string | null;
  cover_url: string | null;
  photos: unknown;
  google_photos: unknown;
  description: string | null;
  google_summary: string | null;
  rating: number | null;
  reviews_count: number | null;
  featured: boolean | null;
};

const WEATHER_CODES: Record<number, string> = {
  0: 'Céu limpo',
  1: 'Quase limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina',
  51: 'Garoa',
  61: 'Chuva',
  63: 'Chuva',
  65: 'Chuva forte',
  80: 'Pancadas de chuva',
  95: 'Tempestade',
};

function blockTypesNeeding(blocks: HomeBlock[]): Set<string> {
  const needs = new Set<string>();
  for (const block of blocks) {
    needs.add(block.type);
    if (block.type === 'entity_list') {
      const source = (block.config as { source?: string }).source;
      if (source) needs.add(`entity:${source}`);
    }
  }
  return needs;
}

export async function loadHomeBlockData(
  cityId: string,
  blocks: HomeBlock[],
  modules: string[],
): Promise<HomeBlockDataBag> {
  const cacheKey = `home:data:${cityId}:${blocks.map((b) => b.id).join(',')}`;
  const cached = homeCacheGet<HomeBlockDataBag>(cacheKey);
  if (cached) return cached;

  const needs = blockTypesNeeding(blocks);
  const tasks: Promise<void>[] = [];
  const bag: HomeBlockDataBag = { ...EMPTY_BAG };

  const run = (fn: () => Promise<void>) => {
    tasks.push(fn());
  };

  if (
    needs.has('entity:businesses_featured') ||
    needs.has('business_promo_hero')
  ) {
    run(async () => {
      bag.featuredBusinesses = await listFeaturedBusinesses(cityId);
    });
  }

  if (needs.has('entity:businesses_recent')) {
    run(async () => {
      bag.recentBusinesses = await listRecentBusinesses(cityId);
    });
  }

  if (needs.has('entity:tourism_lodgings') || needs.has('lodging_map')) {
    run(async () => {
      bag.lodgings = await listLodgings(cityId);
    });
  }

  if (needs.has('entity:tourism_attractions') || needs.has('tourism_gateway')) {
    run(async () => {
      bag.attractions = await listAttractions(cityId, 12);
    });
  }

  if (needs.has('promo_strip') || needs.has('entity:city_promotions')) {
    run(async () => {
      bag.promotions = await listPromotions(cityId);
    });
  }

  if (needs.has('weather')) {
    run(async () => {
      bag.weather = await loadWeather(cityId);
    });
  }

  if (needs.has('transparency_pulse') && modules.includes('transparency')) {
    run(async () => {
      bag.transparency = await loadTransparencyPulse(cityId);
    });
  }

  if (needs.has('service_list') || needs.has('tile_strip')) {
    run(async () => {
      const [pharmacy, alert] = await Promise.all([
        loadDutyPharmacy(cityId),
        loadTopAlert(cityId),
      ]);
      bag.dutyPharmacyName = pharmacy;
      bag.alertTitle = alert?.title ?? null;
      bag.alertArea = alert?.area ?? null;
    });
  }

  await Promise.all(tasks);
  homeCacheSet(cacheKey, bag, HOME_CACHE_TTL_MS);
  return bag;
}

async function listFeaturedBusinesses(cityId: string): Promise<HomeBusiness[]> {
  const { data } = await supabase
    .from('businesses')
    .select(
      'id, slug, name, cover_url, logo_url, photos, import_source, featured, lat, lng, districts(name), business_category_assignments(is_primary, business_categories(slug, name)), business_reviews(rating, status)',
    )
    .eq('city_id', cityId)
    .eq('status', 'published')
    .eq('featured', true)
    .order('featured', { ascending: false })
    .limit(24);

  return sortBusinesses((data as unknown as BusinessRow[]) ?? []).slice(0, 12);
}

async function listRecentBusinesses(cityId: string): Promise<HomeBusiness[]> {
  const { data } = await supabase
    .from('businesses')
    .select(
      'id, slug, name, cover_url, logo_url, photos, import_source, featured, lat, lng, created_at, districts(name), business_category_assignments(is_primary, business_categories(slug, name)), business_reviews(rating, status)',
    )
    .eq('city_id', cityId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(12);

  return ((data as unknown as BusinessRow[]) ?? []).map(toHomeBusiness);
}

async function listLodgings(cityId: string): Promise<HomeBusiness[]> {
  const { data } = await supabase
    .from('businesses')
    .select(
      'id, slug, name, cover_url, logo_url, photos, import_source, featured, lat, lng, districts(name), business_category_assignments(is_primary, business_categories(slug, name)), business_reviews(rating, status)',
    )
    .eq('city_id', cityId)
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .limit(200);

  const rows = ((data as unknown as BusinessRow[]) ?? []).filter((row) =>
    hasPousadaCategory(categorySlugsFromAssignments(row.business_category_assignments)),
  );
  return sortBusinesses(rows).slice(0, 12);
}

async function listAttractions(cityId: string, limit: number): Promise<HomeAttraction[]> {
  const { data } = await supabase
    .from('attractions')
    .select(
      'id, slug, name, type, cover_url, photos, google_photos, description, google_summary, rating, reviews_count, featured',
    )
    .eq('city_id', cityId)
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  return ((data as unknown as AttractionRow[]) ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    coverUrl: resolveAttractionCover(row),
    shortDescription: row.description ?? row.google_summary,
    kind: row.type,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    featured: row.featured ?? false,
  }));
}

async function listPromotions(cityId: string): Promise<HomePromotion[]> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('business_promotions')
    .select(
      'id, title, discount_percent, valid_from, valid_until, businesses!inner(name, slug, city_id, status)',
    )
    .eq('active', true)
    .eq('businesses.city_id', cityId)
    .eq('businesses.status', 'published')
    .lte('valid_from', now)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .order('valid_from', { ascending: false })
    .limit(8);

  return ((data ?? []) as unknown as Array<{
    id: string;
    title: string;
    discount_percent: number | null;
    businesses: { name: string; slug: string } | { name: string; slug: string }[] | null;
  }>)
    .map((row) => {
      const business = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses;
      if (!business) return null;
      return {
        id: row.id,
        title: row.title,
        businessName: business.name,
        businessSlug: business.slug,
        discountPercent: row.discount_percent,
      };
    })
    .filter((p): p is HomePromotion => Boolean(p));
}

function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());
}

function parseWeatherDaily(raw: unknown): HomeWeatherDay[] {
  if (!Array.isArray(raw)) return [];
  const today = todayInSaoPaulo();
  return raw
    .map((entry): HomeWeatherDay | null => {
      if (!entry || typeof entry !== 'object') return null;
      const row = entry as Record<string, unknown>;
      const date = typeof row.date === 'string' ? row.date : null;
      if (!date || date < today) return null;
      return {
        date,
        weatherCode: typeof row.weatherCode === 'number' ? row.weatherCode : null,
        tempMax: typeof row.temperatureMax === 'number' ? row.temperatureMax : null,
        tempMin: typeof row.temperatureMin === 'number' ? row.temperatureMin : null,
        precipitationProbabilityMax:
          typeof row.precipitationProbabilityMax === 'number'
            ? row.precipitationProbabilityMax
            : null,
      };
    })
    .filter((d): d is HomeWeatherDay => Boolean(d))
    .slice(0, 4);
}

async function loadWeather(cityId: string): Promise<HomeWeather | null> {
  const { data } = await supabase
    .from('weather_snapshots')
    .select('current_temperature, weather_code, daily, expires_at')
    .eq('city_id', cityId)
    .eq('provider', 'open-meteo')
    .maybeSingle<{
      current_temperature: number | null;
      weather_code: number | null;
      daily: unknown;
      expires_at: string;
    }>();

  if (!data) return null;

  const daily = parseWeatherDaily(data.daily);
  const today = daily[0];
  const code = data.weather_code ?? today?.weatherCode ?? 0;

  return {
    temperature: data.current_temperature,
    weatherCode: code,
    description: WEATHER_CODES[code] ?? 'Tempo local',
    high: today?.tempMax ?? null,
    low: today?.tempMin ?? null,
    daily,
  };
}

async function loadTransparencyPulse(cityId: string): Promise<TransparencyPulseData | null> {
  const [newsRes, propRes] = await Promise.all([
    supabase
      .from('civic_news')
      .select('id, title, published_at')
      .eq('city_id', cityId)
      .order('published_at', { ascending: false })
      .limit(3),
    supabase
      .from('council_propositions')
      .select('id, title, presented_at')
      .eq('city_id', cityId)
      .order('presented_at', { ascending: false })
      .limit(3),
  ]);

  const news = newsRes.data ?? [];
  const props = propRes.data ?? [];
  if (news.length === 0 && props.length === 0) return null;

  const highlight =
    (news[0] as { title: string } | undefined) ?? (props[0] as { title: string } | undefined);
  if (!highlight) return null;

  return {
    highlightTitle: highlight.title,
    highlightMeta: news.length > 0 ? 'Notícia oficial' : 'Proposição',
    newsCount: news.length,
    officialCount: props.length,
  };
}

async function loadDutyPharmacy(cityId: string): Promise<string | null> {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());

  const { data, error } = await supabase.rpc('current_pharmacy_on_duty', {
    p_city_id: cityId,
    p_date: date,
  });

  if (error || !Array.isArray(data) || data.length === 0) return null;
  const first = data[0] as { name?: string };
  return typeof first.name === 'string' ? first.name : null;
}

async function loadTopAlert(cityId: string): Promise<{ title: string; area: string | null } | null> {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const hourBucket = now.toISOString();

  const { data } = await supabase
    .from('service_alerts')
    .select('title, affected_area')
    .eq('city_id', cityId)
    .eq('active', true)
    .or(`end_at.is.null,end_at.gt.${hourBucket}`)
    .order('start_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ title: string; affected_area: string | null }>();

  if (!data) return null;
  return { title: data.title, area: data.affected_area };
}

function toHomeBusiness(row: BusinessRow): HomeBusiness {
  const assignments = [...(row.business_category_assignments ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary),
  );
  const rating = getBusinessRating(row);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: assignments[0]?.business_categories?.name ?? null,
    district: row.districts?.name ?? null,
    rating: rating.rating,
    reviewsCount: rating.reviewsCount,
    coverUrl: firstImage([row.cover_url, ...asStringArray(row.photos), row.logo_url]),
    featured: row.featured ?? false,
    lat: row.lat,
    lng: row.lng,
  };
}

function sortBusinesses(rows: BusinessRow[]): HomeBusiness[] {
  return rows
    .map(toHomeBusiness)
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        (b.rating ?? 0) * Math.log1p(b.reviewsCount ?? 0) -
          (a.rating ?? 0) * Math.log1p(a.reviewsCount ?? 0),
    );
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function firstImage(values: (string | null | undefined)[]): string | null {
  return values.find((v): v is string => typeof v === 'string' && v.length > 0) ?? null;
}

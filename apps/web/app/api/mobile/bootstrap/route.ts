import { NextResponse, type NextRequest } from 'next/server';

import {
  listActiveFeaturedBusinesses,
  listByCategory,
  listCityPromotions,
} from '@/lib/businesses';
import { listChurchSchedule, listChurches, type WeekdayKey } from '@/lib/churches';
import { publicCached } from '@/lib/cache/public-query';
import type { CurrentCity } from '@/lib/cities';
import { listAttractions } from '@/lib/tourism';
import { getPharmacyOnDuty, listActiveAlerts } from '@/lib/utilities/queries';
import { getWeatherForHome } from '@/lib/weather';

function todayKey(): WeekdayKey {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
  }).format(new Date());
  const map: Record<string, WeekdayKey> = {
    Sunday: 'domingo',
    Monday: 'segunda',
    Tuesday: 'terca',
    Wednesday: 'quarta',
    Thursday: 'quinta',
    Friday: 'sexta',
    Saturday: 'sabado',
  };
  return map[weekday] ?? 'domingo';
}

export const runtime = 'nodejs';
export const revalidate = 60;

type CityRow = {
  id: string;
  slug: string;
  name: string;
  state: string;
  status: CurrentCity['status'] | null;
  timezone: string | null;
  lat: number | null;
  lng: number | null;
  population: number | null;
  ibge_code: string | null;
  hero_url: string | null;
  about: string | null;
  city_modules: { module_key: string; enabled: boolean | null }[] | null;
};

type VideoAdRow = {
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
};

// Tabelas recentes ainda podem não estar no tipo gerado do Supabase.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MobileBootstrapClient = { from: (table: string) => any };

function jsonWithMobileCache(payload: unknown) {
  const response = NextResponse.json(payload);
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return response;
}

function getBootstrapCity(citySlug: string): Promise<CityRow | null> {
  return publicCached(
    {
      key: 'mobile:bootstrap:city',
      tags: ['city', `city:${citySlug}`],
      revalidate: 3600,
      parts: [citySlug],
    },
    async (supabase) => {
      const client = supabase as unknown as MobileBootstrapClient;
      const { data } = await client
        .from('cities')
        .select(
          'id, slug, name, state, status, timezone, lat, lng, population, ibge_code, hero_url, about, city_modules(module_key, enabled)',
        )
        .eq('slug', citySlug)
        .maybeSingle();

      return (data as CityRow | null) ?? null;
    },
  );
}

function listMobileVideoAds(cityId: string): Promise<VideoAdRow[]> {
  return publicCached(
    {
      key: 'mobile:bootstrap:video-ads',
      tags: ['home', `home:${cityId}`, 'mobile-video-ads'],
      revalidate: 300,
      parts: [cityId],
    },
    async (supabase) => {
      const client = supabase as unknown as MobileBootstrapClient;
      const { data, error } = await client
        .from('home_video_ads')
        .select(
          'id, title, subtitle, cta_label, click_url, video_url, poster_url, aspect_ratio, mute_default, business_id',
        )
        .eq('city_id', cityId)
        .eq('status', 'active')
        .order('priority', { ascending: false })
        .limit(6);

      if (error) return [];
      return (data ?? []) as VideoAdRow[];
    },
  );
}

export async function GET(request: NextRequest) {
  const citySlug = request.nextUrl.searchParams.get('city') ?? 'carmo-do-rio-claro';

  const city = await getBootstrapCity(citySlug);

  if (!city) {
    return jsonWithMobileCache({
      city: null,
      featuredBusinesses: [],
      lodgings: [],
      promotions: [],
      attractions: [],
      alerts: [],
      dutyPharmacyName: null,
    });
  }

  const modules = (city.city_modules ?? [])
    .filter((m) => m.enabled)
    .map((m) => m.module_key);
  const currentCity: CurrentCity = {
    id: city.id,
    slug: city.slug,
    name: city.name,
    state: city.state,
    status: city.status ?? 'active',
    timezone: city.timezone ?? 'America/Sao_Paulo',
    lat: city.lat,
    lng: city.lng,
    population: city.population,
    ibgeCode: city.ibge_code,
    heroUrl: city.hero_url,
    about: city.about,
    modules,
  };

  const [
    featured,
    lodgings,
    promotions,
    alerts,
    duty,
    attractions,
    churches,
    churchSchedule,
    weather,
    videoAdsResult,
  ] = await Promise.all([
    listActiveFeaturedBusinesses({ city_id: city.id, limit: 8 }).catch(() => []),
    listByCategory('pousadas', { city_id: city.id, sort: 'rating', limit: 6 }).catch(() => []),
    listCityPromotions({ city_id: city.id, limit: 8 }).catch(() => []),
    listActiveAlerts({ city_id: city.id }).catch(() => []),
    getPharmacyOnDuty({ city_id: city.id }).catch(() => []),
    listAttractions({ city_id: city.id, limit: 6 }).catch(() => []),
    listChurches().catch(() => []),
    listChurchSchedule().catch(() => []),
    getWeatherForHome(currentCity).catch(() => null),
    listMobileVideoAds(city.id).catch(() => []),
  ]);

  const videoAds = videoAdsResult.map((ad) => ({
    id: ad.id,
    title: ad.title,
    subtitle: ad.subtitle,
    ctaLabel: ad.cta_label,
    clickUrl: ad.click_url,
    videoUrl: ad.video_url,
    posterUrl: ad.poster_url,
    aspectRatio: Number(ad.aspect_ratio),
    muteDefault: ad.mute_default,
    businessId: ad.business_id,
  }));

  return jsonWithMobileCache({
    city: {
      id: city.id,
      slug: city.slug,
      name: city.name,
      modules,
    },
    featuredBusinesses: featured.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      category: b.categories[0] ?? null,
      district: b.district ?? null,
      rating: b.rating ?? null,
      coverUrl: b.coverUrl ?? null,
    })),
    lodgings: lodgings.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      category: 'Pousada',
      district: b.district ?? null,
      rating: b.rating ?? null,
      coverUrl: b.coverUrl ?? null,
    })),
    promotions: promotions.map((p) => ({
      id: p.id,
      title: p.title,
      businessName: p.businessName,
      businessSlug: p.businessSlug,
      discountPercent: p.discountPercent ?? null,
    })),
    attractions: attractions.slice(0, 6).map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      coverUrl: a.coverUrl ?? null,
      shortDescription: a.description ?? null,
    })),
    churchSchedule: churchSchedule
      .filter((item) => item.weekday === todayKey())
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        title: item.title,
        time: item.time,
        churchSlug: item.churchSlug,
        churchName: churches.find((c) => c.slug === item.churchSlug)?.name ?? null,
      })),
    weather: weather
      ? {
          temperature: weather.currentTemperature ?? null,
          description: null,
          icon: weather.weatherCode === null ? null : String(weather.weatherCode),
          high: weather.daily[0]?.temperatureMax ?? null,
          low: weather.daily[0]?.temperatureMin ?? null,
        }
      : null,
    videoAds,
    alerts: alerts.slice(0, 1).map((a) => ({
      id: a.id,
      title: a.title,
      affectedArea: a.affectedArea ?? null,
    })),
    dutyPharmacyName: duty[0]?.name ?? null,
  });
}

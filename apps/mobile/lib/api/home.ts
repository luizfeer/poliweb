/**
 * @deprecated Prefer `fetchHomeScreen` de `@/lib/home`.
 * Mantido para imports legados durante a migração.
 */
export {
  fetchHomeScreen as fetchHome,
  invalidateHomeScreenCache,
  type HomeCity,
  type HomeScreenPayload,
} from '@/lib/home/fetch-home-screen';

export type {
  HomeBusiness,
  HomePromotion,
  HomeAttraction,
  HomeWeather,
  HomeWeatherDay,
  HomeBlockDataBag,
} from '@/lib/home/block-data';

/** Compat: alertas e extras mobile-only ainda não no builder. */
export type HomeAlert = {
  id: string;
  title: string;
  affectedArea: string | null;
};

export type HomeChurchEvent = {
  id: string;
  title: string;
  time: string;
  churchSlug: string;
  churchName: string | null;
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

/** Payload legado + layout do builder. */
export type HomePayload = {
  city: import('@/lib/home/fetch-home-screen').HomeCity | null;
  layout: import('@/lib/home/types').HomeLayout | null;
  data: import('@/lib/home/block-data').HomeBlockDataBag;
  alerts: HomeAlert[];
  churchSchedule: HomeChurchEvent[];
  videoAds: HomeVideoAd[];
};

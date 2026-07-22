import 'server-only';

import { cache } from 'react';
import { publicCached } from '@/lib/cache/public-query';

import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { getResolvedCitySlug } from './city-slug';

export { DEFAULT_CITY_SLUG } from './city-slug';

export type CityStatus = 'active' | 'coming_soon' | 'paused';

export type CurrentCity = {
  id: string;
  slug: string;
  name: string;
  state: string;
  status: CityStatus;
  timezone: string;
  lat: number | null;
  lng: number | null;
  population: number | null;
  ibgeCode: string | null;
  heroUrl: string | null;
  about: string | null;
  modules: string[];
};

type CityRow = {
  id: string;
  slug: string;
  name: string;
  state: string;
  status: CityStatus | null;
  timezone: string | null;
  lat: number | null;
  lng: number | null;
  population: number | null;
  ibge_code: string | null;
  hero_url: string | null;
  about: string | null;
};

type CityModuleRow = {
  module_key: string | null;
  enabled: boolean | null;
};

function toCurrentCity(city: CityRow, modules: CityModuleRow[]): CurrentCity {
  return {
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
    modules: modules
      .filter((module): module is { module_key: string; enabled: true } => {
        return module.enabled === true && typeof module.module_key === 'string';
      })
      .map((module) => module.module_key),
  };
}

function loadCurrentCityForSlug(slug: string) {
  return publicCached(
    {
      key: 'current-city',
      tags: ['city', `city:${slug}`],
      revalidate: 3600,
      parts: [slug],
    },
    async (supabase) => {
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select(
          'id, slug, name, state, status, timezone, lat, lng, population, ibge_code, hero_url, about',
        )
        .eq('slug', slug)
        .maybeSingle();

      if (cityError || !cityData) return null;
      const city = cityData as CityRow;

      const { data: modulesData, error: modulesError } = await supabase
        .from('city_modules')
        .select('module_key, enabled')
        .eq('city_id', city.id);

      if (modulesError) return toCurrentCity(city, []);
      return toCurrentCity(city, (modulesData ?? []) as CityModuleRow[]);
    },
  );
}

export const getCurrentCity = cache(async (): Promise<CurrentCity | null> => {
  if (!hasSupabasePublicEnv()) return null;
  return loadCurrentCityForSlug(getResolvedCitySlug());
});

/** Cidade por slug — usado por rotas `/api/mobile/*` sem contexto de host. */
export async function getCityBySlug(slug: string): Promise<CurrentCity | null> {
  if (!hasSupabasePublicEnv()) return null;
  return loadCurrentCityForSlug(slug);
}

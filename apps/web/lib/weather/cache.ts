import 'server-only';

import type { CurrentCity } from '@/lib/cities';
import type { WeatherDay, WeatherSnapshot } from './types';
import { fetchOpenMeteoForecast } from './open-meteo';

type WeatherSnapshotRow = {
  city_id: string;
  provider: string;
  fetched_at: string;
  expires_at: string;
  timezone: string;
  current_temperature: number | null;
  apparent_temperature: number | null;
  weather_code: number | null;
  wind_speed: number | null;
  precipitation_probability: number | null;
  daily: unknown;
};

type CityWeatherRow = {
  id: string;
  slug: string;
  name: string;
  timezone: string | null;
  lat: number | null;
  lng: number | null;
};

export async function getCachedWeather(cityId: string): Promise<WeatherSnapshot | null> {
  const rows = await selectRows<WeatherSnapshotRow>(
    `weather_snapshots?city_id=eq.${cityId}&provider=eq.open-meteo&select=city_id,provider,fetched_at,expires_at,timezone,current_temperature,apparent_temperature,weather_code,wind_speed,precipitation_probability,daily&limit=1`,
    false,
  );

  const row = rows[0];
  return row ? toWeatherSnapshot(row) : null;
}

function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function trimPastDays(snap: WeatherSnapshot): WeatherSnapshot {
  const today = todayInSaoPaulo();
  const daily = snap.daily.filter((d) => d.date >= today);
  return daily.length === snap.daily.length ? snap : { ...snap, daily };
}

/**
 * Sempre serve do cache (worker `weather:update` atualiza 1x/dia às 00h).
 * O widget se ajusta sozinho à data atual filtrando dias passados, então mesmo
 * que o cache fique alguns dias parado ele "rola" pra frente até acabar o forecast.
 * Como fallback, só busca Open-Meteo ao vivo se NÃO houver cache nenhum no banco.
 */
export async function getWeatherForHome(city: CurrentCity): Promise<WeatherSnapshot | null> {
  const cached = await getCachedWeather(city.id);
  if (cached) {
    return trimPastDays(cached);
  }
  try {
    const refreshed = await refreshWeatherForCity({
      id: city.id,
      lat: city.lat,
      lng: city.lng,
      timezone: city.timezone,
    });
    return trimPastDays(refreshed);
  } catch {
    return null;
  }
}

export async function refreshWeatherForCity(city: Pick<CurrentCity, 'id' | 'lat' | 'lng' | 'timezone'>): Promise<WeatherSnapshot> {
  const latitude = city.lat ?? -20.9719;
  const longitude = city.lng ?? -46.1189;
  const snapshot = await fetchOpenMeteoForecast({
    cityId: city.id,
    latitude,
    longitude,
    timezone: city.timezone,
  });

  await upsertWeatherSnapshot(snapshot);
  return snapshot;
}

export async function refreshWeatherForAllCities(): Promise<{ processed: number; updated: number; errors: string[] }> {
  const cities = await selectRows<CityWeatherRow>(
    'cities?status=eq.active&select=id,slug,name,timezone,lat,lng',
    true,
  );
  const errors: string[] = [];
  let updated = 0;

  for (const city of cities) {
    try {
      await refreshWeatherForCity({
        id: city.id,
        lat: city.lat,
        lng: city.lng,
        timezone: city.timezone ?? 'America/Sao_Paulo',
      });
      updated += 1;
    } catch (error) {
      errors.push(`${city.slug}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { processed: cities.length, updated, errors };
}

async function upsertWeatherSnapshot(snapshot: WeatherSnapshot & { latitude: number; longitude: number; raw: unknown }): Promise<void> {
  const url = `${supabaseRestUrl()}/weather_snapshots?on_conflict=city_id,provider`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...serviceHeaders(),
      prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify([
      {
        city_id: snapshot.cityId,
        provider: snapshot.provider,
        fetched_at: snapshot.fetchedAt,
        expires_at: snapshot.expiresAt,
        timezone: snapshot.timezone,
        latitude: snapshot.latitude,
        longitude: snapshot.longitude,
        current_temperature: snapshot.currentTemperature,
        apparent_temperature: snapshot.apparentTemperature,
        weather_code: snapshot.weatherCode,
        wind_speed: snapshot.windSpeed,
        precipitation_probability: snapshot.precipitationProbability,
        daily: snapshot.daily,
        raw: snapshot.raw,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(`weather cache upsert failed: HTTP ${response.status} ${await response.text()}`);
  }
}

async function selectRows<T>(pathAndQuery: string, serviceRole: boolean): Promise<T[]> {
  const response = await fetch(`${supabaseRestUrl()}/${pathAndQuery}`, {
    headers: serviceRole ? serviceHeaders() : anonHeaders(),
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as T[];
}

function toWeatherSnapshot(row: WeatherSnapshotRow): WeatherSnapshot {
  return {
    cityId: row.city_id,
    provider: 'open-meteo',
    fetchedAt: row.fetched_at,
    expiresAt: row.expires_at,
    timezone: row.timezone,
    currentTemperature: row.current_temperature,
    apparentTemperature: row.apparent_temperature,
    weatherCode: row.weather_code,
    windSpeed: row.wind_speed,
    precipitationProbability: row.precipitation_probability,
    daily: Array.isArray(row.daily) ? (row.daily as WeatherDay[]) : [],
  };
}

function supabaseRestUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  return `${supabaseUrl.replace(/\/$/, '')}/rest/v1`;
}

function anonHeaders(): Record<string, string> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
  return {
    apikey: anonKey,
    authorization: `Bearer ${anonKey}`,
  };
}

function serviceHeaders(): Record<string, string> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    'content-type': 'application/json',
  };
}

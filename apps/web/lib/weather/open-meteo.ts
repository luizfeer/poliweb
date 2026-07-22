import 'server-only';

import type { WeatherDay, WeatherSnapshot } from './types';

const FORECAST_DAYS = 7;
const WEATHER_TTL_HOURS = 30;

type OpenMeteoResponse = {
  timezone?: string;
  latitude?: number;
  longitude?: number;
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    precipitation?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: Array<number | null>;
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
    precipitation_probability_max?: Array<number | null>;
  };
};

export async function fetchOpenMeteoForecast(input: {
  cityId: string;
  latitude: number;
  longitude: number;
  timezone: string;
}): Promise<WeatherSnapshot & { latitude: number; longitude: number; raw: OpenMeteoResponse }> {
  const params = new URLSearchParams({
    latitude: input.latitude.toString(),
    longitude: input.longitude.toString(),
    timezone: input.timezone,
    forecast_days: String(FORECAST_DAYS),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
      'precipitation',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
    ].join(','),
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo failed with HTTP ${response.status}`);
  }

  const raw = (await response.json()) as OpenMeteoResponse;
  const fetchedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * WEATHER_TTL_HOURS).toISOString();

  return {
    cityId: input.cityId,
    provider: 'open-meteo',
    fetchedAt,
    expiresAt,
    timezone: raw.timezone ?? input.timezone,
    latitude: raw.latitude ?? input.latitude,
    longitude: raw.longitude ?? input.longitude,
    currentTemperature: raw.current?.temperature_2m ?? null,
    apparentTemperature: raw.current?.apparent_temperature ?? null,
    weatherCode: raw.current?.weather_code ?? null,
    windSpeed: raw.current?.wind_speed_10m ?? null,
    precipitationProbability: raw.daily?.precipitation_probability_max?.[0] ?? null,
    daily: normalizeDaily(raw.daily),
    raw,
  };
}

function normalizeDaily(daily: OpenMeteoResponse['daily']): WeatherDay[] {
  const dates = daily?.time ?? [];
  return dates.slice(0, FORECAST_DAYS).map((date, index) => ({
    date,
    weatherCode: daily?.weather_code?.[index] ?? null,
    temperatureMax: daily?.temperature_2m_max?.[index] ?? null,
    temperatureMin: daily?.temperature_2m_min?.[index] ?? null,
    precipitationProbabilityMax: daily?.precipitation_probability_max?.[index] ?? null,
  }));
}

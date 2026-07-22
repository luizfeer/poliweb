import 'server-only';

import type { CurrentCity } from '@/lib/cities';
import type { WeatherClimateMonth, WeatherClimateSummary } from './types';

type OpenMeteoArchiveResponse = {
  daily?: {
    time?: string[];
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
    precipitation_sum?: Array<number | null>;
  };
};

type ClimateAccumulator = {
  maxValues: number[];
  minValues: number[];
  rainValues: number[];
  rainyDaysByYear: Map<number, number>;
};

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  timeZone: 'America/Sao_Paulo',
});

export async function getWeatherClimateSummary(
  city: CurrentCity,
  now = new Date(),
): Promise<WeatherClimateSummary | null> {
  const latitude = city.lat ?? -20.9719;
  const longitude = city.lng ?? -46.1189;
  const targetMonth = getMonthNumber(now);
  const endYear = now.getFullYear() - 1;
  const startYear = endYear - 11;

  try {
    const raw = await fetchOpenMeteoArchive({
      latitude,
      longitude,
      timezone: city.timezone,
      startDate: `${startYear}-01-01`,
      endDate: `${endYear}-12-31`,
    });
    const monthly = normalizeClimateMonths(raw, startYear, endYear);
    const currentMonth = monthly.find((item) => item.month === targetMonth) ?? null;

    return {
      provider: 'open-meteo-archive',
      startYear,
      endYear,
      month: targetMonth,
      monthLabel: formatMonth(targetMonth),
      averageMax: currentMonth?.averageMax ?? null,
      averageMin: currentMonth?.averageMin ?? null,
      rainyDays: currentMonth?.rainyDays ?? null,
      averageRainMm: currentMonth?.averageRainMm ?? null,
      monthly,
    };
  } catch {
    return null;
  }
}

async function fetchOpenMeteoArchive(input: {
  latitude: number;
  longitude: number;
  timezone: string;
  startDate: string;
  endDate: string;
}): Promise<OpenMeteoArchiveResponse> {
  const params = new URLSearchParams({
    latitude: input.latitude.toString(),
    longitude: input.longitude.toString(),
    timezone: input.timezone,
    start_date: input.startDate,
    end_date: input.endDate,
    daily: ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'].join(','),
  });

  const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params.toString()}`, {
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo archive failed with HTTP ${response.status}`);
  }

  return (await response.json()) as OpenMeteoArchiveResponse;
}

function normalizeClimateMonths(
  raw: OpenMeteoArchiveResponse,
  startYear: number,
  endYear: number,
): WeatherClimateMonth[] {
  const accumulators = new Map<number, ClimateAccumulator>();
  for (let month = 1; month <= 12; month += 1) {
    accumulators.set(month, {
      maxValues: [],
      minValues: [],
      rainValues: [],
      rainyDaysByYear: new Map<number, number>(),
    });
  }

  const dates = raw.daily?.time ?? [];
  dates.forEach((date, index) => {
    const [yearText, monthText] = date.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;

    const accumulator = accumulators.get(month);
    if (!accumulator) return;

    const max = raw.daily?.temperature_2m_max?.[index] ?? null;
    const min = raw.daily?.temperature_2m_min?.[index] ?? null;
    const rain = raw.daily?.precipitation_sum?.[index] ?? null;

    if (typeof max === 'number') accumulator.maxValues.push(max);
    if (typeof min === 'number') accumulator.minValues.push(min);
    if (typeof rain === 'number') {
      accumulator.rainValues.push(rain);
      if (rain >= 1) {
        accumulator.rainyDaysByYear.set(year, (accumulator.rainyDaysByYear.get(year) ?? 0) + 1);
      }
    }
  });

  const yearCount = Math.max(endYear - startYear + 1, 1);

  return Array.from(accumulators.entries()).map(([month, accumulator]) => ({
    month,
    monthLabel: formatMonth(month),
    averageMax: average(accumulator.maxValues),
    averageMin: average(accumulator.minValues),
    rainyDays: average(Array.from(accumulator.rainyDaysByYear.values()), yearCount),
    averageRainMm: average(accumulator.rainValues) === null ? null : sum(accumulator.rainValues) / yearCount,
  }));
}

function average(values: number[], divisor = values.length): number | null {
  if (values.length === 0 || divisor <= 0) return null;
  return roundOne(sum(values) / divisor);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function getMonthNumber(date: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(date),
  );
}

function formatMonth(month: number): string {
  return monthFormatter.format(new Date(Date.UTC(2024, month - 1, 15)));
}

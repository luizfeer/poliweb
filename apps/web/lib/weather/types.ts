export type WeatherDay = {
  date: string;
  weatherCode: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  precipitationProbabilityMax: number | null;
};

export type WeatherClimateMonth = {
  month: number;
  monthLabel: string;
  averageMax: number | null;
  averageMin: number | null;
  rainyDays: number | null;
  averageRainMm: number | null;
};

export type WeatherClimateSummary = {
  provider: 'open-meteo-archive';
  startYear: number;
  endYear: number;
  month: number;
  monthLabel: string;
  averageMax: number | null;
  averageMin: number | null;
  rainyDays: number | null;
  averageRainMm: number | null;
  monthly: WeatherClimateMonth[];
};

export type WeatherSnapshot = {
  cityId: string;
  provider: 'open-meteo';
  fetchedAt: string;
  expiresAt: string;
  timezone: string;
  currentTemperature: number | null;
  apparentTemperature: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  precipitationProbability: number | null;
  daily: WeatherDay[];
};

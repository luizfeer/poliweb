import { WeatherWidget } from '@/components/public/weather/weather-widget';
import { getWeatherForHome } from '@/lib/weather';
import type { CurrentCity } from '@/lib/cities';

type Props = { city: CurrentCity };

export async function WeatherBlock({ city }: Props) {
  const weather = await getWeatherForHome(city);
  if (!weather) return null;
  return <WeatherWidget cityName={city.name} weather={weather} />;
}

import { listByCategory } from '@/lib/businesses';
import type { LodgingMapConfig } from '@/lib/home';
import { LodgingMapWidget } from '../lodging-map-widget';

type Props = {
  config: LodgingMapConfig;
  cityId: string;
  cityName: string;
  modules: string[];
};

export async function LodgingMapBlock({ config, cityId, cityName, modules }: Props) {
  if (!modules.includes('tourism')) return null;

  const lodgings = await listByCategory(config.categorySlug ?? 'pousadas', {
    city_id: cityId,
    sort: 'rating',
    limit: config.limit ?? 6,
  });

  return <LodgingMapWidget cityName={cityName} lodgings={lodgings} />;
}

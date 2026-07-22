import { TourismGatewayWidget } from '@/components/public/tourism/tourism-gateway-widget';
import type { TourismGatewayConfig } from '@/lib/home';
import { listAttractions, listGuides, listTourPackages } from '@/lib/tourism';

type Props = {
  config: TourismGatewayConfig;
  cityId: string;
  cityName: string;
  modules: string[];
};

export async function TourismGatewayBlock({ config, cityId, cityName, modules }: Props) {
  if (!modules.includes('tourism')) return null;

  const [attractions, packages, guides] = await Promise.all([
    listAttractions({ city_id: cityId, limit: config.attractionsLimit ?? 3 }),
    listTourPackages({ city_id: cityId, limit: config.packagesLimit ?? 2 }),
    listGuides({ city_id: cityId, limit: config.guidesLimit ?? 3 }),
  ]);

  return (
    <TourismGatewayWidget
      cityName={cityName}
      attractions={attractions}
      packages={packages}
      guides={guides}
    />
  );
}

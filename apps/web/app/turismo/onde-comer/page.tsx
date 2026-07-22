import { RestaurantCard } from '@/components/public/tourism/restaurant-card';
import { TourismAdminEditBar } from '@/components/public/tourism/tourism-admin-edit-link';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { getCurrentCity } from '@/lib/cities';
import { listRestaurants } from '@/lib/tourism';

type PageProps = {
  searchParams?: Promise<{ cozinha?: string; preco?: string; delivery?: string }>;
};

export const metadata = { title: 'Onde comer - Portal Carmelitano' };

export default async function OndeComerPage({ searchParams }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  const params = await searchParams;
  const items = await listRestaurants({
    city_id: city.id,
    cuisine: params?.cozinha,
    price_range: params?.preco,
    delivery: params?.delivery === '1' ? true : undefined,
  });

  return (
    <AppFrame>
      <AppHeader chips={['Mineira', 'Peixe', 'Delivery']} />
      <TourismAdminEditBar href="/painel/turismo" />
      <Band variant="paper-card" className="px-3.5 py-4">
        <h1 className="font-display m-0 text-[28px] font-extrabold">Onde comer</h1>
      </Band>
      <Divider />
      <Band className="space-y-3 px-3.5 py-3">
        {items.map((item) => (
          <RestaurantCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <p className="text-ink-700 m-0 rounded-md bg-white p-3 text-[13px]">
            Restaurantes turísticos em atualização.
          </p>
        )}
      </Band>
      <TabBar active="home" />
    </AppFrame>
  );
}

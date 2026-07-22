import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { Search } from 'lucide-react';
import { PropertyCard, PropertyFilters } from '@/components/carmo/real-estate';
import { PublicHero, PublicHeroPill } from '@/components/public/page-hero';
import { getCurrentCity } from '@/lib/cities';
import { listProperties, parseSearchParams, type RealEstateSearchParams } from '@/lib/real-estate';

type PageProps = {
  searchParams?: Promise<RealEstateSearchParams>;
};

export const metadata = { title: 'Buscar imóveis - Portal Carmelitano' };

export default async function PropertySearchPage({ searchParams }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  const params = (await searchParams) ?? {};
  const filters = parseSearchParams(params);
  const items = await listProperties({ cityId: city.id, ...filters, limit: 48 });

  return (
    <AppFrame>
      <AppHeader chips={['Venda', 'Aluguel', 'Temporada']} />
      <PublicHero
        icon={Search}
        kicker="Busca imobiliária"
        title="Buscar imóveis"
        description="Filtre casas, terrenos, chácaras e imóveis de temporada por tipo, preço e localização."
        tone="sky"
        meta={<PublicHeroPill tone="sky">{items.length} imóveis</PublicHeroPill>}
      />
      <Band variant="paper-card" className="space-y-3 px-3.5 pb-4">
        <PropertyFilters defaults={params} />
      </Band>
      <Divider />
      <Band className="space-y-3 px-3.5 py-3">
        {items.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
        {items.length === 0 && (
          <p className="text-ink-700 m-0 rounded-md bg-white p-3 text-[13px]">
            Nada encontrado. Tente outros filtros.
          </p>
        )}
      </Band>
      <TabBar active="home" />
    </AppFrame>
  );
}

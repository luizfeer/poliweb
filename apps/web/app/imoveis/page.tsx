import {
  AppFrame,
  AppHeader,
  Band,
  Divider,
  HScroll,
  SectionHeader,
  TabBar,
} from '@/components/carmo';
import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { PropertyCard, PropertyFilters, RealtorCard } from '@/components/carmo/real-estate';
import { PublicHero, PublicHeroPill } from '@/components/public/page-hero';
import { getCurrentCity } from '@/lib/cities';
import { listFeaturedProperties, listProperties, listRealtors } from '@/lib/real-estate';

export const metadata = {
  title: 'Imóveis - Portal Carmelitano',
  description: 'Casas, chácaras, terrenos e imóveis para venda, aluguel e temporada em Carmo.',
};

export const revalidate = 60;

export default async function RealEstateHubPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const [featured, recent, realtors] = await Promise.all([
    listFeaturedProperties(8),
    listProperties({ cityId: city.id, limit: 8 }),
    listRealtors(6),
  ]);

  return (
    <AppFrame>
      <AppHeader chips={['Venda', 'Aluguel', 'Temporada', 'Chácaras']} />

      <PublicHero
        icon={Home}
        kicker="Moradia e temporada"
        title="Imóveis"
        description={`Casas, chácaras, terrenos e imóveis de temporada publicados em ${city.name}.`}
        tone="sky"
        action={
          <Link
            href="/imoveis/buscar"
            className="bg-ink-900 inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-extrabold text-white no-underline"
          >
            <Search size={17} aria-hidden="true" />
            Buscar imóveis
          </Link>
        }
        meta={
          <>
            <PublicHeroPill tone="sky">{recent.length} recentes</PublicHeroPill>
            <PublicHeroPill tone="paper">{realtors.length} imobiliárias</PublicHeroPill>
          </>
        }
      />

      <Band variant="paper-card" className="space-y-3 px-3.5 pb-4">
        <PropertyFilters />
      </Band>

      <Divider />

      <SectionHeader title="Destaques" action={{ label: 'Ver tudo', href: '/imoveis/buscar' }} />
      <HScroll>
        {featured.map((property) => (
          <div key={property.id} className="w-[260px] shrink-0 snap-start">
            <PropertyCard property={property} compact />
          </div>
        ))}
      </HScroll>

      <Divider />

      <SectionHeader
        title="Imóveis recentes"
        action={{ label: 'Buscar', href: '/imoveis/buscar' }}
      />
      <Band className="space-y-3 px-3.5 py-3">
        {recent.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
        {recent.length === 0 && (
          <p className="text-ink-700 m-0 rounded-md bg-white p-3 text-[13px]">
            Nada por aqui ainda. Volte em breve.
          </p>
        )}
      </Band>

      <Divider />

      <SectionHeader title="Imobiliárias" action={{ label: 'Ver todas', href: '/imobiliarias' }} />
      <Band className="space-y-3 px-3.5 py-3">
        {realtors.map((realtor) => (
          <RealtorCard key={realtor.id} realtor={realtor} />
        ))}
      </Band>
      <TabBar active="home" />
    </AppFrame>
  );
}

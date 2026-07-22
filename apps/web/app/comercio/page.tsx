import {
  countByMacroCategory,
  listBusinesses,
  listFeaturedBusinesses,
  MACRO_CATEGORIES,
} from '@/lib/businesses';
import { Plus, Store } from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, HScroll, SectionHeader } from '@/components/carmo';
import {
  BusinessCard,
  BusinessListItem,
  CategoryGrid,
  SearchBar,
} from '@/components/carmo/business';
import { BusinessPromoBanner } from '@/components/marketing/business-promo-banner';
import { PublicHero, PublicHeroPill } from '@/components/public/page-hero';

export const metadata = {
  title: 'Guia comercial — Portal Carmelitano',
  description:
    'Encontre negócios, prestadores de serviço e comércio local de Carmo do Rio Claro/MG.',
};

export const revalidate = 60;

export default async function ComercioHubPage() {
  const counts = await countByMacroCategory();

  const [featured, recent] = await Promise.all([
    listFeaturedBusinesses(8),
    listBusinesses({ sort: 'rating', limit: 12 }),
  ]);

  return (
    <AppFrame>
      <AppHeader chips={['Mais buscados', 'Saúde', 'Comida', 'Veículos', 'Casa']} />

      <BusinessPromoBanner variant="slim" />

      <PublicHero
        icon={Store}
        kicker="Comércio local"
        title="Guia comercial"
        description="Negócios, telefones, serviços e informações de Carmo do Rio Claro em um guia rápido de consultar."
        tone="clay"
        action={
          <a
            href="/painel/comerciante/cadastro"
            className="bg-ink-900 inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-extrabold text-white no-underline"
          >
            <Plus size={17} aria-hidden="true" />
            Cadastrar negócio
          </a>
        }
        meta={
          <>
            <PublicHeroPill tone="clay">{featured.length} destaques</PublicHeroPill>
            <PublicHeroPill tone="paper">{recent.length} avaliados</PublicHeroPill>
          </>
        }
      />

      <Band variant="paper-card" className="pb-3">
        <SearchBar />
      </Band>

      <Divider />

      <SectionHeader title="Categorias" kicker="O que você procura?" />
      <CategoryGrid categories={MACRO_CATEGORIES} counts={counts} />

      <Divider />

      <SectionHeader
        title="Em destaque"
        action={{ label: 'Ver tudo', href: '/comercio/buscar?sort=featured' }}
      />
      <HScroll>
        {featured.map((b) => (
          <BusinessCard key={b.id} business={b} />
        ))}
      </HScroll>

      <Divider />

      <SectionHeader
        title="Mais bem avaliados"
        action={{ label: 'Ver tudo', href: '/comercio/buscar?sort=rating' }}
      />
      <Band variant="paper-card">
        {recent.map((b) => (
          <BusinessListItem key={b.id} business={b} />
        ))}
      </Band>

      <Divider />

      <Band variant="paper-deep" className="px-4 py-5 text-center">
        <h2 className="font-display text-ink-900 m-0 text-[18px] font-extrabold">
          Tem um negócio em Carmo?
        </h2>
        <p className="text-ink-700 m-0 mt-1.5 text-[13px] leading-relaxed">
          Cadastre sua ficha grátis e seja encontrado pela cidade toda.
        </p>
        <a
          href="/painel/comerciante/cadastro"
          className="bg-clay-500 hover:bg-clay-600 mt-3 inline-block rounded-md px-5 py-2.5 font-semibold text-white transition-colors"
        >
          Cadastrar meu negócio
        </a>
      </Band>
    </AppFrame>
  );
}

import { Link } from '@/components/navigation/link';
import type { ReactNode } from 'react';
import { Landmark, Mountain, Sailboat, Waves } from 'lucide-react';
import { AttractionCoverCard } from '@/components/public/tourism/attraction-card';
import { TourismAdminEditBar } from '@/components/public/tourism/tourism-admin-edit-link';
import { AppFrame, AppHeader, Band, Divider, Pill, TabBar } from '@/components/carmo';
import { getCurrentCity } from '@/lib/cities';
import { listAttractions, type AttractionKind } from '@/lib/tourism';

type PageProps = { searchParams?: Promise<{ tipo?: AttractionKind }> };

const FILTERS: Array<{ label: string; href: string; type?: AttractionKind }> = [
  { label: 'Todas', href: '/turismo/o-que-fazer' },
  { label: 'Serra e trilhas', href: '/turismo/o-que-fazer?tipo=trilha', type: 'trilha' },
  { label: 'Lago de Furnas', href: '/turismo/o-que-fazer?tipo=lago', type: 'lago' },
  { label: 'Cachoeiras', href: '/turismo/o-que-fazer?tipo=cachoeira', type: 'cachoeira' },
  { label: 'Cultura', href: '/turismo/o-que-fazer?tipo=museu', type: 'museu' },
  { label: 'Igrejas', href: '/turismo/o-que-fazer?tipo=igreja', type: 'igreja' },
];

export const metadata = {
  title: 'O que fazer - Portal Carmelitano',
  description:
    'Atrações reais de Carmo do Rio Claro: Lago de Furnas, Serra da Tormenta, cachoeiras e cultura.',
};

export default async function OQueFazerPage({ searchParams }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  const params = await searchParams;
  const items = await listAttractions({ city_id: city.id, type: params?.tipo });

  return (
    <AppFrame>
      <AppHeader chips={['Serra', 'Furnas', 'Cachoeiras', 'Cultura']} />
      <TourismAdminEditBar href="/painel/cidade/turismo/atracoes" />

      <Band variant="paper-card" className="px-3.5 py-4">
        <p className="text-brand-700 m-0 text-[12px] font-bold uppercase tracking-wide">
          Guia de atrações
        </p>
        <h1 className="font-display m-0 mt-1 text-[28px] font-extrabold">O que fazer</h1>
        <p className="text-ink-700 m-0 mt-2 text-[14px] leading-relaxed">
          Pontos turísticos reais de Carmo do Rio Claro, organizados por natureza, água, cultura e
          fé.
        </p>
      </Band>

      <Band className="grid grid-cols-2 gap-2 px-3.5 py-3 sm:grid-cols-4">
        <InfoTile
          icon={<Mountain className="h-5 w-5" />}
          title="Serra"
          text="mirantes e aventura"
        />
        <InfoTile icon={<Sailboat className="h-5 w-5" />} title="Furnas" text="náutica e pesca" />
        <InfoTile icon={<Waves className="h-5 w-5" />} title="Cachoeiras" text="banho e trilha" />
        <InfoTile icon={<Landmark className="h-5 w-5" />} title="Cultura" text="museu e centro" />
      </Band>

      <Divider />

      <Band className="px-3.5 py-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <Link key={filter.href} href={filter.href} className="no-underline">
              <Pill
                active={params?.tipo === filter.type || (!params?.tipo && !filter.type)}
                label={filter.label}
              />
            </Link>
          ))}
        </div>
      </Band>

      <Band className="grid gap-4 px-3.5 py-3 sm:grid-cols-2 md:grid-cols-3">
        {items.length > 0 ? (
          items.map((item) => <AttractionCoverCard key={item.id} item={item} cityName={city.name} />)
        ) : (
          <p className="border-ink-200 text-ink-700 m-0 rounded-md border border-dashed bg-white p-4 text-[13px]">
            Nenhuma atração publicada para este filtro ainda.
          </p>
        )}
      </Band>
      <TabBar active="home" />
    </AppFrame>
  );
}

function InfoTile({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="border-ink-100 rounded-md border bg-white p-3">
      <div className="text-clay-600">{icon}</div>
      <strong className="text-ink-900 mt-2 block text-[13px]">{title}</strong>
      <span className="text-ink-600 text-[11px]">{text}</span>
    </div>
  );
}

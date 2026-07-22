import { notFound } from 'next/navigation';
import { getCurrentCity } from '@/lib/cities';
import { Filter, Search } from 'lucide-react';
import { AppFrame, AppHeader, Band, TabBar } from '@/components/carmo';
import { PublicHero, PublicHeroPill } from '@/components/public/page-hero';
import { listClassifiedsByType } from '@/lib/classifieds/queries';
import type { ClassifiedType } from '@/lib/classifieds/types';
import { ClassifiedCard } from '@/components/public/classifieds/cards';

const types: Array<{ value: ClassifiedType; label: string }> = [
  { value: 'vehicle', label: 'Veículos' },
  { value: 'job', label: 'Vagas' },
  { value: 'service', label: 'Serviços' },
  { value: 'item', label: 'Itens' },
  { value: 'other', label: 'Outros' },
];

export const metadata = { title: 'Buscar classificados - Portal Carmelitano' };
export const revalidate = 60;

export default async function SearchClassifiedsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: ClassifiedType }>;
}) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  const params = await searchParams;
  const items = await listClassifiedsByType({ cityId: city.id, type: params.type, q: params.q });

  return (
    <AppFrame className="bg-paper">
      <AppHeader chips={['Buscar', 'Veículos', 'Vagas', 'Serviços']} />
      <PublicHero
        icon={Search}
        kicker="Classificados"
        title="Buscar anúncios"
        description="Filtre o mural local por texto e tipo de anúncio."
        tone="clay"
        meta={<PublicHeroPill tone="clay">{items.length} resultados</PublicHeroPill>}
      />
      <Band className="px-3.5 pb-3 md:px-6 lg:px-8">
        <form className="border-ink-100 shadow-card grid gap-2 rounded-2xl border bg-white p-3 md:grid-cols-[1fr_220px_auto]">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Buscar classificados"
            className="border-ink-100 bg-paper focus:border-clay-300 min-h-11 rounded-md border px-3 text-[14px] font-semibold outline-none"
          />
          <select
            name="type"
            defaultValue={params.type ?? ''}
            className="border-ink-100 bg-paper focus:border-clay-300 min-h-11 rounded-md border px-3 text-[14px] font-semibold outline-none"
          >
            <option value="">Todos</option>
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <button
            className="bg-clay-500 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-[13px] font-extrabold text-white"
            type="submit"
          >
            <Filter size={16} aria-hidden="true" />
            Filtrar
          </button>
        </form>
      </Band>
      <Band className="grid gap-3 px-3.5 pb-4 md:grid-cols-2 md:px-6 lg:grid-cols-3 lg:px-8">
        {items.map((item) => (
          <ClassifiedCard key={item.id} classified={item} />
        ))}
        {items.length === 0 ? (
          <p className="border-ink-100 text-ink-700 shadow-card rounded-2xl border bg-white p-4 text-sm">
            Nenhum anúncio encontrado.
          </p>
        ) : null}
      </Band>
      <TabBar active="comunidade" />
    </AppFrame>
  );
}

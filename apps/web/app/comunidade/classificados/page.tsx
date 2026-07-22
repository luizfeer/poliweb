import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { Filter, Plus, Tag } from 'lucide-react';
import { AppFrame, Band, TabBar } from '@/components/carmo';
import {
  CommunityHero,
  CommunityPageShell,
  CommunityPill,
} from '@/components/public/community/community-hero';
import { ClassifiedCard } from '@/components/public/classifieds/cards';
import { getCurrentCity } from '@/lib/cities';
import { listClassifiedsByType } from '@/lib/classifieds/queries';
import type { ClassifiedType } from '@/lib/classifieds/types';

const types: Array<{ value: ClassifiedType; label: string }> = [
  { value: 'vehicle', label: 'Veículos' },
  { value: 'job', label: 'Vagas' },
  { value: 'service', label: 'Serviços' },
  { value: 'item', label: 'Itens' },
  { value: 'other', label: 'Outros' },
];

export const metadata = { title: 'Classificados - Portal Carmelitano' };

export default async function ClassificadosPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: ClassifiedType; q?: string }>;
}) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  const params = await searchParams;
  const items = await listClassifiedsByType({ cityId: city.id, type: params.type, q: params.q });

  return (
    <AppFrame className="bg-paper">
      <CommunityPageShell chips={['Classificados', 'Vagas', 'Serviços']}>
        <CommunityHero
          icon={Tag}
          kicker="Mural da cidade"
          title="Classificados"
          description="Venda, troca, vaga, serviço e oportunidade local em formato simples para circular pela comunidade."
          tone="clay"
          action={
            <Link
              href="/painel/cidadao/classificados/novo"
              className="bg-ink-900 inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-extrabold text-white no-underline"
            >
              <Plus size={17} aria-hidden="true" />
              Postar anúncio
            </Link>
          }
          meta={
            <>
              <CommunityPill tone="clay">{items.length} anúncios</CommunityPill>
              <CommunityPill tone="paper">Moderação antes de publicar</CommunityPill>
            </>
          }
        />

        <Band className="px-3.5 pb-3 md:px-6 lg:px-8">
          <form className="border-ink-100 shadow-card grid gap-2 rounded-2xl border bg-white p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto]">
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Buscar"
              className="border-ink-100 bg-paper focus:border-clay-300 min-h-11 rounded-md border px-3 text-[14px] font-semibold outline-none"
            />
            <select
              name="type"
              defaultValue={params.type ?? ''}
              className="border-ink-100 bg-paper focus:border-clay-300 min-h-11 rounded-md border px-3 text-[14px] font-semibold outline-none"
            >
              <option value="">Todos os tipos</option>
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
          {items.length > 0 ? (
            items.map((item) => <ClassifiedCard key={item.id} classified={item} />)
          ) : (
            <p className="border-ink-100 text-ink-700 shadow-card m-0 rounded-2xl border bg-white p-4 text-[13px]">
              Nenhum classificado encontrado.
            </p>
          )}
        </Band>
        <TabBar active="comunidade" />
      </CommunityPageShell>
    </AppFrame>
  );
}

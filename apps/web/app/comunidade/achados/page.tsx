import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { AppFrame, Band, TabBar } from '@/components/carmo';
import {
  CommunityHero,
  CommunityPageShell,
  CommunityPill,
} from '@/components/public/community/community-hero';
import { LostAndFoundCard } from '@/components/public/community/cards';
import { getCurrentCity } from '@/lib/cities';
import { listLostAndFound } from '@/lib/community/queries';

export const metadata = { title: 'Achados e perdidos - Portal Carmelitano' };

export default async function AchadosPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: 'lost' | 'found' }>;
}) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();
  const params = await searchParams;
  const items = await listLostAndFound({ city_id: city.id, type: params.type });

  return (
    <AppFrame className="bg-paper">
      <CommunityPageShell chips={['Achados', 'Perdidos', 'Postar']}>
        <CommunityHero
          icon={Search}
          kicker="Comunidade"
          title="Achados e perdidos"
          description="Um mural rápido para devolver documentos, chaves, objetos e avisar o que sumiu pela cidade."
          tone="sky"
          action={
            <Link
              href="/comunidade/achados/postar"
              className="bg-ink-900 inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-extrabold text-white no-underline"
            >
              <Plus size={17} aria-hidden="true" />
              Postar item
            </Link>
          }
          meta={
            <>
              <CommunityPill tone="sky">{items.length} avisos</CommunityPill>
              <CommunityPill tone="paper">Atualização pela comunidade</CommunityPill>
            </>
          }
        />

        <Band className="px-3.5 pb-3 md:px-6 lg:px-8">
          <nav className="flex flex-wrap gap-2">
            <FilterLink href="/comunidade/achados" active={!params.type} label="Todos" />
            <FilterLink
              href="/comunidade/achados?type=lost"
              active={params.type === 'lost'}
              label="Perdidos"
            />
            <FilterLink
              href="/comunidade/achados?type=found"
              active={params.type === 'found'}
              label="Achados"
            />
          </nav>
        </Band>

        <Band className="grid gap-3 px-3.5 pb-4 md:grid-cols-2 md:px-6 lg:grid-cols-3 lg:px-8">
          {items.length > 0 ? (
            items.map((item) => <LostAndFoundCard key={item.id} item={item} />)
          ) : (
            <p className="border-ink-100 text-ink-700 shadow-card m-0 rounded-2xl border bg-white p-4 text-[13px]">
              Nada publicado com esse filtro por enquanto.
            </p>
          )}
        </Band>
        <TabBar active="comunidade" />
      </CommunityPageShell>
    </AppFrame>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'border-clay-500 bg-clay-50 text-clay-700 rounded-full border px-3 py-2 text-[13px] font-extrabold no-underline'
          : 'border-ink-100 text-ink-700 rounded-full border bg-white px-3 py-2 text-[13px] font-bold no-underline'
      }
    >
      {label}
    </Link>
  );
}

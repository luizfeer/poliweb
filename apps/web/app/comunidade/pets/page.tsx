import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { PawPrint, Plus } from 'lucide-react';
import { AppFrame, Band, TabBar } from '@/components/carmo';
import {
  CommunityHero,
  CommunityPageShell,
  CommunityPill,
} from '@/components/public/community/community-hero';
import { PetCard } from '@/components/public/community/cards';
import { getCurrentCity } from '@/lib/cities';
import { listLostPets } from '@/lib/community/queries';

export const metadata = { title: 'Pets - Portal Carmelitano' };

export default async function PetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: 'lost' | 'found' | 'reunited' }>;
}) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();
  const params = await searchParams;
  const pets = await listLostPets({ city_id: city.id, status: params.status });

  return (
    <AppFrame className="bg-paper">
      <CommunityPageShell chips={['Pets', 'Perdidos', 'Encontrados']}>
        <CommunityHero
          icon={PawPrint}
          kicker="Comunidade"
          title="Pets perdidos e encontrados"
          description="Publique e acompanhe avisos para ajudar cães e gatos a voltarem para casa."
          tone="sun"
          action={
            <Link
              href="/comunidade/pets/postar"
              className="bg-ink-900 inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-extrabold text-white no-underline"
            >
              <Plus size={17} aria-hidden="true" />
              Postar pet
            </Link>
          }
          meta={
            <>
              <CommunityPill tone="sun">{pets.length} avisos</CommunityPill>
              <CommunityPill tone="paper">Ajuda da vizinhança</CommunityPill>
            </>
          }
        />

        <Band className="px-3.5 pb-3 md:px-6 lg:px-8">
          <nav className="flex flex-wrap gap-2">
            <FilterLink href="/comunidade/pets" active={!params.status} label="Todos" />
            <FilterLink
              href="/comunidade/pets?status=lost"
              active={params.status === 'lost'}
              label="Perdidos"
            />
            <FilterLink
              href="/comunidade/pets?status=found"
              active={params.status === 'found'}
              label="Encontrados"
            />
            <FilterLink
              href="/comunidade/pets?status=reunited"
              active={params.status === 'reunited'}
              label="Reunidos"
            />
          </nav>
        </Band>

        <Band className="grid gap-3 px-3.5 pb-4 md:grid-cols-2 md:px-6 lg:grid-cols-3 lg:px-8">
          {pets.length > 0 ? (
            pets.map((pet) => <PetCard key={pet.id} pet={pet} />)
          ) : (
            <p className="border-ink-100 text-ink-700 shadow-card m-0 rounded-2xl border bg-white p-4 text-[13px]">
              Nenhum aviso com esse filtro agora.
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

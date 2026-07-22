import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus, Tag } from 'lucide-react';
import { AppFrame, AppHeader, Band, TabBar } from '@/components/carmo';
import { PublicHero, PublicHeroPill } from '@/components/public/page-hero';
import { getCurrentCity } from '@/lib/cities';
import { countClassifiedsByType, listClassifiedsByType } from '@/lib/classifieds/queries';
import { ClassifiedCard, ClassifiedHubCards } from '@/components/public/classifieds/cards';

export const metadata = { title: 'Classificados - Portal Carmelitano' };
export const revalidate = 60;

export default async function ClassificadosPage() {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  const [counts, latest] = await Promise.all([
    countClassifiedsByType(city.id),
    listClassifiedsByType({ cityId: city.id, limit: 9 }),
  ]);

  return (
    <AppFrame className="bg-paper">
      <AppHeader chips={['Veículos', 'Vagas', 'Serviços', 'Itens']} />
      <PublicHero
        icon={Tag}
        kicker="Mural da cidade"
        title="Classificados"
        description="Veículos, vagas, serviços e itens com aprovação antes de ir ao ar."
        tone="clay"
        action={
          <Link
            href="/painel/cidadao/classificados/novo"
            className="bg-ink-900 inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-extrabold text-white no-underline"
          >
            <Plus size={17} aria-hidden="true" />
            Anunciar
          </Link>
        }
        meta={
          <>
            <PublicHeroPill tone="clay">{latest.length} recentes</PublicHeroPill>
            <PublicHeroPill tone="paper">Moderação antes de publicar</PublicHeroPill>
          </>
        }
      />

      <Band className="px-3.5 pb-4 md:px-6 lg:px-8">
        <ClassifiedHubCards counts={counts} />
      </Band>

      <Band className="space-y-3 px-3.5 pb-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-ink-900 m-0 text-[22px] font-extrabold">Recentes</h2>
          <Link href="/classificados/buscar" className="text-sm font-medium underline">
            Buscar todos
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {latest.map((classified) => (
            <ClassifiedCard key={classified.id} classified={classified} />
          ))}
        </div>
        {latest.length === 0 ? (
          <p className="border-ink-100 text-ink-700 shadow-card rounded-2xl border bg-white p-4 text-sm">
            Nenhum anúncio publicado.
          </p>
        ) : null}
      </Band>
      <TabBar active="comunidade" />
    </AppFrame>
  );
}

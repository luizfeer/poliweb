import { notFound } from 'next/navigation';
import { Flower2 } from 'lucide-react';
import { AppFrame, Band, TabBar } from '@/components/carmo';
import {
  CommunityHero,
  CommunityPageShell,
  CommunityPill,
} from '@/components/public/community/community-hero';
import { ObituaryCard } from '@/components/public/community/cards';
import { getCurrentCity } from '@/lib/cities';
import { listObituaries } from '@/lib/community/queries';

export const metadata = { title: 'Obituários - Portal Carmelitano' };

export default async function ObituariesPage() {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();
  const obituaries = await listObituaries({ city_id: city.id, days: 30 });

  return (
    <AppFrame className="bg-paper">
      <CommunityPageShell chips={['Comunicados', '30 dias', 'Famílias']}>
        <CommunityHero
          icon={Flower2}
          kicker="Comunicados da comunidade"
          title="Obituários"
          description="Avisos publicados pela administração ou funerária autorizada, com leitura discreta e informações essenciais para a cidade."
          tone="paper"
          meta={
            <>
              <CommunityPill tone="paper">{obituaries.length} comunicados</CommunityPill>
              <CommunityPill tone="clay">Últimos 30 dias</CommunityPill>
            </>
          }
        />

        <Band className="grid gap-3 px-3.5 pb-4 md:grid-cols-2 md:px-6 lg:px-8">
          {obituaries.length > 0 ? (
            obituaries.map((obituary) => <ObituaryCard key={obituary.id} obituary={obituary} />)
          ) : (
            <p className="border-ink-100 text-ink-700 shadow-card m-0 rounded-2xl border bg-white p-4 text-[13px]">
              Nenhum comunicado publicado nos últimos 30 dias.
            </p>
          )}
        </Band>
        <TabBar active="comunidade" />
      </CommunityPageShell>
    </AppFrame>
  );
}

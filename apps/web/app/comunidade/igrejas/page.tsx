import { notFound } from 'next/navigation';
import { CalendarDays, CheckCircle2, Church } from 'lucide-react';
import { AppFrame, Band, TabBar } from '@/components/carmo';
import {
  CommunityHero,
  CommunityPageShell,
  CommunityPill,
} from '@/components/public/community/community-hero';
import { ChurchDirectoryFilter, WeeklyChurchCalendar } from '@/components/public/churches';
import { getCurrentCity } from '@/lib/cities';
import { listChurches, listChurchSchedule } from '@/lib/churches';

export const metadata = {
  title: 'Igrejas e programação religiosa - Portal Carmelitano',
  description:
    'Calendário semanal de missas, cultos e comunidades religiosas de Carmo do Rio Claro.',
};

export default async function ChurchesPage() {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();

  const [churches, schedule] = await Promise.all([listChurches(), listChurchSchedule()]);
  const confirmedCount = schedule.filter((item) => item.sourceStatus === 'confirmed').length;

  return (
    <AppFrame className="bg-paper pb-10">
      <CommunityPageShell chips={['Igrejas', 'Agenda', 'Comunidades']}>
        <CommunityHero
          icon={Church}
          kicker="Carmo do Rio Claro/MG"
          title="Igrejas e programação religiosa"
          description="Missas, cultos, escola bíblica, terços e encontros em um calendário semanal simples de consultar."
          tone="green"
          meta={
            <>
              <CommunityPill tone="green" icon={Church}>
                {churches.length} comunidades
              </CommunityPill>
              <CommunityPill tone="paper" icon={CalendarDays}>
                {schedule.length} horários
              </CommunityPill>
              <CommunityPill tone="clay" icon={CheckCircle2}>
                {confirmedCount} confirmados
              </CommunityPill>
            </>
          }
        />

        <Band className="space-y-8 px-3.5 pb-4 md:px-6 lg:px-8">
          <WeeklyChurchCalendar schedule={schedule} />
          <ChurchDirectoryFilter churches={churches} schedule={schedule} />
        </Band>
        <TabBar active="comunidade" />
      </CommunityPageShell>
    </AppFrame>
  );
}

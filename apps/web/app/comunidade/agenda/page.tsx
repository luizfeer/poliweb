import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { CalendarDays, Filter, Plus } from 'lucide-react';
import { AppFrame, Band, TabBar } from '@/components/carmo';
import {
  CommunityHero,
  CommunityPageShell,
  CommunityPill,
} from '@/components/public/community/community-hero';
import { EventCard } from '@/components/public/community/cards';
import { getCurrentCity } from '@/lib/cities';
import { listEventCategories, listEvents } from '@/lib/community/queries';

export const metadata = { title: 'Agenda - Portal Carmelitano' };

export const revalidate = 60;

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{
    when?: 'today' | 'week' | 'month' | 'all';
    category_id?: string;
    q?: string;
  }>;
}) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('events')) notFound();
  const params = await searchParams;
  const [events, categories] = await Promise.all([
    listEvents({
      city_id: city.id,
      when: params.when ?? 'month',
      category_id: params.category_id,
      q: params.q,
    }),
    listEventCategories(city.id),
  ]);

  return (
    <AppFrame className="bg-paper">
      <CommunityPageShell chips={['Hoje', 'Semana', 'Mês', 'Enviar']}>
        <CommunityHero
          icon={CalendarDays}
          kicker="Agenda da cidade"
          title="Eventos e encontros"
          description="Festas, reuniões, encontros, ações sociais e compromissos públicos em formato de feed para acompanhar a semana."
          tone="clay"
          action={
            <Link
              href="/comunidade/agenda/submeter"
              className="bg-ink-900 inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-extrabold text-white no-underline"
            >
              <Plus size={17} aria-hidden="true" />
              Enviar evento
            </Link>
          }
          meta={
            <>
              <CommunityPill tone="clay">{events.length} eventos</CommunityPill>
              <CommunityPill tone="paper">{categories.length} categorias</CommunityPill>
            </>
          }
        />

        <Band className="px-3.5 pb-3 md:px-6 lg:px-8">
          <form className="border-ink-100 shadow-card grid gap-2 rounded-2xl border bg-white p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_auto]">
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Buscar evento"
              className="border-ink-100 bg-paper focus:border-clay-300 min-h-11 rounded-md border px-3 text-[14px] font-semibold outline-none"
            />
            <select
              name="when"
              defaultValue={params.when ?? 'month'}
              className="border-ink-100 bg-paper focus:border-clay-300 min-h-11 rounded-md border px-3 text-[14px] font-semibold outline-none"
            >
              <option value="today">Hoje</option>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
              <option value="all">Todos</option>
            </select>
            <select
              name="category_id"
              defaultValue={params.category_id ?? ''}
              className="border-ink-100 bg-paper focus:border-clay-300 min-h-11 rounded-md border px-3 text-[14px] font-semibold outline-none"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
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

        <Band className="grid gap-3 px-3.5 pb-4 md:grid-cols-2 md:px-6 lg:px-8">
          {events.length > 0 ? (
            events.map((event) => <EventCard key={event.id} event={event} />)
          ) : (
            <p className="border-ink-100 text-ink-700 shadow-card m-0 rounded-2xl border bg-white p-4 text-[13px]">
              Nada encontrado para esse filtro.
            </p>
          )}
        </Band>
        <TabBar active="comunidade" />
      </CommunityPageShell>
    </AppFrame>
  );
}

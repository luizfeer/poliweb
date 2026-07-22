import Link from 'next/link';
import { AlertTriangle, Anchor, ArrowRight, ChevronRight, Info, MapPin, Wallet } from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, SectionHeader, TabBar } from '@/components/carmo';
import { GuideCardCompact } from '@/components/public/tourism/guide-card';
import { getCurrentCity } from '@/lib/cities';
import { listFerryRoutes } from '@/lib/ferries';
import type { FerryRouteCard, FerryStatus } from '@/lib/ferries';
import { listGuides } from '@/lib/tourism';

export const metadata = {
  title: 'Balsas e travessias - Portal Carmelitano',
  description:
    'Horários e valores das balsas em Carmo do Rio Claro: Itaci, Itapiché, Águas Verdes e Lago de Furnas.',
};

export const revalidate = 300;

function statusBadge(status: FerryStatus): { label: string; tone: string } {
  switch (status) {
    case 'active':
      return { label: 'Em operação', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'active_check_before_go':
      return { label: 'Confirme antes', tone: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'schedule_missing':
      return { label: 'Horário a confirmar', tone: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
    case 'suspended':
      return { label: 'Suspensa', tone: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: 'Inativa', tone: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
  }
}

function routeCardTone(route: FerryRouteCard) {
  if (route.slug.includes('itapiche')) {
    return {
      card: 'border-sky-200 bg-sky-50/45 hover:border-sky-300',
      icon: 'bg-sky-100 text-sky-700',
      title: 'text-sky-900',
      price: 'text-sky-900',
      action: 'text-sky-700',
    };
  }
  if (route.slug.includes('sao-francisco')) {
    return {
      card: 'border-cerrado-100 bg-cerrado-100/45 hover:border-cerrado-700/30',
      icon: 'bg-white text-cerrado-700',
      title: 'text-cerrado-700',
      price: 'text-cerrado-700',
      action: 'text-cerrado-700',
    };
  }
  return {
    card: 'border-clay-200 bg-clay-50/55 hover:border-clay-300',
    icon: 'bg-white text-clay-600',
    title: 'text-clay-900',
    price: 'text-clay-700',
    action: 'text-clay-700',
  };
}

function FerryCard({ route }: { route: FerryRouteCard }) {
  const badge = statusBadge(route.status);
  const tone = routeCardTone(route);
  const routeTitle = route.display.cardTitle ?? [route.endpointA, route.endpointB].filter(Boolean).join(' → ');
  const [origin, destination] = routeTitle.split('→').map((part) => part.trim());
  const subtitle = route.display.cardSubtitle ?? route.shortName ?? route.name;
  return (
    <Link
      href={`/balsas/${route.slug}`}
      className={`group flex flex-col gap-3 rounded-2xl border p-4 no-underline transition hover:no-underline hover:shadow-sm focus-visible:no-underline ${tone.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone.icon}`}>
            <Anchor size={20} />
          </span>
          <div className="min-w-0">
            <h3 className={`m-0 flex items-center gap-1 truncate font-display text-[16px] font-extrabold no-underline ${tone.title}`}>
              {origin && destination ? (
                <>
                  <span className="truncate no-underline">{origin}</span>
                  <ArrowRight size={14} className="shrink-0 text-clay-600" />
                  <span className="truncate no-underline">{destination}</span>
                </>
              ) : (
                <span className="truncate no-underline">{routeTitle}</span>
              )}
            </h3>
            <p className="m-0 mt-0.5 truncate text-[12px] text-ink-600 no-underline">{subtitle}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.tone}`}
        >
          {badge.label}
        </span>
      </div>

      {route.display.priceLabel && (
        <p className={`m-0 flex items-center gap-1.5 text-[12px] no-underline ${tone.price}`}>
          <Wallet size={14} className="text-clay-600" />
          {route.display.priceLabel}
        </p>
      )}

      {route.relatedCities.length > 0 && (
        <p className="m-0 text-[12px] text-ink-600 no-underline">
          {route.relatedCities.slice(0, 4).join(' · ')}
        </p>
      )}

      <div className={`mt-auto flex items-center justify-between text-[12px] font-semibold no-underline ${tone.action}`}>
        <span>{route.display.ctaLabel ?? 'Ver horários'}</span>
        <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export default async function BalsasIndexPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const [routes, relatedGuides] = await Promise.all([
    listFerryRoutes(city.id),
    listGuides({ city_id: city.id, limit: 4 }),
  ]);
  const ferryGuides = relatedGuides.filter(
    (g) => g.slug.includes('itaci') || g.slug.includes('conheca-carmo') || g.slug.includes('como-chegar'),
  );
  const featured = routes.filter((r) => r.featured);
  const others = routes.filter((r) => !r.featured);

  return (
    <AppFrame>
      <AppHeader chips={['Itaci', 'Itapiché', 'Campo do Meio', 'Lago de Furnas']} searchHref="/balsas" />

      <Band variant="paper-card" className="px-3.5 py-4">
        <div className="flex items-center gap-2">
          <Anchor size={24} className="text-clay-600" />
          <div>
            <h1 className="font-display m-0 text-[28px] font-extrabold leading-tight">
              Balsas e travessias
            </h1>
            <p className="text-ink-700 m-0 mt-0.5 text-[14px]">
              {city.name}: horários, valores e avisos antes de pegar a balsa.
            </p>
          </div>
        </div>
      </Band>

      <Band className="px-3.5 py-3">
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p className="m-0">
            <strong>Confirme antes de sair.</strong> Horários e valores podem mudar por
            manutenção, eventos, safra, nível do Lago de Furnas ou decisão da Prefeitura.
          </p>
        </div>
      </Band>

      <Divider />

      <Band className="space-y-3 px-3.5 py-3">
        {featured.length > 0 && (
          <section className="space-y-2">
            <h2 className="m-0 font-sans text-[13px] font-extrabold uppercase tracking-wide text-ink-600">
              Travessias em destaque
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {featured.map((route) => (
                <FerryCard key={route.id} route={route} />
              ))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section className="space-y-2 pt-2">
            <h2 className="m-0 font-sans text-[13px] font-extrabold uppercase tracking-wide text-ink-600">
              Outras travessias
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {others.map((route) => (
                <FerryCard key={route.id} route={route} />
              ))}
            </div>
          </section>
        )}

        {routes.length === 0 && (
          <p className="rounded-md border bg-white p-4 text-[14px] text-ink-700">
            Ainda não temos rotas cadastradas. Volte em breve.
          </p>
        )}
      </Band>

      <Band className="px-3.5 py-4">
        <h2 className="m-0 mb-2 font-display text-[20px] font-extrabold">Antes de viajar</h2>
        <ul className="m-0 space-y-2 p-0 text-[13px] text-ink-700">
          <li className="flex gap-2">
            <Info size={16} className="mt-0.5 shrink-0 text-clay-600" />
            Em dias de festa, romarias ou rodeios no Itaci, a travessia pode ter esquema especial.
          </li>
          <li className="flex gap-2">
            <Wallet size={16} className="mt-0.5 shrink-0 text-clay-600" />
            Moradores de Carmo do Rio Claro têm gratuidade. Carros de não moradores pagam R$ 10,00.
          </li>
          <li className="flex gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-clay-600" />
            Chegue com folga: a fila pode ficar grande nos horários de pico e em feriados.
          </li>
          <li className="flex gap-2">
            <ArrowRight size={16} className="mt-0.5 shrink-0 text-clay-600" />
            Planeje a volta — confira o último horário antes de embarcar para o destino.
          </li>
        </ul>
      </Band>

      {ferryGuides.length > 0 && (
        <>
          <Divider />
          <SectionHeader
            title="Quer conhecer mais?"
            kicker="Guias relacionados"
            action={{ label: 'Ver guias', href: '/turismo/guias' }}
          />
          <Band className="space-y-2 px-3.5 pb-3">
            {ferryGuides.map((guide) => (
              <GuideCardCompact key={guide.id} guide={guide} />
            ))}
          </Band>
        </>
      )}

      <TabBar active="servicos" />
    </AppFrame>
  );
}

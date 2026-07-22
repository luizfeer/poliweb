import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Anchor,
  ArrowLeft,
  ArrowRightLeft,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Info,
  Navigation,
  Ship,
  ShipWheel,
  Timer,
  WavesHorizontal,
  Wrench,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { getCurrentCity } from '@/lib/cities';
import { getFerryRouteBySlug, groupSchedulesByDirection } from '@/lib/ferries';
import type { FerryAlertType, FerrySchedule } from '@/lib/ferries';
import { buildSocialImages } from '@/lib/seo/social-images';

export const revalidate = 60;

type RouteParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RouteParams) {
  const { slug } = await params;
  const city = await getCurrentCity();
  if (!city) return {};
  const route = await getFerryRouteBySlug(city.id, slug);
  if (!route) return {};
  const socialImages = buildSocialImages({
    ogImageUrl: route.ogImageUrl,
    ogSquareImageUrl: route.ogSquareImageUrl,
    alt: route.name,
  });
  return {
    title: route.seo.title ?? `${route.name} - Portal Carmelitano`,
    description: route.seo.description ?? route.description ?? undefined,
    keywords: route.keywords,
    ...socialImages,
  };
}

const ALERT_ICON: Record<
  FerryAlertType,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  info: Info,
  warning: AlertTriangle,
  maintenance: Wrench,
  event: Sparkles,
  safety: ShieldAlert,
};

const ALERT_TONE: Record<FerryAlertType, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  maintenance: 'border-zinc-200 bg-zinc-50 text-zinc-900',
  event: 'border-violet-200 bg-violet-50 text-violet-900',
  safety: 'border-rose-200 bg-rose-50 text-rose-900',
};

function getSaoPauloMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return (hour % 24) * 60 + minute;
}

function scheduleMinutes(schedule: FerrySchedule): number {
  const [hour, minute] = schedule.departsAt.split(':').map(Number);
  return hour * 60 + minute;
}

function formatTimeUntil(departureMinutes: number, currentMinutes: number): string {
  const diff = departureMinutes - currentMinutes;
  if (diff <= 0) return 'agora';
  if (diff < 60) return `em ${diff} min`;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (minutes === 0) return `em ${hours} h`;
  return `em ${hours} h ${minutes} min`;
}

function formatMinutesFromNow(totalMinutes: number): string {
  if (totalMinutes <= 0) return 'agora';
  if (totalMinutes < 60) return `em ${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `em ${hours} h`;
  return `em ${hours} h ${minutes} min`;
}

/** Minutes from now until the first departure after the next local midnight (America/Sao_Paulo). */
function minutesUntilTomorrowFirstDeparture(
  firstDepartureMinutes: number,
  currentMinutes: number,
): number {
  return 24 * 60 - currentMinutes + firstDepartureMinutes;
}

function nextDeparture(items: FerrySchedule[], currentMinutes: number): FerrySchedule | null {
  const sorted = [...items].sort((a, b) => a.departsAt.localeCompare(b.departsAt));
  return sorted.find((s) => scheduleMinutes(s) > currentMinutes) ?? null;
}

function firstDepartureOfDay(items: FerrySchedule[]): FerrySchedule | null {
  if (items.length === 0) return null;
  const sorted = [...items].sort((a, b) => a.departsAt.localeCompare(b.departsAt));
  return sorted[0] ?? null;
}

export default async function BalsaDetailPage({ params }: RouteParams) {
  const { slug } = await params;
  const city = await getCurrentCity();
  if (!city) return null;

  const route = await getFerryRouteBySlug(city.id, slug);
  if (!route) notFound();

  const groups = groupSchedulesByDirection(route.schedules);
  const currentMinutes = getSaoPauloMinutes(new Date());
  const prices = route.fare.prices ?? [];

  return (
    <AppFrame>
      <AppHeader chips={[route.shortName ?? 'Balsa', 'Horários', 'Valores']} searchHref="/balsas" />

      <Band variant="paper-card" className="px-3.5 py-4">
        <Link
          href="/balsas"
          className="text-clay-600 mb-2 inline-flex items-center gap-1 text-[12px] font-semibold"
        >
          <ArrowLeft size={14} /> Todas as balsas
        </Link>
        <div className="border-clay-100 bg-clay-50 overflow-hidden rounded-2xl border">
          <div className="relative p-4">
            <div className="text-clay-100 absolute right-3 top-3" aria-hidden="true">
              <ShipWheel size={92} strokeWidth={1.25} />
            </div>
            <div className="relative flex items-start gap-3">
              <span className="text-clay-600 shadow-card grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white">
                <Ship size={27} />
              </span>
              <div className="min-w-0">
                <h1 className="font-display m-0 text-[26px] font-extrabold leading-tight">
                  {route.shortName ?? route.name}
                </h1>
                <p className="text-ink-700 m-0 mt-1 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold">
                  <span>{route.endpointA}</span>
                  <ArrowRightLeft size={14} className="text-clay-600" aria-hidden="true" />
                  <span>{route.endpointB}</span>
                  {route.region && (
                    <span className="text-ink-500 font-normal">· {route.region}</span>
                  )}
                </p>
                {route.description && (
                  <p className="text-ink-700 m-0 mt-2 max-w-2xl text-[13px] leading-relaxed">
                    {route.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Band>

      {route.confidence !== 'high' && (
        <Band className="px-3.5 pt-3">
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p className="m-0">
              <strong>Confirme no local.</strong>{' '}
              {route.fareWarning ?? 'Os horários e valores podem mudar sem aviso prévio.'}
            </p>
          </div>
        </Band>
      )}

      <Divider />

      {groups.length > 0 && (
        <Band className="px-3.5 py-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-display m-0 flex items-center gap-2 text-[20px] font-extrabold">
              <Timer size={20} className="text-clay-600" aria-hidden="true" />
              Próximas saídas
            </h2>
            <p className="text-ink-500 m-0 text-right text-[11px] font-semibold">
              Horário de Carmo
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {groups.map((g) => {
              const nextToday = nextDeparture(g.items, currentMinutes);
              const firstOfDay = firstDepartureOfDay(g.items);
              const isFirstTomorrow = Boolean(!nextToday && firstOfDay);
              const displaySchedule = nextToday ?? firstOfDay;
              let badgeLabel: string | null = null;
              if (displaySchedule) {
                if (isFirstTomorrow && firstOfDay) {
                  badgeLabel = formatMinutesFromNow(
                    minutesUntilTomorrowFirstDeparture(scheduleMinutes(firstOfDay), currentMinutes),
                  );
                } else {
                  badgeLabel = formatTimeUntil(scheduleMinutes(displaySchedule), currentMinutes);
                }
              }
              return (
                <article
                  key={g.direction}
                  className="border-ink-100 shadow-card overflow-hidden rounded-2xl border bg-white"
                >
                  <div className="flex items-center gap-3 p-3">
                    <span className="bg-clay-50 text-clay-600 grid h-10 w-10 shrink-0 place-items-center rounded-full">
                      <Navigation size={20} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-clay-600 m-0 truncate text-[12px] font-extrabold uppercase tracking-wide">
                        {g.direction}
                      </p>
                      {isFirstTomorrow && displaySchedule ? (
                        <p className="font-display m-0 mt-1 flex flex-wrap items-baseline gap-2 text-[18px] font-extrabold leading-tight">
                          <span className="bg-clay-200 text-clay-900 shrink-0 rounded-lg px-2 py-0.5 uppercase tracking-wide">
                            Amanhã
                          </span>
                          <span className="text-ink-900 tabular-nums">
                            {displaySchedule.departsAt}
                          </span>
                        </p>
                      ) : (
                        <p className="font-display m-0 mt-1 text-[32px] font-extrabold tabular-nums leading-none">
                          {displaySchedule ? displaySchedule.departsAt : '--:--'}
                        </p>
                      )}
                    </div>
                    <span className="bg-cerrado-100 text-cerrado-700 rounded-full px-2.5 py-1 text-[11px] font-extrabold">
                      {badgeLabel ?? 'encerrado'}
                    </span>
                  </div>
                  <div className="border-ink-100 bg-paper text-ink-600 flex items-center gap-2 border-t px-3 py-2 text-[12px]">
                    <WavesHorizontal
                      size={16}
                      className="shrink-0 text-sky-700"
                      aria-hidden="true"
                    />
                    <span>
                      {!displaySchedule
                        ? 'sem horários cadastrados'
                        : isFirstTomorrow
                          ? 'primeira saída amanhã'
                          : 'próxima saída de hoje'}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </Band>
      )}

      {/* Quadro completo de horários */}
      <Band className="px-3.5 py-3">
        <h2 className="font-display m-0 mb-2 flex items-center gap-2 text-[20px] font-extrabold">
          <CalendarClock size={20} className="text-clay-600" /> Quadro de horários
        </h2>
        {groups.length === 0 ? (
          <p className="text-ink-700 rounded-md border bg-white p-4 text-[14px]">
            Ainda não temos horários confirmados para esta travessia. Consulte a Prefeitura ou
            confirme no local antes de viajar.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((g) => {
              const nextToday = nextDeparture(g.items, currentMinutes);
              const nextHighlight = nextToday ?? firstDepartureOfDay(g.items);
              return (
                <article
                  key={g.direction}
                  className="border-ink-100 shadow-card overflow-hidden rounded-2xl border bg-white"
                >
                  <header className="border-ink-100 bg-paper flex items-center justify-between border-b px-3 py-2">
                    <p className="m-0 flex items-center gap-2 text-[13px] font-extrabold">
                      <Anchor size={15} className="text-clay-600" aria-hidden="true" />
                      {g.direction}
                    </p>
                    <p className="text-ink-600 m-0 text-[11px]">{g.items.length} saídas</p>
                  </header>
                  <ul className="m-0 grid grid-cols-3 gap-1.5 p-3">
                    {g.items.map((s) => {
                      const isNext = nextHighlight?.id === s.id;
                      return (
                        <li
                          key={s.id}
                          className={
                            isNext
                              ? 'border-clay-300 bg-clay-50 text-clay-700 shadow-banner rounded-xl border px-2 py-1.5 text-center font-mono text-[14px] font-extrabold tabular-nums'
                              : 'border-ink-100 bg-paper rounded-xl border px-2 py-1.5 text-center font-mono text-[14px] font-semibold tabular-nums'
                          }
                        >
                          {s.departsAt}
                        </li>
                      );
                    })}
                  </ul>
                  {g.items.some((s) => s.notes) && (
                    <footer className="border-ink-100 bg-paper-deep text-ink-700 border-t px-3 py-2 text-[12px]">
                      {Array.from(new Set(g.items.map((s) => s.notes).filter(Boolean))).map((n) => (
                        <p key={n} className="m-0 flex items-start gap-1.5">
                          <Info
                            size={14}
                            className="text-clay-600 mt-0.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{n}</span>
                        </p>
                      ))}
                    </footer>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Band>

      {/* Tarifas */}
      <Band variant="paper-card" className="px-3.5 py-3">
        <h2 className="font-display m-0 mb-2 flex items-center gap-2 text-[20px] font-extrabold">
          <Banknote size={20} className="text-clay-600" /> Valores da travessia
        </h2>
        {route.fareSummary && (
          <p className="text-ink-700 m-0 mb-3 text-[13px]">{route.fareSummary}</p>
        )}
        {prices.length > 0 && (
          <div className="border-ink-200 overflow-hidden rounded-2xl border">
            <table className="w-full text-left text-[13px]">
              <tbody>
                {prices.map((p) => (
                  <tr key={p.category} className="border-ink-100 border-b last:border-b-0">
                    <td className="px-3 py-2 font-medium">{p.category}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{p.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {route.fareWarning && (
          <p className="text-ink-600 m-0 mt-2 text-[12px] italic">{route.fareWarning}</p>
        )}
      </Band>

      {/* Importante */}
      {route.importantInfo.length > 0 && (
        <Band className="px-3.5 py-3">
          <h2 className="font-display m-0 mb-2 text-[20px] font-extrabold">Importante</h2>
          <ul className="text-ink-700 m-0 space-y-1.5 p-0 text-[13px]">
            {route.importantInfo.map((info, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle2 size={15} className="text-clay-600 mt-0.5 shrink-0" />
                <span>{info}</span>
              </li>
            ))}
          </ul>
        </Band>
      )}

      {/* Alertas */}
      {route.alerts.length > 0 && (
        <Band className="space-y-2 px-3.5 py-3">
          <h2 className="font-display m-0 mb-1 text-[20px] font-extrabold">Avisos</h2>
          {route.alerts.map((a) => {
            const Icon = ALERT_ICON[a.type] ?? Info;
            return (
              <div
                key={a.id}
                className={`flex items-start gap-2 rounded-xl border p-3 text-[13px] ${ALERT_TONE[a.type]}`}
              >
                <Icon size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="m-0 font-semibold">{a.title}</p>
                  <p className="m-0 mt-0.5">{a.message}</p>
                </div>
              </div>
            );
          })}
        </Band>
      )}

      <Band className="px-3.5 py-4">
        <Link
          href="/assistente"
          className="border-clay-300 bg-clay-50 text-clay-700 hover:bg-clay-100 flex items-center justify-between rounded-2xl border px-4 py-3 text-[14px] font-semibold"
        >
          <span>Pergunte ao assistente sobre a balsa do {route.shortName ?? 'Itaci'}</span>
          <ChevronRight size={18} />
        </Link>
      </Band>

      <TabBar active="servicos" />
    </AppFrame>
  );
}

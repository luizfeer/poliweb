'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  CloudSun,
  LogIn,
  MapPin,
  Navigation,
  PhoneCall,
  Radio,
  Route,
  Search,
  Sparkles,
  Store,
  ThermometerSun,
  Umbrella,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SearchBar } from '@/components/search/search-bar';
import type { LiveFeedItem } from '@/lib/live-feed/queries';
import type { WeatherSnapshot } from '@/lib/weather';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { NotificationsPopover } from './notifications-popover';
import type { NavNotification } from './global-nav-client';
import type { TabId } from './tab-bar';

type TopNavProps = {
  active: TabId;
  pathname: string;
  unreadCount: number;
  recentNotifications: NavNotification[];
  liveFeedItems: LiveFeedItem[];
  weather: WeatherSnapshot | null;
  isAuthenticated: boolean;
  userName: string | null;
  avatarUrl: string | null;
  vapidPublicKey: string | null;
  cityId: string | null;
};

const NAV_LINKS = [
  { id: 'home' as const, label: 'In\u00edcio', href: '/', match: (pathname: string) => pathname === '/' },
  {
    id: 'comercio' as const,
    label: 'Com\u00e9rcio',
    href: '/comercio',
    match: (pathname: string) => pathname.startsWith('/comercio'),
  },
  {
    id: 'turismo' as const,
    label: 'Turismo',
    href: '/turismo',
    match: (pathname: string) => pathname.startsWith('/turismo'),
  },
  {
    id: 'servicos' as const,
    label: 'Servi\u00e7os',
    href: '/servicos',
    match: (pathname: string) => pathname.startsWith('/servicos'),
  },
  {
    id: 'comunidade' as const,
    label: 'Comunidade',
    href: '/comunidade',
    match: (pathname: string) => pathname.startsWith('/comunidade') || pathname.startsWith('/agenda'),
  },
];

const SUBNAV_LINKS = [
  { label: 'Ao vivo', href: '/ao-vivo' },
  { label: 'Transpar\u00eancia', href: '/transparencia' },
  { label: 'Im\u00f3veis', href: '/imoveis' },
  { label: 'Classificados', href: '/classificados' },
  { label: 'Achados & pets', href: '/comunidade/achados' },
  { label: 'Agenda', href: '/agenda' },
];

const LIVE_ITEMS = [
  {
    id: 'fallback-services',
    tone: 'cerrado' as const,
    label: 'Cidade:',
    title: 'servi\u00e7os locais no portal',
    suffix: 'telefones, agenda e avisos',
    href: '/servicos',
    sourceKind: 'portal',
    payload: {},
  },
  {
    id: 'fallback-businesses',
    tone: 'sun' as const,
    label: 'Com\u00e9rcio:',
    title: 'p\u00e1ginas e promo\u00e7\u00f5es locais',
    suffix: 'cadastre sua empresa',
    href: '/anuncie',
    sourceKind: 'portal',
    payload: {},
  },
  {
    id: 'fallback-community',
    tone: 'sky' as const,
    label: 'Comunidade:',
    title: 'avisos, eventos e achados',
    suffix: 'acompanhe por aqui',
    href: '/comunidade',
    sourceKind: 'portal',
    payload: {},
  },
  {
    id: 'fallback-portal',
    tone: 'clay' as const,
    label: 'Portal:',
    title: 'Carmelitano chegou',
    suffix: 'feito para Carmo',
    href: '/',
    sourceKind: 'portal',
    payload: {},
  },
];

const LIVE_TONE_CLASSES: Record<LiveFeedItem['tone'], string> = {
  clay: 'bg-clay-500',
  cerrado: 'bg-cerrado-300',
  sun: 'bg-sun-500',
  sky: 'bg-sky-500',
  ink: 'bg-ink-400',
  green: 'bg-green-500',
  red: 'bg-red-500',
};

function getTickerItems(items: LiveFeedItem[]): LiveFeedItem[] {
  const merged = [...items, ...LIVE_ITEMS];
  return merged.slice(0, 4);
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function getFirstName(name: string | null): string {
  if (!name) return '';
  return name.trim().split(/\s+/)[0] ?? '';
}

export function TopNav({
  active,
  pathname,
  unreadCount,
  recentNotifications,
  liveFeedItems,
  weather,
  isAuthenticated,
  userName,
  avatarUrl,
  vapidPublicKey,
  cityId,
}: TopNavProps) {
  const firstName = getFirstName(userName);
  const tickerItems = getTickerItems(liveFeedItems);
  const [isLivePanelOpen, setIsLivePanelOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full text-white shadow-[0_4px_18px_rgba(25,25,25,0.12)]">
      <div className="relative bg-ink-900 text-[12px] sm:text-[13px]">
        <div className="mx-auto flex h-9 max-w-[1440px] items-center gap-3 overflow-hidden px-3 sm:px-4 lg:px-8">
          <button
            type="button"
            onClick={() => setIsLivePanelOpen((value) => !value)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[3px] bg-clay-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-clay-600 sm:text-[11px]"
            aria-expanded={isLivePanelOpen}
            aria-controls="carmo-live-panel"
          >
            <Radio size={12} strokeWidth={2.2} aria-hidden="true" />
            <span className="md:hidden">Ao vivo</span>
            <span className="hidden md:inline">{'Ao vivo \u00b7 Carmo'}</span>
            <ChevronDown
              size={12}
              strokeWidth={2.2}
              className={cn('transition-transform', isLivePanelOpen && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={() => setIsLivePanelOpen((value) => !value)}
            className="relative h-[22px] min-w-0 flex-1 overflow-hidden text-left"
            aria-label="Abrir resumo ao vivo de clima e rotas"
          >
            <div className="carmo-live-ticker-list flex flex-col">
              {tickerItems.map((item) => (
                <span
                  key={item.id}
                  className="flex h-[22px] min-w-0 items-center gap-2 whitespace-nowrap leading-[22px] text-white"
                >
                  <i className={cn('size-1.5 shrink-0 rounded-full', LIVE_TONE_CLASSES[item.tone])} aria-hidden="true" />
                  <span className="min-w-0 flex-1 overflow-hidden">
                    <span className="carmo-live-marquee inline-block min-w-full">
                      {item.label} <strong>{item.title}</strong>
                      {item.suffix ? <> {'\u00b7'} {item.suffix}</> : null}
                    </span>
                  </span>
                </span>
              ))}
            </div>
          </button>
          <div className="hidden shrink-0 items-center gap-4 text-white/85 xl:flex">
            <span className="inline-flex items-center gap-1.5">
              <CloudSun size={14} strokeWidth={1.8} aria-hidden="true" />
              {formatNavWeather(weather)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} strokeWidth={1.8} aria-hidden="true" />
              CEP 37150-000
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PhoneCall size={14} strokeWidth={1.8} aria-hidden="true" />
              SAMU 192
            </span>
          </div>
        </div>
        {isLivePanelOpen ? (
          <LiveInfoPanel
            items={liveFeedItems}
            weather={weather}
            onClose={() => setIsLivePanelOpen(false)}
          />
        ) : null}
      </div>

      <div className="bg-clay-500">
        <div className="mx-auto max-w-[1440px] px-3 py-3 sm:px-4 lg:px-8">
          <div className="flex items-center gap-3 lg:gap-5">
            <Link
              href="/"
              className="flex min-w-0 shrink-0 items-center gap-2.5 text-white hover:text-white hover:no-underline"
              aria-label={'Portal Carmelitano \u2014 in\u00edcio'}
            >
              <Logo variant="app" width={44} height={44} priority framed={false} />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="font-display text-[16px] font-extrabold tracking-normal text-white sm:text-[17px] lg:text-[21px]">
                  Portal Carmelitano
                </span>
                <span className="hidden text-[11px] font-semibold tracking-[0.04em] text-white/80 sm:inline">
                  Carmo do Rio Claro / MG
                </span>
              </span>
            </Link>

            <nav className="hidden shrink-0 items-center gap-1 md:flex" aria-label={'Navega\u00e7\u00e3o principal'}>
              {NAV_LINKS.map(({ id, label, href, match }) => {
                const isActive = id === 'home' ? active === 'home' && match(pathname) : match(pathname);
                return (
                  <Link
                    key={id}
                    href={href}
                    className={cn(
                      'rounded-full px-3.5 py-2 text-[13px] font-semibold text-white/92 transition-colors hover:no-underline lg:text-[13.5px]',
                      isActive ? 'bg-white text-clay-700 shadow-sm' : 'hover:bg-white/12 hover:text-white',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden min-w-0 flex-1 lg:flex">
              <div className="w-full max-w-[520px] [&_button]:bg-ink-900 [&_button]:px-4 [&_button]:py-2 [&_form]:h-11 [&_form]:rounded-full [&_form]:bg-white [&_form]:py-1.5 [&_form]:pr-1 [&_form]:shadow-[0_2px_0_rgba(0,0,0,0.04)] [&_form:focus-within]:shadow-[0_0_0_4px_rgba(255,255,255,0.32)] [&_svg]:size-4">
                <SearchBar compact />
              </div>
            </div>
            <div className="min-w-0 flex-1 lg:hidden" />

            <div className="flex shrink-0 items-center gap-1">
              <Link
                href="/buscar"
                className="flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/12 hover:text-white hover:no-underline lg:hidden"
                aria-label="Buscar"
              >
                <Search size={18} strokeWidth={2} aria-hidden="true" />
              </Link>
              <div className="[&_a:hover]:bg-white/12 [&_a:hover]:text-white [&_a]:text-white [&_button:hover]:bg-white/12 [&_button:hover]:text-white [&_button]:text-white">
                <NotificationsPopover
                  unreadCount={unreadCount}
                  notifications={recentNotifications}
                  isAuthenticated={isAuthenticated}
                  vapidPublicKey={vapidPublicKey}
                  cityId={cityId}
                />
              </div>

              <span className="mx-1 hidden h-6 w-px bg-white/20 sm:block" aria-hidden="true" />

              {isAuthenticated ? (
                <Link
                  href="/painel"
                  className={cn(
                    'flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:no-underline sm:pr-3',
                    active === 'account'
                      ? 'bg-white text-clay-700'
                      : 'text-white hover:bg-white/12 hover:text-white',
                  )}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 rounded-full object-cover ring-2 ring-white/50"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full text-[12px] font-bold ring-2',
                        active === 'account'
                          ? 'bg-clay-500 text-white ring-clay-500/30'
                          : 'bg-white/15 text-white ring-white/40',
                      )}
                      aria-hidden="true"
                    >
                      {getInitials(userName)}
                    </span>
                  )}
                  <span className="hidden flex-col items-start leading-tight xl:flex">
                    <span
                      className={cn(
                        'text-[11px] font-medium',
                        active === 'account' ? 'text-clay-600' : 'text-white/75',
                      )}
                    >
                      {'Ol\u00e1,'}
                    </span>
                    <span className="max-w-[110px] truncate text-[13px] font-semibold">
                      {firstName || 'Conta'}
                    </span>
                  </span>
                </Link>
              ) : (
                <Link
                  href="/entrar"
                  className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[13px] font-semibold text-clay-700 transition-colors hover:bg-paper-deep hover:text-clay-700 hover:no-underline sm:px-4"
                >
                  <LogIn size={15} strokeWidth={2} aria-hidden="true" />
                  <span className="hidden sm:inline">Entrar</span>
                </Link>
              )}
            </div>
          </div>

          <div className="mt-3 lg:hidden [&_button]:bg-ink-900 [&_form]:h-11 [&_form]:rounded-full [&_form]:bg-white [&_form]:py-1.5 [&_form]:pr-1 [&_form]:shadow-[0_2px_0_rgba(0,0,0,0.04)]">
            <SearchBar compact />
          </div>
        </div>
      </div>

      <div className="border-b border-ink-200 bg-white text-ink-600">
        <nav
          className="no-scrollbar mx-auto flex max-w-[1440px] items-center gap-4 overflow-x-auto px-3 py-2.5 text-[13px] sm:px-4 lg:gap-5 lg:px-8"
          aria-label="Atalhos da cidade"
        >
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-clay-50 px-3 py-1.5 font-semibold text-clay-700 md:inline-flex">
            <MapPin size={14} strokeWidth={1.9} aria-hidden="true" />
            <strong>Centro</strong> {'\u00b7 trocar bairro'}
          </span>
          {SUBNAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 font-medium text-ink-700 hover:text-ink-900 hover:no-underline"
            >
              {link.label}
            </Link>
          ))}
          <span className="hidden flex-1 lg:block" aria-hidden="true" />
          <Link
            href="/assistente"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-black hover:text-white hover:no-underline"
          >
            <Sparkles size={13} strokeWidth={2} aria-hidden="true" />
            Assistente IA
          </Link>
          <Link
            href="/anuncie"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cerrado-700 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-cerrado-500 hover:text-white hover:no-underline"
          >
            <Store size={13} strokeWidth={2} aria-hidden="true" />
            {'Anuncie seu com\u00e9rcio'}
          </Link>
        </nav>
      </div>
    </header>
  );
}

function LiveInfoPanel({
  items,
  weather,
  onClose,
}: {
  items: LiveFeedItem[];
  weather: WeatherSnapshot | null;
  onClose: () => void;
}) {
  const trafficItems = items.filter((item) => item.sourceKind === 'traffic').slice(0, 6);
  const days = weather?.daily.slice(0, 5) ?? [];
  const today = days[0] ?? null;
  const rain = weather?.precipitationProbability ?? today?.precipitationProbabilityMax ?? null;

  return (
    <div id="carmo-live-panel" className="fixed inset-x-0 bottom-0 top-9 z-[70] overflow-y-auto border-t border-white/10 bg-[#171716] text-white shadow-pop md:absolute md:bottom-auto md:left-0 md:right-0 md:top-full md:z-[60] md:max-h-none md:overflow-visible md:bg-ink-900/98">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#171716]/95 px-3 py-2.5 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.12em] text-sun-200">Ao vivo</p>
            <p className="m-0 mt-0.5 text-[13px] font-semibold text-white/82">Clima, rotas e avisos de Carmo</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/14 bg-white/8 px-3 text-[12px] font-extrabold text-white transition hover:bg-white/14"
          >
            Recolher
            <ChevronDown size={14} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1440px] gap-3 px-3 py-3 sm:px-4 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <section className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-sun-200">Clima agora</p>
              <h2 className="m-0 mt-1 text-[18px] font-extrabold leading-tight">
                {weather ? `${formatTemp(weather.currentTemperature)} · ${labelForWeatherCode(weather.weatherCode)}` : 'Previsão em atualização'}
              </h2>
              <p className="m-0 mt-1 text-[13px] font-medium leading-relaxed text-white/78">
                {weatherSummary(weather)}
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-sky-500/20 text-sun-200">
              <CloudSun size={24} strokeWidth={1.9} aria-hidden="true" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <LiveMetric icon={ThermometerSun} label="Sensação" value={formatTemp(weather?.apparentTemperature ?? null)} />
            <LiveMetric icon={Umbrella} label="Chuva" value={formatPercent(rain)} />
            <LiveMetric icon={Wind} label="Vento" value={formatWind(weather?.windSpeed ?? null)} />
          </div>

          {days.length > 0 ? (
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {days.map((day, index) => (
                <div key={day.date} className="rounded-md bg-white/[0.07] px-2 py-2 text-center">
                  <p className="m-0 text-[10px] font-bold uppercase text-white/62">{index === 0 ? 'Hoje' : formatShortDay(day.date)}</p>
                  <p className="m-0 mt-1 text-[13px] font-extrabold">{formatTemp(day.temperatureMax)}</p>
                  <p className="m-0 text-[10px] font-semibold text-white/60">{formatPercent(day.precipitationProbabilityMax)}</p>
                </div>
              ))}
            </div>
          ) : null}

          <Link
            href="/servicos/clima"
            onClick={onClose}
            className="mt-3 inline-flex min-h-9 items-center justify-center rounded-md bg-white px-3 text-[12px] font-extrabold text-sky-700 hover:bg-paper-deep hover:text-sky-700 hover:no-underline"
          >
            Ver previsão completa
          </Link>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-sun-200">Rotas e alertas</p>
              <h2 className="m-0 mt-1 text-[18px] font-extrabold leading-tight">Saindo de Carmo agora</h2>
              <p className="m-0 mt-1 text-[13px] leading-snug text-white/68">
                Tempo estimado e motivo dos atrasos quando houver alerta na rota.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hidden rounded-md border border-white/12 px-2.5 py-1.5 text-[12px] font-bold text-white/82 transition hover:bg-white/10 hover:text-white md:inline-flex"
            >
              Fechar
            </button>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {trafficItems.length > 0 ? (
              trafficItems.map((item) => (
                <TrafficPanelItem key={item.id} item={item} />
              ))
            ) : (
              <p className="m-0 rounded-md bg-white/[0.07] p-3 text-[13px] font-medium text-white/72">
                Nenhum alerta de rota no momento. Volte mais tarde para conferir o trânsito.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function TrafficPanelItem({ item }: { item: LiveFeedItem }) {
  const payload = item.payload;
  const destination = readString(payload.destinationKey) ?? item.label.replace(':', '');
  const duration = readString(payload.durationText);
  const delay = readString(payload.delayText);
  const distance = readString(payload.distanceText);
  const alert = readRecord(payload.alert);
  const alertSummary = readString(alert?.summary);
  const status = trafficStatus(delay, alertSummary);
  const mapsUrl = readString(payload.mapsUrl) ?? item.href ?? '/servicos';
  const isRoute = Boolean(duration || delay || distance);

  if (!isRoute) {
    return (
      <article
        className="rounded-lg border border-sun-200/18 bg-sun-500/10 p-3 text-white transition hover:border-sun-200/28 hover:bg-sun-500/14"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-sun-100/78">
              Trecho em atenção
            </p>
            <h3 className="m-0 mt-1 text-[16px] font-extrabold leading-tight">{item.title}</h3>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sun-500/22 text-sun-100">
            <Route size={16} strokeWidth={2} aria-hidden="true" />
          </span>
        </div>
        <p className="m-0 mt-2 text-[12px] leading-snug text-white/72">
          {alertSummary ? `Aviso: ${alertSummary}` : 'Aviso pontual de estrada. Não é uma rota com tempo estimado.'}
        </p>
        <p className="m-0 mt-1 text-[11px] font-semibold text-white/48">
          Sem cálculo de atraso porque o alerta é sobre um trecho específico.
        </p>
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target={mapsUrl.startsWith('http') ? '_blank' : undefined}
            rel={mapsUrl.startsWith('http') ? 'noreferrer' : undefined}
            className="mt-3 inline-flex min-h-8 items-center justify-center rounded-md bg-white px-2.5 text-[11px] font-extrabold text-sky-700 hover:bg-paper-deep hover:text-sky-700 hover:no-underline"
          >
            Ver trecho
          </a>
        ) : null}
      </article>
    );
  }

  return (
    <article
      className="rounded-lg border border-white/10 bg-white/[0.07] p-3 text-white transition hover:border-white/20 hover:bg-white/[0.11]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-white/58">Rota para</p>
          <h3 className="m-0 mt-1 text-[17px] font-extrabold leading-tight">{destinationLabel(destination)}</h3>
          <p className="m-0 mt-1 line-clamp-2 text-[12px] font-semibold leading-snug text-white/68">{item.title}</p>
        </div>
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', item.tone === 'red' ? 'bg-red-500/20 text-red-100' : item.tone === 'sun' ? 'bg-sun-500/20 text-sun-100' : 'bg-green-500/18 text-green-100')}>
          {alertSummary ? <Route size={16} strokeWidth={2} aria-hidden="true" /> : <Navigation size={16} strokeWidth={2} aria-hidden="true" />}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-black/18 px-2.5 py-2">
          <p className="m-0 text-[10px] font-bold uppercase tracking-[0.06em] text-white/46">Tempo estimado</p>
          <p className="m-0 mt-0.5 text-[15px] font-extrabold text-white">{duration ?? 'Atualizando'}</p>
        </div>
        <div className={cn('rounded-md px-2.5 py-2', status.tone === 'warn' ? 'bg-sun-500/18' : status.tone === 'bad' ? 'bg-red-500/18' : 'bg-green-500/16')}>
          <p className="m-0 text-[10px] font-bold uppercase tracking-[0.06em] text-white/46">Atraso</p>
          <p className={cn('m-0 mt-0.5 text-[15px] font-extrabold', status.tone === 'warn' ? 'text-sun-100' : status.tone === 'bad' ? 'text-red-100' : 'text-green-100')}>
            {status.label}
          </p>
        </div>
      </div>
      <p className="m-0 mt-2 text-[12px] leading-snug text-white/68">
        {status.reason}
      </p>
      {distance ? <p className="m-0 mt-1 text-[11px] font-semibold text-white/44">{distance} de distância estimada</p> : null}
      <a
        href={mapsUrl}
        target={mapsUrl.startsWith('http') ? '_blank' : undefined}
        rel={mapsUrl.startsWith('http') ? 'noreferrer' : undefined}
        className="mt-3 inline-flex min-h-8 items-center justify-center rounded-md bg-white px-2.5 text-[11px] font-extrabold text-sky-700 hover:bg-paper-deep hover:text-sky-700 hover:no-underline"
      >
        Abrir no Maps
      </a>
    </article>
  );
}

function LiveMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.07] p-2">
      <div className="flex items-center gap-1.5 text-white/60">
        <Icon size={13} strokeWidth={2} aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase">{label}</span>
      </div>
      <p className="m-0 mt-1 text-[13px] font-extrabold text-white">{value}</p>
    </div>
  );
}

function formatNavWeather(weather: WeatherSnapshot | null): string {
  if (!weather) return 'Clima em atualização';
  return `${formatTemp(weather.currentTemperature)} · ${labelForWeatherCode(weather.weatherCode)}`;
}

function weatherSummary(weather: WeatherSnapshot | null): string {
  if (!weather) return 'Não rolou atualizar agora. O worker tenta de novo durante o dia.';
  const today = weather.daily[0] ?? null;
  const rain = weather.precipitationProbability ?? today?.precipitationProbabilityMax ?? 0;
  const max = today?.temperatureMax ?? weather.currentTemperature;
  if (rain >= 70) return 'Chance alta de chuva. Melhor sair com guarda-chuva e deixar margem nos horários.';
  if (rain >= 40) return 'Pode chover em algum momento. Bom conferir antes de varal, estrada ou evento ao ar livre.';
  if ((max ?? 0) >= 31) return 'Dia quente. Água por perto e sombra nas horas fortes ajudam bastante.';
  return 'Tempo sem sinal forte de extremo agora. Ainda vale conferir antes de viagem ou compromisso ao ar livre.';
}

function labelForWeatherCode(code: number | null): string {
  if (code === null) return 'Previsão disponível';
  if (code === 0) return 'Céu limpo';
  if (code === 1) return 'Poucas nuvens';
  if (code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if ([45, 48].includes(code)) return 'Neblina';
  if ([51, 53, 55].includes(code)) return 'Garoa';
  if ([61, 63, 65].includes(code)) return 'Chuva';
  if ([80, 81, 82].includes(code)) return 'Pancadas de chuva';
  return 'Tempo instável';
}

function formatTemp(value: number | null): string {
  return value === null ? '-' : `${Math.round(value)}°`;
}

function formatPercent(value: number | null): string {
  return value === null ? '-' : `${Math.round(value)}%`;
}

function formatWind(value: number | null): string {
  return value === null ? '-' : `${Math.round(value)} km/h`;
}

function formatShortDay(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' })
    .format(new Date(`${value}T12:00:00`))
    .replace('.', '');
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function trafficStatus(delay: string | null, alertSummary: string | null): { label: string; reason: string; tone: 'good' | 'warn' | 'bad' } {
  const minutes = delay ? Number(delay.match(/\d+/)?.[0] ?? 0) : 0;
  if (minutes > 0) {
    return {
      label: `+${minutes} min`,
      reason: alertSummary ? `Por quê: ${alertSummary}` : 'Trânsito um pouco mais lento que o normal neste trecho.',
      tone: minutes >= 15 ? 'bad' : 'warn',
    };
  }

  return {
    label: 'Sem atraso',
    reason: alertSummary ? `Atenção: ${alertSummary}` : 'Rota fluindo bem no momento.',
    tone: alertSummary ? 'warn' : 'good',
  };
}

function destinationLabel(value: string): string {
  const labels: Record<string, string> = {
    bh: 'Belo Horizonte',
    licinea: 'Licínea',
    alfenas: 'Alfenas',
    passos: 'Passos',
    guaxupe: 'Guaxupé',
    campinas: 'Campinas',
  };
  return labels[value] ?? value;
}

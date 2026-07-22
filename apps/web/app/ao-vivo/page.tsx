import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  CalendarDays,
  ExternalLink,
  Navigation,
  Newspaper,
  Radio,
  Route,
  Sparkles,
} from 'lucide-react';
import { Link } from '@/components/navigation/link';
import { AppFrame, AppHeader, Band, Divider } from '@/components/carmo';
import { getCurrentCity } from '@/lib/cities';
import { listLiveFeedItems, type LiveFeedItem } from '@/lib/live-feed/queries';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Ao vivo - Portal Carmelitano',
  description:
    'Atualizações ao vivo de Carmo do Rio Claro: rotas, alertas, notícias locais e comunicados importantes.',
};

type LiveKind = 'route' | 'road-alert' | 'news' | 'event' | 'service' | 'portal';

type DisplayItem = LiveFeedItem & {
  kind: LiveKind;
  duration: string | null;
  delayMinutes: number | null;
  distance: string | null;
  alertSummary: string | null;
  destination: string | null;
};

const kindConfig: Record<
  LiveKind,
  {
    label: string;
    icon: LucideIcon;
    shell: string;
    iconShell: string;
    eyebrow: string;
  }
> = {
  route: {
    label: 'Rota agora',
    icon: Navigation,
    shell: 'border-cerrado-100 bg-white',
    iconShell: 'bg-cerrado-100 text-cerrado-700',
    eyebrow: 'text-cerrado-700',
  },
  'road-alert': {
    label: 'Trecho em atenção',
    icon: Route,
    shell: 'border-sun-100 bg-sun-100',
    iconShell: 'bg-white text-clay-700',
    eyebrow: 'text-clay-700',
  },
  news: {
    label: 'Notícia local',
    icon: Newspaper,
    shell: 'border-sky-100 bg-white',
    iconShell: 'bg-sky-100 text-sky-700',
    eyebrow: 'text-sky-700',
  },
  event: {
    label: 'Agenda',
    icon: CalendarDays,
    shell: 'border-clay-200 bg-clay-50',
    iconShell: 'bg-clay-500 text-white',
    eyebrow: 'text-clay-700',
  },
  service: {
    label: 'Serviço público',
    icon: Bell,
    shell: 'border-ink-100 bg-white',
    iconShell: 'bg-paper-deep text-ink-700',
    eyebrow: 'text-ink-600',
  },
  portal: {
    label: 'Portal',
    icon: Sparkles,
    shell: 'border-cerrado-100 bg-cerrado-100/65',
    iconShell: 'bg-cerrado-700 text-white',
    eyebrow: 'text-cerrado-700',
  },
};

export default async function AoVivoPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const items = (await listLiveFeedItems(city.id, 24)).map(toDisplayItem);
  const routes = items.filter((item) => item.kind === 'route');
  const roadAlerts = items.filter((item) => item.kind === 'road-alert');
  const cityNews = items.filter((item) => !['route', 'road-alert'].includes(item.kind));
  const featured = items[0] ?? null;

  return (
    <AppFrame className="bg-paper text-ink-900">
      <AppHeader
        chips={[
          { label: 'Rotas', href: '#rotas' },
          { label: 'Trechos', href: '#trechos' },
          { label: 'Notícias', href: '#noticias' },
        ]}
        placeholder="Buscar atualização"
        searchHref="/ao-vivo"
      />

      <Band className="bg-paper px-3.5 pb-4 pt-4 md:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl border border-clay-200 bg-clay-500 p-4 shadow-banner md:p-6">
          <div className="pointer-events-none absolute -right-14 -top-16 size-44 rounded-full bg-sun-300/35 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-12 size-52 rounded-full bg-cerrado-700/18 blur-3xl" />
          <div className="relative">
            <p className="m-0 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white">
              <Radio size={13} strokeWidth={2.2} aria-hidden="true" />
              Ao vivo em {city.name}
            </p>
            <h1 className="font-display m-0 mt-3 max-w-3xl text-[34px] font-extrabold leading-none text-white md:text-[54px]">
              Agora na cidade
            </h1>
            <p className="m-0 mt-3 max-w-2xl text-[14px] font-semibold leading-relaxed text-white/82 md:text-[17px]">
              Uma central pronta para notícias rápidas, comunicados e alertas locais. Hoje ela já usa as rotas e trechos monitorados do portal.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 md:max-w-xl">
              <HeroMetric label="Rotas" value={routes.length} />
              <HeroMetric label="Trechos" value={roadAlerts.length} />
              <HeroMetric label="Ao vivo" value={items.length} />
            </div>
          </div>
        </section>
      </Band>

      {featured ? (
        <Band className="bg-paper px-3.5 pb-3 md:px-6 lg:px-8">
          <FeaturedLiveItem item={featured} />
        </Band>
      ) : null}

      <Divider className="bg-paper-deep" />

      <LiveSection
        id="rotas"
        kicker="Trânsito"
        title="Rotas agora"
        description="Destinos com tempo estimado e atraso calculado aparecem aqui."
        empty="Nenhuma rota com tempo estimado no momento."
      >
        {routes.map((item) => (
          <RouteCard key={item.id} item={item} />
        ))}
      </LiveSection>

      <LiveSection
        id="trechos"
        kicker="Estradas"
        title="Trechos em atenção"
        description="Alertas de trecho são avisos pontuais. Eles não viram card de destino nem mostram atraso estimado."
        empty="Nenhum trecho em atenção agora."
      >
        {roadAlerts.map((item) => (
          <RoadAlertCard key={item.id} item={item} />
        ))}
      </LiveSection>

      <LiveSection
        id="noticias"
        kicker="Próximo passo"
        title="Notícias da cidade"
        description="Este módulo já está preparado para receber notas rápidas de portais, Prefeitura, Câmara, eventos e parceiros locais."
        empty="As notícias locais rápidas entram aqui quando o módulo de fontes estiver conectado."
      >
        {cityNews.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </LiveSection>

      <div className="h-6 bg-paper" aria-hidden="true" />
    </AppFrame>
  );
}

function FeaturedLiveItem({ item }: { item: DisplayItem }) {
  const config = kindConfig[item.kind];
  const Icon = config.icon;

  return (
    <article className={cn('rounded-2xl border p-4 shadow-card', config.shell)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('m-0 text-[11px] font-extrabold uppercase tracking-[0.08em]', config.eyebrow)}>
            Destaque agora
          </p>
          <h2 className="m-0 mt-1 font-display text-[24px] font-extrabold leading-tight text-ink-900">
            {item.kind === 'route' && item.destination ? destinationLabel(item.destination) : item.title}
          </h2>
          <p className="m-0 mt-2 text-[13px] font-semibold leading-relaxed text-ink-700">
            {featuredDescription(item)}
          </p>
        </div>
        <span className={cn('grid size-11 shrink-0 place-items-center rounded-full', config.iconShell)}>
          <Icon size={21} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
      {item.href ? <LiveLink href={item.href} label="Abrir atualização" /> : null}
    </article>
  );
}

function LiveSection({
  id,
  kicker,
  title,
  description,
  empty,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  description: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <Band id={id} className="bg-paper px-3.5 py-4 md:px-6 lg:px-8">
      <section>
        <div className="mb-3">
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.08em] text-clay-700">{kicker}</p>
          <h2 className="m-0 mt-1 font-display text-[24px] font-extrabold leading-tight text-ink-900">{title}</h2>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-ink-600">{description}</p>
        </div>
        {children.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
        ) : (
          <p className="m-0 rounded-xl border border-ink-100 bg-white p-4 text-[13px] font-semibold text-ink-600 shadow-card">
            {empty}
          </p>
        )}
      </section>
    </Band>
  );
}

function RouteCard({ item }: { item: DisplayItem }) {
  const status = routeStatus(item.delayMinutes);

  return (
    <article className="rounded-2xl border border-cerrado-100 bg-white p-4 text-ink-900 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.08em] text-cerrado-700">Rota para</p>
          <h3 className="m-0 mt-1 text-[21px] font-extrabold leading-tight">
            {destinationLabel(item.destination ?? item.label)}
          </h3>
          <p className="m-0 mt-1 line-clamp-2 text-[12px] font-semibold leading-snug text-ink-600">{item.title}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cerrado-100 text-cerrado-700">
          <Navigation size={18} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MetricBox label="Tempo" value={item.duration ?? 'Atualizando'} />
        <MetricBox label="Atraso" value={status.label} tone={status.tone} />
      </div>
      <p className="m-0 mt-2 text-[12px] leading-snug text-ink-700">{status.text}</p>
      {item.distance ? <p className="m-0 mt-1 text-[11px] font-semibold text-ink-400">{item.distance} de distância estimada</p> : null}
      {item.href ? <LiveLink href={item.href} label="Abrir no Maps" /> : null}
    </article>
  );
}

function RoadAlertCard({ item }: { item: DisplayItem }) {
  return (
    <article className="rounded-2xl border border-sun-100 bg-sun-100 p-4 text-ink-900 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.08em] text-clay-700">
            Trecho em atenção
          </p>
          <h3 className="m-0 mt-1 text-[18px] font-extrabold leading-tight">{item.title}</h3>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-clay-700">
          <Route size={18} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
      <p className="m-0 mt-2 text-[12px] leading-snug text-ink-700">
        {item.alertSummary ? `Aviso: ${item.alertSummary}` : 'Aviso pontual de estrada.'}
      </p>
      <p className="m-0 mt-1 text-[11px] font-semibold text-ink-400">
        Sem cálculo de atraso porque não é uma rota com destino.
      </p>
      {item.href ? <LiveLink href={item.href} label="Ver trecho" /> : null}
    </article>
  );
}

function NewsCard({ item }: { item: DisplayItem }) {
  const config = kindConfig[item.kind];
  const Icon = config.icon;

  return (
    <article className={cn('rounded-2xl border p-4 text-ink-900 shadow-card', config.shell)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn('m-0 text-[11px] font-extrabold uppercase tracking-[0.08em]', config.eyebrow)}>
            {config.label}
          </p>
          <h3 className="m-0 mt-1 text-[18px] font-extrabold leading-tight">{item.title}</h3>
          {item.suffix ? <p className="m-0 mt-1 text-[12px] font-semibold text-ink-600">{item.suffix}</p> : null}
        </div>
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', config.iconShell)}>
          <Icon size={18} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
      {item.href ? <LiveLink href={item.href} label="Ler mais" /> : null}
    </article>
  );
}

function HeroMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/12 px-3 py-2">
      <p className="m-0 text-[10px] font-bold uppercase tracking-[0.06em] text-white/58">{label}</p>
      <p className="m-0 mt-0.5 text-[21px] font-extrabold text-white">{value}</p>
    </div>
  );
}

function MetricBox({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  return (
    <div
      className={cn(
        'rounded-xl px-3 py-2',
        tone === 'good' && 'bg-cerrado-100',
        tone === 'warn' && 'bg-sun-100',
        tone === 'bad' && 'bg-red-50',
        tone === 'neutral' && 'bg-paper-deep',
      )}
    >
      <p className="m-0 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-600">{label}</p>
      <p className="m-0 mt-0.5 text-[16px] font-extrabold text-ink-900">{value}</p>
    </div>
  );
}

function LiveLink({ href, label }: { href: string; label: string }) {
  const external = href.startsWith('http');
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ink-900 px-3 text-[12px] font-extrabold text-white hover:bg-black hover:text-white hover:no-underline"
    >
      {label}
      <ExternalLink size={13} strokeWidth={2} aria-hidden="true" />
    </Link>
  );
}

function toDisplayItem(item: LiveFeedItem): DisplayItem {
  const duration = readString(item.payload.durationText);
  const delay = readString(item.payload.delayText);
  const distance = readString(item.payload.distanceText);
  const alert = readRecord(item.payload.alert);
  const destination = readString(item.payload.destinationKey);
  const delayMinutes = delay ? Number(delay.match(/\d+/)?.[0] ?? 0) : null;

  return {
    ...item,
    kind: classifyItem(item, Boolean(duration || delay || distance)),
    duration,
    delayMinutes,
    distance,
    alertSummary: readString(alert?.summary),
    destination,
  };
}

function classifyItem(item: LiveFeedItem, hasRouteMetrics: boolean): LiveKind {
  if (item.sourceKind === 'traffic') return hasRouteMetrics ? 'route' : 'road-alert';
  if (item.sourceKind === 'event') return 'event';
  if (item.sourceKind === 'service' || item.sourceKind === 'utility') return 'service';
  if (item.sourceKind === 'news') return 'news';
  return 'portal';
}

function routeStatus(delayMinutes: number | null): { label: string; text: string; tone: 'good' | 'warn' | 'bad' } {
  if (!delayMinutes) {
    return { label: 'Sem atraso', text: 'Rota fluindo bem no momento.', tone: 'good' };
  }

  return {
    label: `+${delayMinutes} min`,
    text: delayMinutes >= 15 ? 'Saia com mais folga: a rota está mais lenta que o normal.' : 'Trânsito um pouco mais lento que o normal neste trecho.',
    tone: delayMinutes >= 15 ? 'bad' : 'warn',
  };
}

function featuredDescription(item: DisplayItem): string {
  if (item.kind === 'route') {
    const delay = routeStatus(item.delayMinutes);
    return `${item.duration ?? 'Tempo em atualização'} · ${delay.label}. ${delay.text}`;
  }
  if (item.kind === 'road-alert') {
    return item.alertSummary ? `Aviso de trecho: ${item.alertSummary}` : 'Alerta de trecho ativo na região.';
  }
  return item.suffix ?? 'Atualização rápida publicada no portal.';
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function destinationLabel(value: string): string {
  const labels: Record<string, string> = {
    bh: 'Belo Horizonte',
    licinea: 'Licínea',
    alfenas: 'Alfenas',
    passos: 'Passos',
    guaxupe: 'Guaxupé',
    campinas: 'Campinas',
    local: 'Região de Carmo',
  };
  return labels[value] ?? value;
}

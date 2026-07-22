'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, startTransition, type ReactNode } from 'react';
import {
  MapPin,
  Clock,
  Phone,
  Camera,
  MessageCircle,
  Calendar,
  Newspaper,
  AlertCircle,
  Search,
  Anchor,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Church,
  ExternalLink,
  Info,
  Navigation,
  Recycle,
  Sparkles,
  Trash2,
  Wallet,
  Wrench,
} from 'lucide-react';
import type {
  AgentBlock,
  ChurchResultItem,
  EventItem,
  FaqItem,
  FerryResultItem,
  GarbageScheduleItem,
  NewsItem,
  SearchResultItem,
} from '@/lib/ai/city-agent-client';

type Props = {
  blocks: AgentBlock[];
  /** No chat: cada bloco (e cada parte do ferry) vira bolha branca separada, fora de um único card. */
  stackedAssistantBubbles?: boolean;
  className?: string;
  animateText?: boolean;
};

const ASSISTANT_OUTER_BUBBLE =
  'rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-[15px] leading-snug text-[#111b21] shadow-sm';

function formatPtBrShort(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
  }).format(d);
}

function formatPtBrDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

function assertNeverAgentBlock(value: never): null {
  void value;
  return null;
}

const WEEKDAY_SHORT_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const WEEKDAY_LONG_LABELS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];
const GARBAGE_TYPE_LABELS: Record<string, string> = {
  common: 'Lixo comum',
  organic: 'Lixo úmido / orgânico',
  recyclable: 'Lixo seco / reciclável',
  electronic: 'Eletrônicos',
  special: 'Coleta especial',
};
const TRADITION_LABELS: Record<string, string> = {
  catolica: 'Católica',
  evangelica: 'Evangélica',
  adventista: 'Adventista',
  outra: 'Outra',
};

function parseChurchItemsFromText(text: string): ChurchResultItem[] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('[')) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) return null;

    const items = parsed
      .map((item): ChurchResultItem | null => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
        const record = item as Record<string, unknown>;
        const id = typeof record.id === 'string' ? record.id : null;
        const name = typeof record.name === 'string' ? record.name : null;
        const tradition = typeof record.tradition === 'string' ? record.tradition : null;
        if (!id || !name || !tradition) return null;

        const weeklySchedule = Array.isArray(record.weekly_schedule)
          ? record.weekly_schedule
              .map((schedule) => {
                if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) {
                  return null;
                }
                const scheduleRecord = schedule as Record<string, unknown>;
                const churchId =
                  typeof scheduleRecord.church_id === 'string' ? scheduleRecord.church_id : null;
                const weekday =
                  typeof scheduleRecord.weekday === 'number' ? scheduleRecord.weekday : null;
                const startsAt =
                  typeof scheduleRecord.starts_at === 'string' ? scheduleRecord.starts_at : null;
                const title =
                  typeof scheduleRecord.title === 'string' ? scheduleRecord.title : null;
                if (!churchId || weekday === null || !startsAt || !title) return null;
                return {
                  church_id: churchId,
                  weekday,
                  starts_at: startsAt,
                  ends_at:
                    typeof scheduleRecord.ends_at === 'string' ? scheduleRecord.ends_at : null,
                  title,
                  note: typeof scheduleRecord.note === 'string' ? scheduleRecord.note : null,
                  source_status:
                    typeof scheduleRecord.source_status === 'string'
                      ? scheduleRecord.source_status
                      : 'needs_verification',
                  is_today: scheduleRecord.is_today === true,
                };
              })
              .filter(
                (schedule): schedule is ChurchResultItem['weekly_schedule'][number] =>
                  schedule !== null,
              )
          : [];

        return {
          id,
          name,
          tradition,
          address: typeof record.address === 'string' ? record.address : null,
          phone: typeof record.phone === 'string' ? record.phone : null,
          whatsapp: typeof record.whatsapp === 'string' ? record.whatsapp : null,
          weekly_schedule: weeklySchedule,
          has_today: record.has_today === true,
        };
      })
      .filter((item): item is ChurchResultItem => item !== null);

    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

function parseGarbageScheduleItemsFromText(text: string): GarbageScheduleItem[] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) return null;

    const items = parsed
      .map((item): GarbageScheduleItem | null => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
        const record = item as Record<string, unknown>;
        const dayOfWeek = typeof record.day_of_week === 'number' ? record.day_of_week : null;
        if (dayOfWeek === null) return null;

        const districtsValue = record.districts;
        const districts = Array.isArray(districtsValue)
          ? districtsValue
              .map((district) => {
                if (!district || typeof district !== 'object' || Array.isArray(district)) {
                  return null;
                }
                const name = (district as Record<string, unknown>).name;
                return typeof name === 'string' && name.trim() ? { name: name.trim() } : null;
              })
              .filter((district): district is { name: string } => district !== null)
          : districtsValue && typeof districtsValue === 'object'
            ? (() => {
                const name = (districtsValue as Record<string, unknown>).name;
                return typeof name === 'string' && name.trim() ? [{ name: name.trim() }] : [];
              })()
            : [];

        return {
          day_of_week: dayOfWeek,
          type: typeof record.type === 'string' && record.type.trim() ? record.type : 'common',
          start_time:
            typeof record.start_time === 'string' && record.start_time.trim()
              ? record.start_time
              : null,
          end_time:
            typeof record.end_time === 'string' && record.end_time.trim()
              ? record.end_time
              : null,
          notes: typeof record.notes === 'string' && record.notes.trim() ? record.notes : null,
          districts,
        };
      })
      .filter((item): item is GarbageScheduleItem => item !== null);

    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

function formatScheduleTime(time: string): string {
  return time.slice(0, 5);
}

/** Tarifa numérica vinda da API (às vezes string ou ausente); evita `R$ NaN` no UI. */
function formatBrlFromFare(fare: unknown): string | null {
  if (fare === null || fare === undefined) return null;
  if (typeof fare === 'string' && fare.trim() === '') return null;
  const n = typeof fare === 'number' ? fare : Number(fare);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const FERRY_STATUS_LABEL: Record<string, string> = {
  active: 'Ativa',
  inactive: 'Inativa',
  suspended: 'Suspensa',
  maintenance: 'Manutenção',
  ACTIVE_CHECK_BEFORE_GO: 'Ativa — confira no local',
};

function ferryStatusDisplayLabel(status: string): string {
  const normalized = status.trim().toLowerCase().replace(/-/g, '_');
  if (FERRY_STATUS_LABEL[status]) return FERRY_STATUS_LABEL[status];
  if (FERRY_STATUS_LABEL[normalized]) return FERRY_STATUS_LABEL[normalized];
  if (normalized === 'active_check_before_go' || normalized === 'active check before go') {
    return 'Confira antes de ir';
  }
  return normalized.replace(/_/g, ' ');
}

function isFerryStatusActive(status: string): boolean {
  return status.trim().toLowerCase().startsWith('active');
}

/** Quebra texto em frases curtas para exibir como “mensagens” em sequência (newline explícito ou após . ! ?). */
function splitProseIntoChatChunks(text: string | null | undefined): string[] {
  if (text == null) return [];
  const t = text.trim();
  if (!t) return [];
  if (/\n/.test(t)) {
    return t
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return t
    .split(/(?<=[.!?])\s+(?=[\p{Lu}])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

const FERRY_ALERT_ICON_CLASS: Record<string, string> = {
  info: 'text-sky-600',
  warning: 'text-amber-600',
  maintenance: 'text-zinc-600',
  event: 'text-violet-600',
  safety: 'text-rose-600',
};

const FERRY_TIP_ROW =
  'flex gap-2.5 py-0.5 text-[14px] leading-snug text-[#111b21] [&_.text-muted-foreground]:text-[#667781]';

/** Quantos horários exibir por sentido no widget (a partir da próxima saída). */
const FERRY_SCHEDULE_VISIBLE_COUNT = 5;

function ferryAlertIcon(type: string) {
  const t = type.trim().toLowerCase();
  if (t === 'info') return Info;
  if (t === 'maintenance') return Wrench;
  if (t === 'event') return Sparkles;
  if (t === 'safety') return AlertCircle;
  return AlertTriangle;
}

function getSaoPauloMinutesNow(): number {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return (hour % 24) * 60 + minute;
}

function FerryScheduleMain({
  ferry,
  insideAssistantBubble,
}: {
  ferry: FerryResultItem;
  /** Sem borda/padding extra: a bolha branca do chat já é o “card”. */
  insideAssistantBubble?: boolean;
}) {
  const curMinutes = getSaoPauloMinutesNow();
  const schedules =
    ferry.schedules_by_direction && typeof ferry.schedules_by_direction === 'object'
      ? ferry.schedules_by_direction
      : {};
  const detailHref =
    typeof ferry.public_url === 'string' && ferry.public_url.startsWith('/')
      ? ferry.public_url
      : '/servicos/balsas';

  function timeToMinutes(time: string): number {
    const [h = 0, m = 0] = time.split(':').map(Number);
    return h * 60 + m;
  }

  function minutesUntil(depMinutes: number): number {
    return depMinutes - curMinutes;
  }

  function formatCountdown(depMinutes: number): string {
    const diff = minutesUntil(depMinutes);
    if (diff <= 0) return 'Em instantes';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0) return `em ${h}h${m > 0 ? ` ${m}min` : ''}`;
    return `em ${m}min`;
  }

  const outerShell = insideAssistantBubble
    ? 'space-y-3'
    : 'bg-card space-y-3 rounded-2xl border p-3 sm:p-4';
  const directionShell = insideAssistantBubble
    ? 'space-y-2 border-b border-[#e9edef] pb-3 last:border-b-0 last:pb-0'
    : 'bg-background space-y-2 rounded-xl border p-2.5 sm:p-3';

  return (
    <div className={outerShell}>
      <div className="flex items-start gap-2">
        <Anchor size={18} className="text-primary shrink-0" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <p className="m-0 min-w-0 text-sm font-semibold leading-tight">{ferry.name}</p>
            {ferry.status && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${
                  isFerryStatusActive(ferry.status)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isFerryStatusActive(ferry.status) ? (
                  <CheckCircle2 size={11} aria-hidden="true" />
                ) : (
                  <AlertTriangle size={11} aria-hidden="true" />
                )}
                {ferryStatusDisplayLabel(ferry.status)}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-xs">{ferry.endpoints}</p>
        </div>
      </div>

      {Object.entries(schedules).map(([direction, rawTimes]) => {
        const times = Array.isArray(rawTimes) ? rawTimes : [];
        const nextTime = times.find((t) => t.isNext);
        const nextIdx = times.findIndex((t) => t.isNext);
        const hasUpcomingToday = nextIdx >= 0;
        const displayTimes = hasUpcomingToday
          ? times.slice(nextIdx, nextIdx + FERRY_SCHEDULE_VISIBLE_COUNT)
          : times.length > 0
            ? times.slice(-Math.min(FERRY_SCHEDULE_VISIBLE_COUNT, times.length))
            : [];

        return (
          <div key={direction} className={directionShell}>
            <div className="flex flex-wrap items-start justify-between gap-1.5">
              <span className="text-muted-foreground min-w-0 text-xs font-medium uppercase tracking-wide">
                {direction}
              </span>
              {nextTime && typeof nextTime.time === 'string' && (
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold leading-tight text-green-600">
                  PRÓXIMA {formatCountdown(timeToMinutes(nextTime.time))}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {displayTimes.map((t, i) => (
                <span
                  key={`${direction}-${t.time}-${i}`}
                  className={`inline-flex items-center gap-0.5 rounded-lg border px-2.5 py-1 font-mono text-sm ${
                    t.isNext
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : hasUpcomingToday
                        ? 'border-border font-medium text-[#111b21]'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {t.time}
                  {t.isNext && <ArrowRight size={12} className="text-primary" />}
                </span>
              ))}
              {times.length > displayTimes.length && (
                <span className="text-muted-foreground ml-1 self-center text-xs">
                  +{times.length - displayTimes.length} horários
                </span>
              )}
            </div>
          </div>
        );
      })}

      <Link
        href={detailHref}
        className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
      >
        <Navigation size={14} />
        Ver horários completos
        <ArrowRight size={14} className="ml-0.5" />
      </Link>
    </div>
  );
}

function ferryTipsNodes(
  ferry: FerryResultItem,
  ferryIdx: number,
  options: { includeFareDetails?: boolean } = {},
): ReactNode[] {
  const includeFareDetails = options.includeFareDetails ?? true;
  const fareFormatted = includeFareDetails ? formatBrlFromFare(ferry.fare) : null;
  const summaryChunks = includeFareDetails ? splitProseIntoChatChunks(ferry.fare_summary) : [];
  const warningChunks = includeFareDetails ? splitProseIntoChatChunks(ferry.fare_warning) : [];
  const alerts = Array.isArray(ferry.alerts) ? ferry.alerts : [];
  const id = ferry.slug || `ferry-${ferryIdx}`;
  const nodes: ReactNode[] = [];
  const iconSlot = 'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center';

  if (fareFormatted) {
    nodes.push(
      <div key={`${id}-fare-num`} className={FERRY_TIP_ROW}>
        <Wallet size={16} className={`${iconSlot} text-[#008069]`} aria-hidden="true" />
        <p className="m-0 font-semibold tabular-nums">{fareFormatted}</p>
      </div>,
    );
  }

  summaryChunks.forEach((chunk, i) => {
    const leadIcon = !fareFormatted && i === 0;
    nodes.push(
      <div key={`${id}-sum-${i}`} className={FERRY_TIP_ROW}>
        {leadIcon ? (
          <Wallet size={16} className={`${iconSlot} text-[#008069]`} aria-hidden="true" />
        ) : (
          <span className={`${iconSlot}`} aria-hidden />
        )}
        <p className="m-0">{chunk}</p>
      </div>,
    );
  });

  warningChunks.forEach((chunk, i) => {
    nodes.push(
      <div key={`${id}-warn-${i}`} className={FERRY_TIP_ROW}>
        <Info size={16} className={`${iconSlot} text-amber-600`} aria-hidden="true" />
        <p className="m-0">{chunk}</p>
      </div>,
    );
  });

  alerts.forEach((alert, i) => {
    const toneKey = alert.type.trim().toLowerCase();
    const iconTone = FERRY_ALERT_ICON_CLASS[toneKey] ?? FERRY_ALERT_ICON_CLASS.warning;
    const IconComp = ferryAlertIcon(alert.type);
    nodes.push(
      <div key={`${id}-alert-${i}`} className={FERRY_TIP_ROW}>
        <IconComp size={16} className={`${iconSlot} ${iconTone}`} aria-hidden="true" />
        <div className="min-w-0">
          <p className="m-0 font-semibold">{alert.title}</p>
          <p className="m-0 mt-0.5 font-normal">{alert.message}</p>
        </div>
      </div>,
    );
  });

  return nodes;
}

function buildFerryStackedAssistantContents(items: FerryResultItem[]): ReactNode[] {
  return items.flatMap((ferry, ferryIdx) => {
    const id = ferry.slug || `ferry-${ferryIdx}`;
    return [
      <FerryScheduleMain key={`${id}-sched`} ferry={ferry} insideAssistantBubble />,
      ...ferryTipsNodes(ferry, ferryIdx, { includeFareDetails: false }),
    ];
  });
}

function FerryScheduleWidget({ items }: { items: FerryResultItem[] }) {
  if (!items.length) return null;

  return (
    <div className="space-y-4">
      {items.map((ferry, ferryIdx) => {
        const id = ferry.slug || `ferry-${ferryIdx}`;
        return (
          <div key={id} className="space-y-2">
            <FerryScheduleMain ferry={ferry} />
            {ferryTipsNodes(ferry, ferryIdx)}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  const listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    result.push(
      <ul key={`ul-${result.length}`} className="my-1 space-y-0.5 pl-4">
        {listBuffer.map((item, i) => (
          <li key={i} className="list-disc leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </ul>,
    );
    listBuffer.length = 0;
  };

  lines.forEach((line, i) => {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1]!.length;
      const headingText = headingMatch[2]!;
      if (level === 1) {
        result.push(
          <h2 key={`h-${i}`} className="text-lg font-bold">
            {renderInline(headingText)}
          </h2>,
        );
      } else if (level === 2) {
        result.push(
          <h3 key={`h-${i}`} className="text-base font-semibold">
            {renderInline(headingText)}
          </h3>,
        );
      } else {
        result.push(
          <h4 key={`h-${i}`} className="text-sm font-semibold">
            {renderInline(headingText)}
          </h4>,
        );
      }
      return;
    }

    const listMatch = line.match(/^[-*•] (.+)/);
    if (listMatch) {
      listBuffer.push(listMatch[1]!);
      return;
    }

    flushList();

    if (line.trim() === '') {
      if (i > 0 && lines[i - 1]?.trim() !== '') {
        result.push(<br key={`br-${i}`} />);
      }
      return;
    }

    result.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {renderInline(line)}
      </p>,
    );
  });

  flushList();

  return <div className="space-y-1">{result}</div>;
}

function TypewriterMarkdown({ text, enabled }: { text: string; enabled: boolean }) {
  const [visibleText, setVisibleText] = useState(enabled ? '' : text);

  useEffect(() => {
    if (!enabled) {
      startTransition(() => {
        setVisibleText(text);
      });
      return;
    }

    startTransition(() => {
      setVisibleText('');
    });
    let index = 0;
    let timeoutId: number | undefined;
    const step = () => {
      index = Math.min(text.length, index + 3);
      setVisibleText(text.slice(0, index));
      if (index < text.length) timeoutId = window.setTimeout(step, 14);
    };
    timeoutId = window.setTimeout(step, 80);
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [enabled, text]);

  return (
    <div>
      <SimpleMarkdown text={visibleText} />
      {enabled && visibleText.length < text.length ? (
        <span className="ml-0.5 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-sm bg-[#008069]" />
      ) : null}
    </div>
  );
}

function FaqItemsBlock({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-background space-y-1 rounded-xl border p-3">
          <p className="text-foreground text-sm font-semibold">{item.question}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">{item.answer}</p>
        </div>
      ))}
    </div>
  );
}

function NewsItemsBlock({ items }: { items: NewsItem[] }) {
  return (
    <div className="space-y-2">
      <p className="text-foreground flex items-center gap-1.5 text-sm font-medium">
        <Newspaper size={14} className="shrink-0" />
        Notícias
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const publishedLabel = formatPtBrShort(item.published_at);
          return (
            <div
              key={i}
              className="bg-background flex gap-3 rounded-xl border p-3 text-sm shadow-sm"
            >
              {item.cover_url ? (
                <Image
                  src={item.cover_url}
                  alt={item.title}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{item.title}</p>
                {item.excerpt && (
                  <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                    {item.excerpt}
                  </p>
                )}
                {publishedLabel && (
                  <p className="text-muted-foreground mt-1 text-[10px]">{publishedLabel}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventItemsBlock({ items }: { items: EventItem[] }) {
  return (
    <div className="space-y-2">
      <p className="text-foreground flex items-center gap-1.5 text-sm font-medium">
        <Calendar size={14} className="shrink-0" />
        Eventos
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const href = item.slug ? `/comunidade/agenda/${item.slug}` : '#';
          const when = formatPtBrDateTime(item.starts_at ?? null);
          const inner = (
            <>
              {item.cover_url ? (
                <Image
                  src={item.cover_url}
                  alt={item.title}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                  <Calendar size={18} className="text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{item.title}</p>
                {when && <p className="text-muted-foreground mt-0.5 text-xs">{when}</p>}
                {item.location && (
                  <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                    {item.location}
                  </p>
                )}
              </div>
            </>
          );
          return item.slug ? (
            <Link
              key={i}
              href={href}
              className="bg-background hover:bg-muted group flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={i}
              className="bg-background flex items-center gap-3 rounded-xl border p-3 text-sm"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatGarbageTime(item: GarbageScheduleItem): string {
  const start = item.start_time?.slice(0, 5) ?? null;
  const end = item.end_time?.slice(0, 5) ?? null;
  if (start || end) return [start, end].filter(Boolean).join(' às ');

  const notes = item.notes?.toLowerCase() ?? '';
  if (notes.includes('antes do almoço')) return 'Antes do almoço';
  if (notes.includes('noite')) return 'À noite';
  return 'Horário não informado';
}

function GarbageScheduleBlock({ items }: { items: GarbageScheduleItem[] }) {
  if (!items.length) return null;

  const visibleItems = items
    .slice()
    .sort((a, b) => a.day_of_week - b.day_of_week || a.type.localeCompare(b.type));

  return (
    <div className="space-y-2">
      <p className="text-foreground flex items-center gap-1.5 text-sm font-medium">
        <Trash2 size={14} className="shrink-0" />
        Coleta de lixo
      </p>
      <div className="flex flex-col gap-2">
        {visibleItems.map((item, i) => {
          const Icon = item.type === 'recyclable' ? Recycle : Trash2;
          const districtNames = item.districts.map((district) => district.name).filter(Boolean);
          const visibleDistricts = districtNames.slice(0, 10);
          const remainingDistricts = Math.max(0, districtNames.length - visibleDistricts.length);

          return (
            <div
              key={`${item.day_of_week}-${item.type}-${i}`}
              className="bg-background rounded-xl border p-3 text-sm shadow-sm"
            >
              <div className="flex items-start gap-2">
                <div className="bg-primary/10 text-primary mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon size={17} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-semibold leading-tight">
                    {WEEKDAY_LONG_LABELS[item.day_of_week] ?? 'Dia'} ·{' '}
                    {GARBAGE_TYPE_LABELS[item.type] ?? item.type}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {formatGarbageTime(item)}
                  </p>
                </div>
              </div>

              {visibleDistricts.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {visibleDistricts.map((name) => (
                    <span
                      key={name}
                      className="border-border text-foreground rounded-lg border px-2 py-1 text-xs font-medium"
                    >
                      {name}
                    </span>
                  ))}
                  {remainingDistricts > 0 ? (
                    <span className="text-muted-foreground self-center text-xs">
                      +{remainingDistricts} bairros
                    </span>
                  ) : null}
                </div>
              ) : null}

              {item.notes ? (
                <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-relaxed">
                  {item.notes}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChurchItemsBlock({ items }: { items: ChurchResultItem[] }) {
  return (
    <div className="space-y-2">
      <p className="text-foreground flex items-center gap-1.5 text-sm font-medium">
        <Church size={14} className="shrink-0" />
        Igrejas e cultos
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const todayItems = item.weekly_schedule.filter((schedule) => schedule.is_today);
          const visibleSchedule = (todayItems.length > 0 ? todayItems : item.weekly_schedule).slice(
            0,
            3,
          );

          return (
            <div key={item.id} className="bg-background rounded-xl border p-3 text-sm shadow-sm">
              <div className="flex items-start gap-2">
                <div className="bg-primary/10 text-primary mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Church size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="m-0 font-semibold leading-tight">{item.name}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase leading-none text-emerald-700">
                      {TRADITION_LABELS[item.tradition] ?? item.tradition}
                    </span>
                  </div>
                  {item.address ? (
                    <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                      {item.address}
                    </p>
                  ) : null}
                </div>
              </div>

              {visibleSchedule.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {visibleSchedule.map((schedule, index) => (
                    <span
                      key={`${item.id}-${schedule.weekday}-${schedule.starts_at}-${index}`}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${
                        schedule.is_today
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-foreground'
                      }`}
                    >
                      <span>{WEEKDAY_SHORT_LABELS[schedule.weekday] ?? 'Dia'}</span>
                      <span className="font-mono font-semibold">
                        {formatScheduleTime(schedule.starts_at)}
                      </span>
                      <span>{schedule.title}</span>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {item.phone ? (
                  <a
                    href={`tel:${item.phone.replace(/\D/g, '')}`}
                    className="bg-muted hover:bg-muted/70 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                  >
                    <Phone size={13} />
                    Ligar
                  </a>
                ) : null}
                {item.whatsapp ? (
                  <a
                    href={`https://wa.me/55${item.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700"
                  >
                    <MessageCircle size={13} />
                    WhatsApp
                  </a>
                ) : null}
                <Link
                  href="/comunidade/igrejas"
                  className="text-primary bg-primary/10 hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                >
                  Ver guia
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AgentResponseRenderer({ blocks, stackedAssistantBubbles, className, animateText }: Props) {
  if (stackedAssistantBubbles) {
    return (
      <div className={`flex w-full flex-col gap-2 ${className ?? ''}`}>
        {blocks.flatMap((block, i) => {
          if (block.type === 'ferry') {
            const items = Array.isArray(block.items) ? block.items : [];
            return buildFerryStackedAssistantContents(items).map((inner, j) => (
              <div key={`ferry-${i}-${j}`} className={ASSISTANT_OUTER_BUBBLE}>
                {inner}
              </div>
            ));
          }
          return (
            <div key={i} className={ASSISTANT_OUTER_BUBBLE}>
              <BlockRenderer block={block} animateText={Boolean(animateText)} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} animateText={Boolean(animateText)} />
      ))}
    </div>
  );
}

function BlockRenderer({ block, animateText }: { block: AgentBlock; animateText?: boolean }) {
  switch (block.type) {
    case 'text':
      {
        const churchItems = parseChurchItemsFromText(block.text);
        if (churchItems) return <ChurchItemsBlock items={churchItems} />;
        const garbageItems = parseGarbageScheduleItemsFromText(block.text);
        if (garbageItems) return <GarbageScheduleBlock items={garbageItems} />;
      }
      return <TypewriterMarkdown text={block.text} enabled={Boolean(animateText)} />;

    case 'fallback':
      return (
        <div className="text-muted-foreground flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <TypewriterMarkdown text={block.text} enabled={Boolean(animateText)} />
        </div>
      );

    case 'search_results':
      return (
        <div className="space-y-2">
          <p className="text-foreground text-sm font-medium">Encontrei estas opções:</p>
          <div className="flex flex-col gap-2">
            {block.items.map((item) => (
              <SearchResultCard key={item.entity_id} item={item} />
            ))}
          </div>
        </div>
      );

    case 'entity_hours':
      return <EntityHoursCard block={block} />;

    case 'entity_details':
      return <EntityDetailsCard block={block} />;

    case 'ferry':
      return <FerryScheduleWidget items={Array.isArray(block.items) ? block.items : []} />;

    case 'faq':
      return <FaqItemsBlock items={block.items} />;

    case 'news':
      return <NewsItemsBlock items={block.items} />;

    case 'events':
      return <EventItemsBlock items={block.items} />;

    case 'garbage_schedule':
      return <GarbageScheduleBlock items={block.items} />;

    case 'churches':
      return <ChurchItemsBlock items={block.items} />;

    default:
      return assertNeverAgentBlock(block);
  }
}

function SearchResultCard({ item }: { item: SearchResultItem }) {
  return (
    <Link
      href={item.url ?? '#'}
      target="_blank"
      className="bg-background hover:bg-muted group flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors"
    >
      {item.cover_url ? (
        <Image
          src={item.cover_url}
          alt={item.name}
          width={48}
          height={48}
          unoptimized
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
          <Search size={18} className="text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
      </div>
    </Link>
  );
}

function EntityHoursCard({ block }: { block: AgentBlock & { type: 'entity_hours' } }) {
  const { entity, is_open_now, hours, status_label } = block;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin size={16} className="text-primary" />
        <Link href={entity.url ?? '#'} target="_blank" className="font-medium hover:underline">
          {entity.name}
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Clock
          size={16}
          className={
            is_open_now === true
              ? 'text-green-500'
              : is_open_now === false
                ? 'text-red-500'
                : 'text-muted-foreground'
          }
        />
        <span
          className={`text-sm font-medium ${is_open_now === true ? 'text-green-600' : is_open_now === false ? 'text-red-600' : 'text-muted-foreground'}`}
        >
          {status_label}
        </span>
      </div>

      <div className="bg-background space-y-1.5 rounded-xl border p-3">
        {hours.map((h, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{h.label.split(':')[0]}</span>
            <span className="font-medium">
              {h.starts_at ?? '--:--'} – {h.ends_at ?? '--:--'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EntityDetailsCard({ block }: { block: AgentBlock & { type: 'entity_details' } }) {
  const { entity, phone, whatsapp, address, instagram } = block;

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 font-medium">
        <MapPin size={16} className="text-primary" />
        <Link href={entity.url ?? '#'} target="_blank" className="hover:underline">
          {entity.name}
        </Link>
      </p>

      <div className="bg-background space-y-2 rounded-xl border p-3">
        {phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone size={14} className="text-muted-foreground shrink-0" />
            <span>{phone}</span>
          </div>
        )}
        {whatsapp && (
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle size={14} className="shrink-0 text-green-500" />
            <span>{whatsapp}</span>
          </div>
        )}
        {address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-muted-foreground shrink-0" />
            <span>{address}</span>
          </div>
        )}
        {instagram && (
          <div className="flex items-center gap-2 text-sm">
            <Camera size={14} className="shrink-0 text-pink-500" />
            <span>@{instagram}</span>
          </div>
        )}
      </div>
    </div>
  );
}

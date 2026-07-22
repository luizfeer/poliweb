import Image from 'next/image';
import type { ReactNode } from 'react';
import { ArrowUpRight, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CivicNews, CouncilProposition } from '@/lib/transparency';
import { formatShortDate } from './formatters';

export function MetaRow({ label, date, compact = false }: { label: string; date: string | null; compact?: boolean }) {
  const sizeClass = compact ? 'text-[10px]' : 'text-[11px]';
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 font-bold uppercase tracking-[0.04em] text-clay-600 ${sizeClass}`}>
      <span>{label}</span>
      {date && <span className="font-semibold normal-case text-ink-400">{formatShortDate(date)}</span>}
    </div>
  );
}

export function ExternalLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn('inline-flex items-center gap-1 no-underline hover:underline', className)}>
      {children}
      <ArrowUpRight size={13} className="shrink-0" />
    </a>
  );
}

export function RichSummary({ text, className, maxLines }: { text: string; className?: string; maxLines?: number }) {
  const lines = summaryLines(text);
  const visibleLines = typeof maxLines === 'number' ? lines.slice(0, maxLines) : lines;

  return (
    <div className={className}>
      {(visibleLines.length ? visibleLines : [text]).map((line, index) => (
        <p key={`${line}-${index}`} className="m-0 leading-relaxed [&+p]:mt-1.5">
          {parseBold(line)}
        </p>
      ))}
    </div>
  );
}

function parseBold(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${part}-${index}`} className="font-medium text-ink-800">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function summaryLines(text: string | null): string[] {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.trim().replace(/^[-*]\s+/, ''))
    .filter(Boolean);
}

export type CityHallMobileLayout = 'instagram' | 'compact-row';

export function CityHallInstagramCard({
  news,
  featured = false,
  mobileLayout = 'instagram',
}: {
  news: CivicNews;
  featured?: boolean;
  mobileLayout?: CityHallMobileLayout;
}) {
  const igMobile = mobileLayout === 'instagram';

  return (
    <article
      className={cn(
        'flex overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card',
        igMobile ? 'max-md:flex-col' : 'max-md:flex-row max-md:items-stretch',
        'md:flex-col md:gap-0',
        featured && 'md:col-span-2 lg:col-span-2 ring-1 ring-ink-900/[0.06]',
      )}
    >
      <div
        className={cn(
          'relative shrink-0 bg-paper-deep',
          igMobile && 'max-md:w-full max-md:aspect-square',
          !igMobile && 'max-md:w-[4.75rem] max-md:min-h-[4.75rem] max-md:max-w-[4.75rem] max-md:flex-none max-md:aspect-square',
          'md:w-full',
          featured ? 'md:aspect-square md:min-h-[260px] lg:min-h-[320px]' : 'md:aspect-square md:min-h-0',
        )}
      >
        {news.thumbnailUrl ? (
          <Image
            src={news.thumbnailUrl}
            alt=""
            fill
            className="object-cover"
            sizes={
              igMobile
                ? featured
                  ? '(max-width: 767px) 100vw, (min-width: 1024px) 66vw, 50vw'
                  : '(max-width: 767px) 100vw, (min-width: 1024px) 33vw, 50vw'
                : '(max-width: 767px) 76px, (min-width: 1024px) 33vw, 50vw'
            }
            priority={featured && igMobile}
          />
        ) : (
          <div className="flex h-full min-h-[inherit] items-center justify-center bg-paper-deep">
            <Newspaper className="text-clay-300" size={featured ? 42 : igMobile ? 36 : 22} aria-hidden />
          </div>
        )}
      </div>
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-1.5 p-3 md:border-t md:border-ink-100/80 md:pt-3 md:pb-3.5',
          !igMobile && 'max-md:border-l max-md:border-ink-100/80 max-md:py-2.5 max-md:pr-2.5 max-md:pl-3',
        )}
      >
        <MetaRow label="Prefeitura" date={news.publishedAt} compact={!featured || !igMobile} />
        <h3
          className={cn(
            'm-0 font-extrabold leading-snug text-ink-900',
            igMobile && featured && 'max-md:line-clamp-4 max-md:text-[17px]',
            igMobile && !featured && 'max-md:line-clamp-3 max-md:text-[16px]',
            !igMobile && 'max-md:line-clamp-2 max-md:text-[13px]',
            featured ? 'md:line-clamp-4 md:text-[19px]' : 'md:line-clamp-3 md:text-[16px]',
          )}
        >
          {news.title}
        </h3>
        <RichSummary
          text={news.summaryAi ?? news.excerpt ?? ''}
          className={cn(
            'text-ink-600',
            igMobile && 'max-md:text-[13px]',
            !igMobile && 'max-md:text-[11px] max-md:leading-snug',
            featured ? 'md:text-[14px]' : 'md:text-[13px]',
          )}
          maxLines={igMobile ? (featured ? 4 : 3) : 2}
        />
        <ExternalLink href={news.sourceUrl} className="mt-auto inline-flex pt-0.5 text-[11px] font-bold text-sky-700 max-md:pt-1 md:text-[12px]">
          Ver na fonte oficial
        </ExternalLink>
      </div>
    </article>
  );
}

export function LeadNewsCard({ news }: { news: CivicNews }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
      <div className="relative aspect-[4/5] w-full shrink-0 bg-paper-deep md:aspect-[16/9] lg:aspect-[16/8]">
        {news.thumbnailUrl ? (
          <Image
            src={news.thumbnailUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 767px) 100vw, (min-width: 1024px) 50vw, 100vw"
            priority
          />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center md:min-h-[240px]">
            <Newspaper className="text-clay-300" size={36} aria-hidden />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 border-t border-ink-100/80 p-3.5">
        <MetaRow label="Notícia da Câmara" date={news.publishedAt} />
        <h3 className="m-0 text-[17px] font-extrabold leading-snug text-ink-900 md:text-[19px]">{news.title}</h3>
        <RichSummary text={news.summaryAi ?? news.excerpt ?? ''} className="text-[14px] leading-relaxed text-ink-700" maxLines={5} />
        <ExternalLink href={news.sourceUrl} className="mt-1 inline-flex text-[13px] font-bold text-sky-700">
          Abrir notícia
        </ExternalLink>
      </div>
    </article>
  );
}

export function CompactNewsCard({ news }: { news: CivicNews }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card md:grid md:grid-cols-[92px_minmax(0,1fr)] md:items-start md:gap-3 md:p-2.5">
      <div className="relative aspect-[16/10] w-full shrink-0 bg-paper-deep md:aspect-auto md:h-[92px] md:w-[92px] md:overflow-hidden md:rounded-lg">
        {news.thumbnailUrl ? (
          <Image src={news.thumbnailUrl} alt="" fill className="object-cover" sizes="(max-width: 767px) 100vw, 92px" />
        ) : (
          <div className="grid h-full min-h-[140px] place-items-center md:min-h-0">
            <Newspaper className="text-clay-300" size={22} aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 border-t border-ink-100/80 p-3 md:border-t-0 md:p-0">
        <MetaRow label="Câmara" date={news.publishedAt} compact />
        <h3 className="m-0 mt-1 line-clamp-3 text-[15px] font-extrabold leading-snug text-ink-900 md:line-clamp-2 md:text-[14px]">{news.title}</h3>
        <RichSummary text={news.summaryAi ?? news.excerpt ?? ''} className="mt-1.5 text-[13px] text-ink-600 md:text-[12px]" maxLines={3} />
        <ExternalLink href={news.sourceUrl} className="mt-2 inline-flex text-[12px] font-bold text-sky-700 md:mt-1.5">
          Abrir
        </ExternalLink>
      </div>
    </article>
  );
}

function formatPropositionKindLine(propositionType: string | null): string | null {
  if (!propositionType?.trim()) return null;
  const one = propositionType.replace(/\s+/g, ' ').trim();
  if (one.length <= 72) return one;
  return `${one.slice(0, 70)}...`;
}

function formatPropositionKindBadge(propositionType: string | null): string {
  if (!propositionType?.trim()) return 'Proposição';
  return propositionType.replace(/\s+/g, ' ').trim().split(' - ')[0] ?? 'Proposição';
}

export function PropositionCard({ proposition }: { proposition: CouncilProposition }) {
  const situationLabel = proposition.situation ?? 'Situação não informada';
  const kindLine = formatPropositionKindLine(proposition.propositionType);
  const kindBadge = formatPropositionKindBadge(proposition.propositionType);
  const numberLabel = proposition.number ? `Nº ${proposition.number}` : null;
  const lines = summaryLines(proposition.summaryAi);
  const leadSummary = lines[0] ?? null;
  const detailLines = lines.slice(1, 4);

  return (
    <article className="min-w-0 max-w-full overflow-hidden rounded-xl border border-ink-100 bg-white px-3.5 py-3 shadow-card ring-1 ring-ink-900/[0.04] sm:px-4 sm:py-4">
      <header className="border-b border-ink-100/90 pb-2.5">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="shrink-0 rounded-md bg-clay-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-clay-700">
              {kindBadge}
            </span>
            {numberLabel ? (
              <span className="shrink-0 rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900">
                {numberLabel}
              </span>
            ) : (
              <span className="shrink-0 rounded-md bg-paper-deep px-2 py-0.5 text-[10px] font-bold text-ink-600">Sem número</span>
            )}
            <span className="max-w-[11rem] truncate rounded-md border border-ink-100/90 bg-paper px-2 py-0.5 text-[10px] font-bold text-ink-800 sm:max-w-[14rem]" title={situationLabel}>
              {situationLabel}
            </span>
          </div>
          <time className="shrink-0 text-[10px] font-bold tabular-nums text-ink-400">{formatShortDate(proposition.presentedAt)}</time>
        </div>
        {kindLine ? (
          <p className="m-0 mt-2 line-clamp-1 text-[10px] font-medium leading-snug text-ink-400 break-words" title={proposition.propositionType ?? undefined}>
            {kindLine}
          </p>
        ) : null}
      </header>

      <h3 className="m-0 mt-3 line-clamp-4 break-words text-[16px] font-extrabold leading-snug tracking-tight text-ink-950 sm:line-clamp-none sm:text-[17px]">
        {proposition.title}
      </h3>

      {leadSummary ? (
        <section className="mt-3 min-w-0 rounded-lg border border-sky-100 bg-sky-50/80 p-3">
          <p className="m-0 mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-sky-700">Em uma frase</p>
          <p className="m-0 text-[15px] font-semibold leading-relaxed text-ink-900 sm:text-[16px]">{parseBold(leadSummary)}</p>
          {detailLines.length > 0 ? (
            <div className="mt-2 space-y-1.5 border-t border-sky-100 pt-2 text-[12px] leading-relaxed text-ink-600 sm:text-[13px]">
              {detailLines.map((line, index) => (
                <p key={`${proposition.id}-detail-${index}`} className="m-0">
                  {parseBold(line)}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <footer className="mt-3 flex flex-col gap-2 border-t border-ink-100/90 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 min-w-0 text-[11px] font-medium leading-snug text-ink-500 break-words">
          {proposition.author ? (
            <>
              <span className="font-bold text-ink-600">Autoria:</span> {proposition.author}
            </>
          ) : (
            <span className="text-ink-400">Autoria não informada</span>
          )}
        </p>
        <ExternalLink href={proposition.sourceUrl} className="shrink-0 self-start text-[11px] font-bold text-sky-700 sm:self-auto sm:text-[12px]">
          Ver na Câmara
        </ExternalLink>
      </footer>
    </article>
  );
}

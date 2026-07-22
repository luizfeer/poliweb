import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ChevronRight,
  Landmark,
  Newspaper,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import { formatShortDate } from './formatters';
import type {
  CivicNews,
  CouncilProposition,
  PublicTender,
  TransparencySnapshot,
} from '@/lib/transparency';

type TransparencyPulseWidgetProps = {
  snapshot: TransparencySnapshot;
  cityName: string;
  variant?: 'home' | 'services';
};

type Highlight = {
  label: string;
  title: string;
  meta: string;
  usesAiSummary: boolean;
};

export function TransparencyPulseWidget({
  snapshot,
  cityName,
  variant = 'home',
}: TransparencyPulseWidgetProps) {
  const highlight = getPrimaryHighlight(snapshot);
  const newsCount = snapshot.cityHallNews.length + snapshot.councilNews.length;
  const officialCount =
    snapshot.propositions.length +
    snapshot.diaries.reduce((total, diary) => total + diary.acts.length, 0) +
    snapshot.meetings.length +
    snapshot.tenders.length;

  const copy =
    variant === 'services'
      ? {
          kicker: 'Também é serviço público',
          title: 'Acompanhe prefeitura, câmara e licitações',
          text: `Veja notícias oficiais, proposições e documentos públicos de ${cityName} em um só lugar.`,
        }
      : {
          kicker: 'Transparência',
          title: 'O que mudou no poder público',
          text: `Resumo rápido de notícias oficiais, câmara, Diário Oficial e licitações de ${cityName}.`,
        };

  return (
    <Link
      href="/transparencia"
      className="shadow-card block rounded-lg border border-sky-100 bg-white p-3.5 hover:no-underline md:p-4"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-sky-100 text-sky-700">
          <Landmark size={22} strokeWidth={2.1} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.04em] text-sky-700">
            {copy.kicker}
          </p>
          <h2 className="text-ink-900 m-0 mt-0.5 text-[17px] font-extrabold leading-tight">
            {copy.title}
          </h2>
          <p className="text-ink-600 m-0 mt-1 text-[13px] leading-relaxed">{copy.text}</p>
        </div>
        <ChevronRight size={18} className="text-ink-400 mt-1 shrink-0" aria-hidden="true" />
      </div>

      {highlight ? (
        <div className="bg-paper mt-3 rounded-md p-3">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="shadow-card rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-sky-700">
              {highlight.label}
            </span>
            <span className="text-ink-500 text-[11px] font-medium">{highlight.meta}</span>
          </div>
          <p className="text-ink-900 m-0 line-clamp-2 text-[13px] font-bold leading-snug">
            {renderBoldMarkdown(highlight.title)}
          </p>
          {highlight.usesAiSummary ? (
            <p className="m-0 mt-2 text-[11px] font-semibold text-sky-700">
              Resumido por IA — sujeito a verificação
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric icon={Newspaper} label="notícias" value={newsCount} />
        <Metric icon={ScrollText} label="atos" value={officialCount} />
        <Metric icon={ShieldCheck} label="fontes" value={countSources(snapshot)} />
      </div>
    </Link>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="border-ink-100 bg-paper rounded-md border px-2.5 py-2">
      <Icon size={15} className="text-clay-600" aria-hidden="true" />
      <div className="text-ink-900 mt-1 text-[18px] font-extrabold leading-none">{value}</div>
      <div className="text-ink-500 mt-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]">
        {label}
      </div>
    </div>
  );
}

function getPrimaryHighlight(snapshot: TransparencySnapshot): Highlight | null {
  const news = [...snapshot.cityHallNews, ...snapshot.councilNews]
    .filter((item) => item.publishedAt)
    .sort(
      (a, b) => new Date(b.publishedAt ?? '').getTime() - new Date(a.publishedAt ?? '').getTime(),
    )[0];

  if (news) return newsToHighlight(news);

  const proposition = snapshot.propositions.find((item) => item.title);
  if (proposition) return propositionToHighlight(proposition);

  const actDiary = snapshot.diaries.find((diary) => diary.acts.length > 0);
  const act = actDiary?.acts[0];
  if (act && actDiary) {
    return {
      label: 'Diário Oficial',
      title: act.summaryAi ?? act.title,
      meta: formatShortDate(actDiary.date),
      usesAiSummary: Boolean(act.summaryAi),
    };
  }

  const tender = snapshot.tenders.find((item) => item.title);
  if (tender) return tenderToHighlight(tender);

  return null;
}

function newsToHighlight(news: CivicNews): Highlight {
  return {
    label: news.source === 'city_hall' ? 'Prefeitura' : 'Câmara',
    title: news.summaryAi ?? news.excerpt ?? news.title,
    meta: formatShortDate(news.publishedAt),
    usesAiSummary: Boolean(news.summaryAi),
  };
}

function propositionToHighlight(proposition: CouncilProposition): Highlight {
  return {
    label: proposition.propositionType ?? 'Proposição',
    title: proposition.summaryAi ?? proposition.title,
    meta: proposition.presentedAt
      ? formatShortDate(proposition.presentedAt)
      : (proposition.situation ?? 'câmara'),
    usesAiSummary: Boolean(proposition.summaryAi),
  };
}

function tenderToHighlight(tender: PublicTender): Highlight {
  return {
    label: tender.modality ?? 'Licitação',
    title: tender.summaryAi ?? tender.title,
    meta: tender.deadline
      ? `até ${formatShortDate(tender.deadline)}`
      : (tender.status ?? 'prefeitura'),
    usesAiSummary: Boolean(tender.summaryAi),
  };
}

function countSources(snapshot: TransparencySnapshot): number {
  const sources = [
    snapshot.cityHallNews.length,
    snapshot.councilNews.length,
    snapshot.propositions.length,
    snapshot.diaries.length,
    snapshot.meetings.length,
    snapshot.tenders.length,
  ];

  return sources.filter((count) => count > 0).length;
}

function renderBoldMarkdown(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${part}-${index}`} className="font-extrabold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

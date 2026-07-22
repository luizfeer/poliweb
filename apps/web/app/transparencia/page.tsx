import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Gavel,
  Landmark,
  Newspaper,
  SearchCheck,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider } from '@/components/carmo';
import {
  ExpandableCityHallNews,
  ExpandableCouncilNews,
} from '@/components/public/transparency/expandable-transparency-news';
import { formatFullDate, formatShortDate } from '@/components/public/transparency/formatters';
import { ExternalLink, PropositionCard } from '@/components/public/transparency/transparency-cards';
import { UtilityHero } from '@/components/public/utilities/utility-hero';
import { getCurrentCity } from '@/lib/cities';
import { getTransparencySnapshot, type DiaryAct, type PublicTender } from '@/lib/transparency';

export const metadata = {
  title: 'Transparência - Portal Carmelitano',
  description:
    'Notícias da Prefeitura, Câmara, proposições, Diário Oficial e licitações de Carmo do Rio Claro.',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default async function TransparenciaPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const snapshot = await getTransparencySnapshot(city.id);
  const latestActs = snapshot.diaries.flatMap((diary) =>
    diary.acts.map((act) => ({
      ...act,
      diaryDate: diary.date,
      diaryNumber: diary.number,
      sourceUrl: diary.sourceUrl,
      pages: diary.pages,
    })),
  );
  const sensitive = latestActs.filter((act) => act.importance === 'high').length;

  return (
    <AppFrame className="bg-paper">
      <AppHeader
        chips={['Prefeitura', 'Câmara', 'Proposições', 'Diário Oficial', 'Licitações']}
        placeholder="Buscar em transparência"
        searchHref="/transparencia"
      />

      <Band className="px-3.5 py-4 md:px-6 lg:px-8">
        <UtilityHero
          icon={Landmark}
          kicker={`Transparência pública de ${city.name}`}
          title="O que está acontecendo no poder público, com fonte oficial."
          description="Notícias da Prefeitura, Câmara, proposições, Diário Oficial, sessões e licitações organizados para leitura rápida e conferência direta."
          tone="ink"
        >
          <div className="grid grid-cols-3 gap-2 lg:gap-3">
            <HeroMetric
              label="Notícias"
              value={snapshot.councilNews.length + snapshot.cityHallNews.length}
              icon={Newspaper}
            />
            <HeroMetric
              label="Proposições"
              value={snapshot.propositions.length}
              icon={ScrollText}
            />
            <HeroMetric
              label="Fontes"
              value={latestActs.length + snapshot.tenders.length}
              icon={FileText}
            />
          </div>
        </UtilityHero>
      </Band>

      <Band variant="paper-card" className="grid gap-2 px-3.5 py-3 md:grid-cols-3 md:px-6 lg:px-8">
        <InfoWidget
          icon={ShieldCheck}
          title="Fonte oficial preservada"
          text="Cada item aponta para o portal público da Prefeitura ou da Câmara."
          tone="green"
        />
        <InfoWidget
          icon={SearchCheck}
          title="Leitura mais clara"
          text="Notícias e proposições aparecem primeiro porque trazem contexto em texto aberto."
          tone="sky"
        />
        <InfoWidget
          icon={ClipboardList}
          title="Rastro de transparência"
          text={
            sensitive > 0
              ? `${sensitive} atos oficiais pedem revisão LGPD no painel.`
              : 'Diário, sessões e licitações ficam guardados para conferência.'
          }
          tone={sensitive ? 'amber' : 'paper'}
        />
      </Band>

      <Divider />

      <ContextBanner
        icon={Newspaper}
        kicker="Notícias oficiais"
        title="O jeito mais rápido de entender o que a Prefeitura está comunicando."
        text="São publicações com texto aberto, data e imagem. Por isso aparecem primeiro: dão contexto sem depender de PDF ou linguagem jurídica."
        tone="clay"
      />
      <SectionTitle
        kicker="Prefeitura"
        title="Últimas notícias da Prefeitura"
        href="https://www.carmodorioclaro.mg.gov.br/portal/noticias"
      />
      <ExpandableCityHallNews news={snapshot.cityHallNews} />

      <Divider />

      <ContextBanner
        icon={Landmark}
        kicker="Câmara em linguagem direta"
        title="Notícias do Legislativo ajudam a acompanhar decisões e atividades públicas."
        text="Aqui entram comunicados da Câmara com texto legível, fonte oficial e resumo curto para leitura rápida."
        tone="green"
      />
      <SectionTitle
        kicker="Poder Legislativo"
        title="Notícias da Câmara"
        href="https://www.carmodorioclaro.cam.mg.gov.br/portal/noticias"
      />
      <ExpandableCouncilNews news={snapshot.councilNews} />

      <Divider />

      <ContextBanner
        icon={ScrollText}
        kicker="O que são proposições?"
        title="São pedidos, indicações, moções e projetos apresentados pelos vereadores."
        text="O portal destaca o assunto, autoria e situação para você entender se é solicitação, homenagem, projeto ou encaminhamento."
        tone="sky"
      />
      <SectionTitle
        kicker="Câmara Municipal"
        title="Proposições recentes"
        href="https://www.carmodorioclaro.cam.mg.gov.br/portal/proposicoes"
      />
      <Band className="grid min-w-0 gap-3 px-3.5 pb-4 md:grid-cols-2 md:px-6 lg:px-8">
        {snapshot.propositions.slice(0, 5).map((proposition) => (
          <PropositionCard key={proposition.id} proposition={proposition} />
        ))}
      </Band>

      <Divider />

      <ContextBanner
        icon={FileText}
        kicker="Documentos formais"
        title="Diário Oficial, sessões e licitações são o rastro conferível da administração."
        text="Aqui ficam atos oficiais, registros de reuniões e compras públicas para acompanhar decisões, prazos e processos do município."
        tone="paper"
      />
      <SectionTitle
        kicker="Fonte oficial"
        title="Diário Oficial, sessões e licitações"
        href="https://www.carmodorioclaro.mg.gov.br/portal/diario-oficial"
      />
      <Band className="grid gap-3 px-3.5 pb-4 md:grid-cols-3 md:px-6 lg:px-8">
        <OfficialSourcePanel title="Últimos atos do Diário Oficial" icon={FileText}>
          {latestActs.slice(0, 4).map((act) => (
            <DiaryActItem key={act.id} act={act} />
          ))}
        </OfficialSourcePanel>
        <OfficialSourcePanel title="Sessões da Câmara" icon={CalendarDays}>
          {snapshot.meetings.slice(0, 4).map((meeting) => (
            <ExternalMiniItem
              key={meeting.id}
              title={formatFullDate(meeting.date)}
              meta={meeting.sessionType ?? 'sessão'}
              href={meeting.sourceUrl}
            />
          ))}
        </OfficialSourcePanel>
        <OfficialSourcePanel title="Licitações recentes" icon={Gavel}>
          {snapshot.tenders.slice(0, 4).map((tender) => (
            <TenderMiniItem key={tender.id} tender={tender} />
          ))}
        </OfficialSourcePanel>
      </Band>
    </AppFrame>
  );
}

function HeroMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 p-3">
      <Icon size={20} className="text-sun-300" />
      <div className="font-display mt-2 text-[28px] font-extrabold leading-none">{value}</div>
      <div className="text-white/72 mt-1 text-[11px] font-semibold uppercase tracking-[0.04em]">
        {label}
      </div>
    </div>
  );
}

function InfoWidget({
  icon: Icon,
  title,
  text,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone: 'sky' | 'green' | 'amber' | 'paper';
}) {
  const toneClass =
    tone === 'sky'
      ? 'border-sky-100 bg-sky-50 text-sky-800'
      : tone === 'green'
        ? 'border-cerrado-100 bg-cerrado-100/70 text-cerrado-700'
        : tone === 'amber'
          ? 'border-sun-200 bg-sun-100/70 text-ink-900'
          : 'border-ink-100 bg-white text-ink-800';

  return (
    <div
      className={`shadow-card flex min-w-0 items-start gap-3 rounded-lg border p-3 ${toneClass}`}
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/80">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="m-0 text-[13px] font-extrabold leading-snug">{title}</p>
        <p className="text-ink-600 m-0 mt-0.5 text-[12px] font-medium leading-snug">{text}</p>
      </div>
    </div>
  );
}

function ContextBanner({
  icon: Icon,
  kicker,
  title,
  text,
  tone,
}: {
  icon: LucideIcon;
  kicker: string;
  title: string;
  text: string;
  tone: 'clay' | 'green' | 'sky' | 'paper';
}) {
  const toneClass =
    tone === 'clay'
      ? 'border-clay-100 bg-clay-50 text-clay-800'
      : tone === 'green'
        ? 'border-cerrado-100 bg-cerrado-100/70 text-cerrado-800'
        : tone === 'sky'
          ? 'border-sky-100 bg-sky-50 text-sky-800'
          : 'border-ink-100 bg-white text-ink-900';

  return (
    <Band className="px-3.5 pt-4 md:px-6 lg:px-8">
      <article className={`shadow-card overflow-hidden rounded-xl border p-4 md:p-5 ${toneClass}`}>
        <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
          <div className="shadow-card grid h-12 w-12 place-items-center rounded-full bg-white/80">
            <Icon size={22} />
          </div>
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.08em]">{kicker}</p>
            <h3 className="text-ink-900 m-0 mt-1 max-w-3xl text-[18px] font-extrabold leading-tight md:text-[22px]">
              {title}
            </h3>
            <p className="text-ink-700 m-0 mt-2 max-w-3xl text-[13px] font-medium leading-relaxed md:text-[14px]">
              {text}
            </p>
          </div>
        </div>
      </article>
    </Band>
  );
}

function SectionTitle({ kicker, title, href }: { kicker: string; title: string; href: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 px-3.5 pb-2 pt-4 md:px-6 lg:px-8 lg:pt-5">
      <div className="min-w-0">
        <div className="text-clay-600 mb-0.5 text-[11px] font-bold uppercase tracking-[0.04em]">
          {kicker}
        </div>
        <h2 className="text-ink-900 m-0 truncate text-[18px] font-extrabold">{title}</h2>
      </div>
      <ExternalLink href={href} className="shrink-0 text-[13px] font-medium text-sky-700">
        Ver fonte
      </ExternalLink>
    </div>
  );
}

function OfficialSourcePanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="border-ink-100 shadow-card rounded-lg border bg-white p-3.5">
      <div className="mb-3 flex items-center gap-2">
        <div className="bg-clay-50 text-clay-700 grid h-8 w-8 place-items-center rounded-full">
          <Icon size={17} />
        </div>
        <h3 className="text-ink-900 m-0 text-[15px] font-extrabold">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function DiaryActItem({
  act,
}: {
  act: DiaryAct & {
    diaryDate: string;
    diaryNumber: string | null;
    sourceUrl: string | null;
    pages: number | null;
  };
}) {
  return (
    <ExternalMiniItem
      title={act.title}
      meta={`${act.actType ?? 'ato'} · ${formatShortDate(act.diaryDate)} · ed. ${act.diaryNumber ?? '-'}`}
      href={act.sourceUrl}
    />
  );
}

function TenderMiniItem({ tender }: { tender: PublicTender }) {
  const value = tender.estimatedValue
    ? currencyFormatter.format(tender.estimatedValue)
    : 'valor não informado';
  return (
    <ExternalMiniItem
      title={tender.title}
      meta={`${formatTenderStatus(tender.status)} · ${value}`}
      href={tender.sourceUrl}
    />
  );
}

function ExternalMiniItem({
  title,
  meta,
  href,
}: {
  title: string;
  meta: string;
  href: string | null;
}) {
  return (
    <div className="bg-paper rounded-sm p-2">
      <h4 className="text-ink-900 m-0 line-clamp-2 text-[13px] font-bold leading-snug">{title}</h4>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-ink-500 m-0 min-w-0 truncate text-[11px] font-medium">{meta}</p>
        {href && (
          <ExternalLink href={href} className="shrink-0 text-[11px] font-bold text-sky-700">
            Abrir
          </ExternalLink>
        )}
      </div>
    </div>
  );
}

function formatTenderStatus(status: string | null): string {
  const labels: Record<string, string> = {
    open: 'aberto',
    closed: 'encerrado',
    cancelled: 'suspenso',
    awarded: 'homologado',
  };
  return status ? (labels[status] ?? status) : 'status não informado';
}

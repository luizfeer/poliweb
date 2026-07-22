'use client';

import { useRef, useState, useTransition } from 'react';
import { toPng } from 'html-to-image';
import { Download, Eye, Loader2, MapPin, MessageCircle, Phone, RefreshCw, Star, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { MonthlyReport } from '@/lib/businesses/report-queries';
import { generateMonthlyReportAction, getMonthlyReportAction } from '@/lib/businesses/report-actions';
import { ReportTemplate } from './report-template';

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export function monthLabelShort(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTH_LABELS[m - 1]}/${String(y).slice(2)}`;
}

const nf = new Intl.NumberFormat('pt-BR');

function Delta({ current, prev }: { current: number; prev: number | null }) {
  if (prev == null) return null;
  const diff = current - prev;
  if (diff === 0) return <span className="text-xs text-muted-foreground">=</span>;
  const up = diff > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? '+' : ''}
      {nf.format(diff)}
    </span>
  );
}

function MetricCard({
  icon,
  label,
  value,
  prev,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  prev: number | null;
}) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums">{nf.format(value)}</span>
        <Delta current={value} prev={prev} />
      </div>
    </div>
  );
}

export function BoletimView({
  businessId,
  businessName,
  months,
  defaultMonth,
  initialReport,
}: {
  businessId: string;
  businessName: string;
  months: string[];
  defaultMonth: string;
  initialReport: MonthlyReport | null;
}) {
  const [month, setMonth] = useState(defaultMonth);
  const [report, setReport] = useState<MonthlyReport | null>(initialReport);
  const [isPending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  function selectMonth(m: string) {
    setMonth(m);
    startTransition(async () => {
      const res = await getMonthlyReportAction({ businessId, month: m });
      setReport(res.ok ? (res.report ?? null) : null);
      if (!res.ok) toast.error(res.error ?? 'Falha ao carregar boletim.');
    });
  }

  function generate(force = false) {
    setGenerating(true);
    startTransition(async () => {
      const res = await generateMonthlyReportAction({ businessId, month, force });
      setGenerating(false);
      if (res.ok && res.report) {
        setReport(res.report);
        toast.success(force ? 'Boletim atualizado.' : 'Boletim gerado.');
      } else {
        toast.error(res.error ?? 'Falha ao gerar boletim.');
      }
    });
  }

  async function downloadImage() {
    if (!templateRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(templateRef.current, { pixelRatio: 1, cacheBust: true, width: 1080, height: 1350 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `boletim-${businessName.replace(/\s+/g, '-').toLowerCase()}-${month}.png`;
      a.click();
      toast.success('Imagem baixada. É só compartilhar.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao gerar a imagem.');
    } finally {
      setDownloading(false);
    }
  }

  const m = report?.metrics;
  const prev = m?.prev ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {months.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => selectMonth(opt)}
            className={
              opt === month
                ? 'rounded-lg bg-clay-50 px-3 py-1.5 text-sm font-semibold text-clay-700'
                : 'rounded-lg px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-clay-50'
            }
          >
            {monthLabelShort(opt)}
          </button>
        ))}
      </div>

      <div className={`rounded-2xl border bg-card p-5 ${isPending ? 'opacity-70' : ''}`}>
        {!report ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Boletim de {monthLabelShort(month)} ainda não gerado.
            </p>
            <Button type="button" onClick={() => generate(false)} disabled={generating} className="gap-1.5">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Gerar boletim
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Boletim de {monthLabelShort(month)}</h2>
              {report.categoryRank && report.categorySize && report.categorySlug ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                  <Star className="h-4 w-4" /> {report.categoryRank}º de {report.categorySize} em {report.categorySlug}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <MetricCard icon={<Eye className="h-3.5 w-3.5" />} label="Visitas" value={m!.views} prev={prev?.views ?? null} />
              <MetricCard icon={<MessageCircle className="h-3.5 w-3.5" />} label="WhatsApp" value={m!.whatsappClicks} prev={prev?.whatsappClicks ?? null} />
              <MetricCard icon={<Phone className="h-3.5 w-3.5" />} label="Ligações" value={m!.phoneClicks} prev={prev?.phoneClicks ?? null} />
              <MetricCard icon={<MapPin className="h-3.5 w-3.5" />} label="Como chegar" value={m!.mapClicks} prev={prev?.mapClicks ?? null} />
              <MetricCard icon={<Star className="h-3.5 w-3.5" />} label="Favoritos" value={m!.favorites} prev={prev?.favorites ?? null} />
            </div>

            {report.aiSummary ? (
              <div className="rounded-xl border bg-paper p-4">
                <p className="text-sm leading-relaxed">{report.aiSummary}</p>
                <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                  Resumido por IA — sujeito a verificação
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={downloadImage} disabled={downloading} className="gap-1.5">
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Baixar imagem
              </Button>
              <Button type="button" variant="outline" onClick={() => generate(true)} disabled={generating} className="gap-1.5">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Atualizar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Template offscreen pra captura em alta resolução */}
      {report ? (
        <div className="pointer-events-none fixed -left-[2000px] top-0" aria-hidden="true">
          <ReportTemplate
            ref={templateRef}
            businessName={businessName}
            monthLabel={monthLabelShort(month)}
            report={report}
          />
        </div>
      ) : null}
    </div>
  );
}

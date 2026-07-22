import { forwardRef } from 'react';
import type { MonthlyReport } from '@/lib/businesses/report-queries';

const COLORS = {
  paper: '#FAF6EF',
  ink: '#191919',
  clay: '#E0561B',
  green: '#1F4A2C',
  muted: '#7A7268',
};

const nf = new Intl.NumberFormat('pt-BR');

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ flex: '1 1 30%', minWidth: 0 }}>
      <div style={{ fontSize: 72, fontWeight: 800, color: COLORS.ink, lineHeight: 1 }}>{nf.format(value)}</div>
      <div style={{ fontSize: 26, color: COLORS.muted, marginTop: 8 }}>{label}</div>
    </div>
  );
}

type Props = {
  businessName: string;
  monthLabel: string;
  report: MonthlyReport;
};

/** Card 1080×1350 (feed 4:5) capturado via html-to-image pra compartilhar. */
export const ReportTemplate = forwardRef<HTMLDivElement, Props>(function ReportTemplate(
  { businessName, monthLabel, report },
  ref,
) {
  const m = report.metrics;
  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1350,
        background: COLORS.paper,
        padding: 80,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, color: COLORS.clay, textTransform: 'uppercase', letterSpacing: 2 }}>
            Boletim · {monthLabel}
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, color: COLORS.ink, marginTop: 12, maxWidth: 820 }}>
            {businessName}
          </div>
        </div>
      </div>

      {report.categoryRank && report.categorySize && report.categorySlug ? (
        <div
          style={{
            marginTop: 36,
            display: 'inline-block',
            alignSelf: 'flex-start',
            background: COLORS.green,
            color: '#F1F7EE',
            fontSize: 34,
            fontWeight: 700,
            padding: '16px 28px',
            borderRadius: 999,
          }}
        >
          {report.categoryRank}º lugar de {report.categorySize} em {report.categorySlug}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, marginTop: 64 }}>
        <Stat value={m.views} label="visitas" />
        <Stat value={m.whatsappClicks} label="no WhatsApp" />
        <Stat value={m.phoneClicks} label="ligações" />
        <Stat value={m.mapClicks} label="como chegar" />
        <Stat value={m.favorites} label="novos favoritos" />
      </div>

      {report.aiSummary ? (
        <div style={{ marginTop: 'auto', fontSize: 32, lineHeight: 1.5, color: COLORS.ink }}>
          {report.aiSummary}
          <div style={{ fontSize: 22, color: COLORS.muted, marginTop: 20 }}>
            Resumido por IA — sujeito a verificação
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 40, fontSize: 28, fontWeight: 700, color: COLORS.clay }}>Carmo Local</div>
    </div>
  );
});

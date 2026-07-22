'use client';

import { useState, useMemo } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/analytics/stats-card';
import { PeriodPicker, type PeriodDays } from '@/components/analytics/period-picker';
import { ViewsChart } from '@/components/analytics/views-chart';
import { SourcePie } from '@/components/analytics/source-pie';
import { CtrBar } from '@/components/analytics/ctr-bar';
import { RankBadge } from '@/components/analytics/rank-badge';
import type { DailyStatsRow, WeeklyRankRow } from '@/lib/analytics/queries';

type AnalyticsDashboardProps = {
  businessId: string;
  initialRange: PeriodDays;
  dailyStats: DailyStatsRow[];
  weeklyRank: WeeklyRankRow[];
  primaryCategoryId?: string;
};

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function calcDelta(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined;
  return Math.round(((current - previous) / previous) * 100);
}

export function AnalyticsDashboard({
  businessId,
  initialRange,
  dailyStats,
  weeklyRank,
}: AnalyticsDashboardProps) {
  const [range, setRange] = useState<PeriodDays>(initialRange);

  const filteredStats = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    return dailyStats.filter((s) => new Date(s.date) >= cutoff);
  }, [dailyStats, range]);

  const totals = useMemo(() => {
    const half = Math.floor(filteredStats.length / 2);
    const first = filteredStats.slice(0, half);
    const second = filteredStats.slice(half);

    const sum = (arr: DailyStatsRow[], key: keyof DailyStatsRow) =>
      arr.reduce((acc, s) => acc + (Number(s[key]) || 0), 0);

    const views = sum(filteredStats, 'views');
    const totalEvents = sum(filteredStats, 'total_events');
    const whatsapp = sum(filteredStats, 'whatsapp_clicks');
    const phone = sum(filteredStats, 'phone_clicks');

    return {
      views,
      totalEvents,
      whatsapp,
      phone,
      viewsDelta: calcDelta(sum(second, 'views'), sum(first, 'views')),
      totalEventsDelta: calcDelta(sum(second, 'total_events'), sum(first, 'total_events')),
      whatsappDelta: calcDelta(sum(second, 'whatsapp_clicks'), sum(first, 'whatsapp_clicks')),
      phoneDelta: calcDelta(sum(second, 'phone_clicks'), sum(first, 'phone_clicks')),
    };
  }, [filteredStats]);

  const chartData = useMemo(
    () =>
      filteredStats.map((s) => ({
        date: formatDateLabel(s.date),
        views: s.views,
        totalEvents: s.total_events,
      })),
    [filteredStats],
  );

  const sourceData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filteredStats) {
      map.set('Busca', (map.get('Busca') || 0) + s.views);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredStats]);

  const ctrData = useMemo(() => {
    const totalViews = totals.views || 1;
    return [
      { name: 'WhatsApp', rate: (totals.whatsapp / totalViews) * 100 },
      { name: 'Telefone', rate: (totals.phone / totalViews) * 100 },
    ];
  }, [totals]);

  const latestRank = weeklyRank[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodPicker value={range} onChange={setRange} />
        <a
          href={`/painel/comercio/${businessId}/analytics/export?range=${range}`}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
        >
          <Download size={16} />
          CSV
        </a>
      </div>

      {filteredStats.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          <TrendingUp size={32} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">Ainda não há dados de analytics</p>
          <p className="mt-1 text-sm">
            Os números aparecem após a primeira agregação diária (madrugada).
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard label="Visualizações" value={totals.views} delta={totals.viewsDelta} />
            <StatsCard label="Eventos totais" value={totals.totalEvents} delta={totals.totalEventsDelta} />
            <StatsCard label="WhatsApp" value={totals.whatsapp} delta={totals.whatsappDelta} />
            <StatsCard label="Ligações" value={totals.phone} delta={totals.phoneDelta} />
          </div>

          <ViewsChart data={chartData} />

          <div className="grid gap-3 md:grid-cols-2">
            <SourcePie data={sourceData} />
            <CtrBar data={ctrData} />
          </div>

          {latestRank && latestRank.score !== null && (
            <RankBadge
              pctile={latestRank.score}
              categoryName="comércio"
            />
          )}
        </>
      )}
    </div>
  );
}

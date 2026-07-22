import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createServiceRoleClient } from '@/lib/supabase/service';

export const metadata = { title: 'Insights de busca - Portal Carmelitano' };

type SearchQueryRow = {
  query: string;
  result_count: number;
  clicked_entity_type: string | null;
  latency_ms: number | null;
};

type UntypedSelectClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        gte: (column: string, value: string) => {
          order: (
            column: string,
            options: { ascending: boolean },
          ) => {
            limit: (count: number) => Promise<{ data: unknown; error: { message: string } | null }>;
          };
        };
      };
    };
  };
};

export default async function SearchInsightsPage() {
  const city = await getCurrentCity();
  if (!city) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const rows = await listSearchQueries(city.id);
  const topQueries = countByQuery(rows).slice(0, 50);
  const zeroResults = countByQuery(rows.filter((row) => row.result_count === 0)).slice(0, 20);
  const zeroClicks = countByQuery(rows.filter((row) => row.result_count > 0 && !row.clicked_entity_type)).slice(0, 20);
  const clickedTypes = countByType(rows).slice(0, 8);
  const averageLatency = average(rows.map((row) => row.latency_ms).filter((value): value is number => typeof value === 'number'));

  return (
    <main className="space-y-6">
      <header className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Admin da cidade</p>
        <h1 className="text-3xl font-bold">Insights de busca</h1>
        <p className="mt-2 text-muted-foreground">Consultas dos últimos 30 dias para orientar conteúdo e relevância.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Buscas" value={rows.length} />
        <MetricCard label="Sem resultado" value={rows.filter((row) => row.result_count === 0).length} />
        <MetricCard label="Sem clique" value={rows.filter((row) => row.result_count > 0 && !row.clicked_entity_type).length} />
        <MetricCard label="Latência média" value={`${Math.round(averageLatency)}ms`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <InsightList title="Top queries" items={topQueries} />
        <InsightList title="Queries sem resultado" items={zeroResults} />
        <InsightList title="Queries sem clique" items={zeroClicks} />
        <InsightList title="Tipos clicados" items={clickedTypes} />
      </section>
    </main>
  );
}

async function listSearchQueries(cityId: string): Promise<SearchQueryRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const supabase = createServiceRoleClient() as unknown as UntypedSelectClient;
  const { data, error } = await supabase
    .from('search_queries')
    .select('query,result_count,clicked_entity_type,latency_ms,created_at')
    .eq('city_id', cityId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error || !Array.isArray(data)) return [];
  return data as SearchQueryRow[];
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </article>
  );
}

function InsightList({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  return (
    <article className="rounded-lg border bg-card p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="font-semibold">{item.count}</span>
          </div>
        )) : <p className="text-sm text-muted-foreground">Sem dados no período.</p>}
      </div>
    </article>
  );
}

function countByQuery(rows: SearchQueryRow[]): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.query, (counts.get(row.query) ?? 0) + 1);
  return sortCounts(counts);
}

function countByType(rows: SearchQueryRow[]): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.clicked_entity_type) counts.set(row.clicked_entity_type, (counts.get(row.clicked_entity_type) ?? 0) + 1);
  }
  return sortCounts(counts);
}

function sortCounts(counts: Map<string, number>): Array<{ label: string; count: number }> {
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

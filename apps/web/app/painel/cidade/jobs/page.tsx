import { notFound } from 'next/navigation';
import { Activity, AlertTriangle, CheckCircle2, Circle, Clock, RefreshCw } from 'lucide-react';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { requeueSearchIndexAction } from './actions';

export const metadata = { title: 'Jobs & Crons - Portal Carmelitano' };
export const revalidate = 60;

type AiJobRow = {
  id: string;
  job_type: string;
  status: string;
  model: string | null;
  error: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  cost_usd: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

type QueueRow = { processed_at: string | null };

type UntypedClient = {
  from: (t: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        is: (col: string, val: null) => Promise<{ data: unknown }>;
        order: (col: string, o: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: unknown }>;
        };
      };
      is: (col: string, val: null) => Promise<{ data: unknown }>;
      order: (col: string, o: { ascending: boolean }) => {
        limit: (n: number) => Promise<{ data: unknown }>;
      };
    };
  };
};

const CRON_DEFS = [
  { name: 'worker-weather',                   job: 'weather:update',           schedule: 'diário 00h',      desc: 'Previsão do tempo (Open-Meteo)' },
  { name: 'worker-indexing',                  job: 'indexing:semantic',        schedule: 'diário 04h',      desc: 'Indexação semântica (embeddings)' },
  { name: 'worker-scrape-diario',             job: 'scrape:diario',            schedule: 'seg/qui 06h',     desc: 'Diário Oficial' },
  { name: 'worker-scrape-licitacoes',         job: 'scrape:licitacoes',        schedule: 'seg/qui 06h30',   desc: 'Licitações e editais' },
  { name: 'worker-scrape-atas',               job: 'scrape:atas',              schedule: 'segunda 07h',     desc: 'Atas da Câmara' },
  { name: 'worker-scrape-noticias-camara',    job: 'scrape:noticias-camara',   schedule: 'terça 07h',       desc: 'Notícias da Câmara' },
  { name: 'worker-scrape-noticias-prefeitura',job: 'scrape:noticias-prefeitura', schedule: 'terça 07h15',   desc: 'Notícias da Prefeitura' },
  { name: 'worker-scrape-proposicoes',        job: 'scrape:proposicoes',       schedule: 'terça 07h30',     desc: 'Proposições da Câmara' },
  { name: 'worker-summarize',                 job: 'summarize:pending',        schedule: 'seg/qui 08h',     desc: 'Resumo IA de documentos' },
  { name: 'worker-embed',                     job: 'embed:pending',            schedule: 'seg/qui 08h30',   desc: 'Embeddings de atos do Diário' },
  { name: 'worker-moderate',                  job: 'moderate:backlog',         schedule: 'seg/qui 09h',     desc: 'Moderação de UGC' },
];

export default async function JobsPage() {
  const city = await getCurrentCity();
  if (!city) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const sb = createServiceRoleClient() as unknown as UntypedClient;

  const [recentRaw, queueRaw] = await Promise.all([
    sb.from('ai_jobs')
      .select('id,job_type,status,model,error,tokens_input,tokens_output,cost_usd,started_at,finished_at,created_at')
      .eq('city_id', city.id)
      .order('created_at', { ascending: false })
      .limit(120),
    sb.from('indexing_queue')
      .select('processed_at')
      .eq('city_id', city.id)
      .is('processed_at', null),
  ]);

  const recent = (Array.isArray(recentRaw.data) ? recentRaw.data : []) as AiJobRow[];
  const queuePending = (Array.isArray(queueRaw.data) ? queueRaw.data : []) as QueueRow[];

  const failed = recent.filter((j) => j.status === 'failed');
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = recent.filter((j) => j.created_at.startsWith(todayStr));

  const lastByType = new Map<string, AiJobRow>();
  for (const job of recent) {
    if (!lastByType.has(job.job_type)) lastByType.set(job.job_type, job);
  }

  const totalCost = recent.reduce((s, j) => s + (j.cost_usd ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Jobs & Crons</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor dos jobs automáticos do worker. Atualiza a cada 60s.
        </p>
      </div>

      <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Reindexar busca semântica</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Refileira publicados como upsert e rascunhos, pendentes ou arquivados como delete. O worker processa em <code>indexing:semantic</code>.
            </p>
          </div>
          <SubmitOnceForm action={requeueSearchIndexAction}>
            <SubmitOnceButton
              label="Refazer índice"
              pendingLabel="Refileirando..."
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-wait disabled:opacity-75"
            />
          </SubmitOnceForm>
        </div>
      </section>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Hoje" value={String(today.length)} icon={<Activity size={16} />} />
        <StatCard label="Falhas (últimas 120)" value={String(failed.length)} icon={<AlertTriangle size={16} />} warn={failed.length > 0} />
        <StatCard label="Na fila (indexing)" value={String(queuePending.length)} icon={<RefreshCw size={16} />} />
        <StatCard label="Custo IA (últimas 120)" value={`R$ ${(totalCost * 5.8).toFixed(4)}`} icon={<Circle size={16} />} />
      </div>

      {/* Cron grid */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Agendamentos</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Job</th>
                <th className="px-4 py-2.5 text-left">Cron</th>
                <th className="px-4 py-2.5 text-left">Última execução</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Duração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CRON_DEFS.map((def) => {
                const last = lastByType.get(def.job);
                return (
                  <tr key={def.name} className="bg-background">
                    <td className="px-4 py-3">
                      <p className="font-medium">{def.desc}</p>
                      <p className="text-xs text-muted-foreground">{def.job}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{def.schedule}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {last ? fmtDate(last.created_at) : <span className="italic">nunca</span>}
                    </td>
                    <td className="px-4 py-3">
                      {last ? <StatusBadge status={last.status} /> : <StatusBadge status="never" />}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {last?.started_at && last.finished_at ? fmtDuration(last.started_at, last.finished_at) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Failed jobs */}
      {failed.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-destructive">
            <AlertTriangle size={16} /> Falhas recentes
          </h2>
          <div className="space-y-2">
            {failed.slice(0, 20).map((job) => (
              <div key={job.id} className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{job.job_type}</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(job.created_at)}</span>
                </div>
                {job.error && (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-background p-3 text-xs text-destructive">
                    {job.error}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent history */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Histórico recente</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Job</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Modelo</th>
                <th className="px-4 py-2.5 text-right">Tokens</th>
                <th className="px-4 py-2.5 text-right">Custo</th>
                <th className="px-4 py-2.5 text-left">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.slice(0, 50).map((job) => (
                <tr key={job.id} className={`bg-background ${job.status === 'failed' ? 'bg-destructive/5' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-xs">{job.job_type}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={job.status} /></td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{job.model ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {job.tokens_input != null ? `${job.tokens_input}+${job.tokens_output ?? 0}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {job.cost_usd != null ? `$${job.cost_usd.toFixed(4)}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{fmtDate(job.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon, warn = false }: { label: string; value: string; icon: React.ReactNode; warn?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${warn ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-background'}`}>
      <div className={`flex items-center gap-1.5 text-xs ${warn ? 'text-destructive' : 'text-muted-foreground'}`}>
        {icon} {label}
      </div>
      <p className={`mt-1 text-2xl font-bold ${warn ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    completed: { label: 'ok',       cls: 'bg-green-100 text-green-700',  icon: <CheckCircle2 size={11} /> },
    failed:    { label: 'falhou',   cls: 'bg-red-100 text-red-700',      icon: <AlertTriangle size={11} /> },
    running:   { label: 'rodando',  cls: 'bg-blue-100 text-blue-700',    icon: <RefreshCw size={11} className="animate-spin" /> },
    queued:    { label: 'na fila',  cls: 'bg-muted text-muted-foreground', icon: <Clock size={11} /> },
    never:     { label: 'nunca',    cls: 'bg-muted text-muted-foreground', icon: <Circle size={11} /> },
  };
  const s = map[status] ?? map.queued;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}

function fmtDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

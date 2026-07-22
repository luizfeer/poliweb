import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Workers - Portal Carmelitano' };

const PAGE_SIZE = 50;

type Props = {
  searchParams: Promise<{ page?: string; status?: string; job?: string }>;
};

const statusLabels: Record<string, string> = {
  running: 'Rodando',
  success: 'Sucesso',
  error: 'Erro',
};

const statusClasses: Record<string, string> = {
  running: 'bg-sky-50 text-sky-800 ring-sky-200',
  success: 'bg-green-50 text-green-800 ring-green-200',
  error: 'bg-red-50 text-red-800 ring-red-200',
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'short',
  timeStyle: 'medium',
});

export default async function SuperWorkersPage({ searchParams }: Props) {
  await requireRole({ kinds: ['super_admin'] });

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const status = validStatus(params.status);
  const job = params.job?.trim() || null;

  const supabase = await createClient();
  let query = supabase
    .from('worker_run_logs')
    .select('*', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (status) query = query.eq('status', status);
  if (job) query = query.ilike('job_name', `%${job}%`);

  const { data: rows, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const latest = rows ?? [];
  const running = latest.filter((row) => row.status === 'running').length;
  const errors = latest.filter((row) => row.status === 'error').length;
  const successes = latest.filter((row) => row.status === 'success').length;

  return (
    <main className="space-y-6">
      <header className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Super admin</p>
        <h1 className="text-3xl font-bold">Workers</h1>
        <p className="mt-2 text-muted-foreground">
          Execucoes, sucesso, erro e tempo de rodagem dos jobs em background.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="Listados" value={String(count ?? 0)} />
        <Metric label="Rodando" value={String(running)} />
        <Metric label="Sucesso nesta pagina" value={String(successes)} />
        <Metric label="Erro nesta pagina" value={String(errors)} />
      </section>

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_180px_auto]">
        <input
          className="h-10 rounded-lg border bg-background px-3 text-sm"
          name="job"
          placeholder="Filtrar por job"
          defaultValue={job ?? ''}
        />
        <select
          className="h-10 rounded-lg border bg-background px-3 text-sm"
          name="status"
          defaultValue={status ?? ''}
        >
          <option value="">Todos</option>
          <option value="running">Rodando</option>
          <option value="success">Sucesso</option>
          <option value="error">Erro</option>
        </select>
        <button className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" type="submit">
          Filtrar
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Inicio</th>
              <th className="p-3">Job</th>
              <th className="p-3">Status</th>
              <th className="p-3">Cidade</th>
              <th className="p-3">Duracao</th>
              <th className="p-3">Erro</th>
            </tr>
          </thead>
          <tbody>
            {latest.map((row) => (
              <tr key={row.id} className="border-t align-top">
                <td className="whitespace-nowrap p-3">{dateFormatter.format(new Date(row.started_at))}</td>
                <td className="p-3 font-mono text-xs">{row.job_name}</td>
                <td className="p-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusClasses[row.status] ?? statusClasses.running}`}>
                    {statusLabels[row.status] ?? row.status}
                  </span>
                </td>
                <td className="p-3">{row.city_slug ?? '-'}</td>
                <td className="p-3">{formatDuration(row.duration_ms)}</td>
                <td className="max-w-md p-3 text-xs text-muted-foreground">
                  {row.error_message ?? '-'}
                </td>
              </tr>
            ))}
            {latest.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                  Nenhum log encontrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Pagina {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1, params)} className="rounded-lg border px-3 py-1.5 hover:bg-muted">
                Anterior
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={pageHref(page + 1, params)} className="rounded-lg border px-3 py-1.5 hover:bg-muted">
                Proxima
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </article>
  );
}

function validStatus(status: string | undefined): 'running' | 'success' | 'error' | null {
  if (status === 'running' || status === 'success' || status === 'error') return status;
  return null;
}

function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return '-';
  if (durationMs < 1000) return `${durationMs} ms`;
  const seconds = Math.round(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

function pageHref(page: number, params: { status?: string; job?: string }): string {
  const search = new URLSearchParams({ page: String(page) });
  if (params.status) search.set('status', params.status);
  if (params.job) search.set('job', params.job);
  return `?${search.toString()}`;
}

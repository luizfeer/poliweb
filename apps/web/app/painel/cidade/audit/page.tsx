import Link from 'next/link';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const PAGE_SIZE = 50;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AuditPage({ searchParams }: Props) {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const { data: rows, count } = await supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .or(`city_id.eq.${city.id},city_id.is.null`)
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Audit log</h1>
        <p className="text-muted-foreground">Últimas ações administrativas de {city.name}.</p>
      </header>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Data</th>
              <th className="p-3">Ação</th>
              <th className="p-3">Entidade</th>
              <th className="p-3">Diff</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <tr key={row.id} className="border-t align-top">
                <td className="p-3 whitespace-nowrap">
                  {row.created_at ? new Date(row.created_at).toLocaleString('pt-BR', { timeZone: city.timezone }) : '-'}
                </td>
                <td className="p-3">{row.action}</td>
                <td className="p-3">{row.entity_type}</td>
                <td className="max-w-lg p-3 font-mono text-xs break-all">
                  {row.diff ? JSON.stringify(row.diff) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {totalPages} ({count} registros)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}`}
                className="rounded-lg border px-3 py-1.5 hover:bg-muted"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}`}
                className="rounded-lg border px-3 py-1.5 hover:bg-muted"
              >
                Próxima →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

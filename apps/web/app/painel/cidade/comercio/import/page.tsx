import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { importCliqueiacheiAction } from '../actions';

export default async function BusinessImportPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = await createClient();
  const { data: history } = await supabase
    .from('audit_log')
    .select('id, action, diff, created_at')
    .eq('city_id', city.id)
    .in('action', ['businesses.import.cliqueiachei', 'businesses.import.cliqueiachei.dry_run'])
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Import Cliqueiachei</h1>
        <p className="text-muted-foreground">Cria fichas em draft com origem rastreada em import_source.</p>
      </header>

      <form action={importCliqueiacheiAction} className="rounded-2xl border bg-card p-5">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="dry_run" type="checkbox" defaultChecked />
          Rodar apenas dry_run
        </label>
        <button className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
          Importar
        </button>
      </form>

      <div className="grid gap-3">
        {(history ?? []).map((entry) => {
          const diff = entry.diff as { count?: number } | null;
          return (
            <article key={entry.id} className="rounded-2xl border bg-card p-4">
              <h2 className="font-semibold">{entry.action}</h2>
              <p className="text-sm text-muted-foreground">
                {entry.created_at} · {diff?.count ?? 0} itens
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

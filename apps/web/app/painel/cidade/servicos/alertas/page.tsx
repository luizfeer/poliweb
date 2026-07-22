import { Button } from '@/components/ui/button';
import { AlertForm } from '@/components/admin/utilities/alert-form';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { listActiveAlerts } from '@/lib/utilities/queries';
import { closeAlertAction, upsertAlertAction } from './actions';

export default async function ServicosAlertasAdminPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = await createClient();
  const [{ data: districts }, alerts] = await Promise.all([
    supabase.from('districts').select('id, name').eq('city_id', city.id).order('display_order'),
    listActiveAlerts({ city_id: city.id, includeRecentResolved: true }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Alertas de serviço</h1>
        <p className="text-muted-foreground">Avisos manuais para água, energia, clima, segurança e saúde.</p>
      </header>
      <AlertForm cityId={city.id} districts={districts ?? []} action={upsertAlertAction} />
      <div className="grid gap-3">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-2xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{alert.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {alert.type} · {alert.severity} · {alert.active ? 'ativo' : 'resolvido'}
                </p>
                {alert.description && <p className="mt-2 text-sm">{alert.description}</p>}
              </div>
              {alert.active && (
                <form action={closeAlertAction}>
                  <input type="hidden" name="id" value={alert.id} />
                  <Button type="submit" variant="secondary" size="sm">Encerrar</Button>
                </form>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getFerryRouteBySlug } from '@/lib/ferries';
import { FerryRouteForm } from '../_form';
import {
  deleteFerryAlertAction,
  deleteFerryRouteAction,
  deleteFerryScheduleAction,
  upsertFerryAlertAction,
  upsertFerryScheduleAction,
} from '../actions';

type Params = { params: Promise<{ id: string }> };

const ALERT_TYPES = [
  ['info', 'Info'],
  ['warning', 'Aviso'],
  ['maintenance', 'Manutenção'],
  ['event', 'Evento'],
  ['safety', 'Segurança'],
] as const;

export default async function EditFerryRoutePage({ params }: Params) {
  const { id } = await params;
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const supabase = await createClient();
  const { data: routeRow } = await supabase
    .from('ferry_routes')
    .select('slug')
    .eq('id', id)
    .eq('city_id', city.id)
    .maybeSingle();

  if (!routeRow) notFound();
  const route = await getFerryRouteBySlug(city.id, (routeRow as { slug: string }).slug);
  if (!route) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/painel/cidade/servicos/balsas"
        className="text-muted-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft size={14} /> Voltar
      </Link>

      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{route.name}</h1>
          <p className="text-muted-foreground">/{route.slug}</p>
        </div>
        <Link
          href={`/balsas/${route.slug}`}
          target="_blank"
          className="text-primary inline-flex items-center gap-1 text-sm"
        >
          Ver página pública <ExternalLink size={14} />
        </Link>
      </header>

      <FerryRouteForm cityId={city.id} route={route} />

      {/* ── Horários ───────────────────────────────────────── */}
      <section className="bg-card space-y-3 rounded-2xl border p-5">
        <header>
          <h2 className="text-xl font-bold">Horários</h2>
          <p className="text-muted-foreground text-sm">
            Adicione cada saída individualmente. Direção pode ser livre, ex.: Itaci &rarr; Carmo.
          </p>
        </header>

        <form
          action={upsertFerryScheduleAction}
          className="bg-background grid gap-3 rounded-xl border p-4 md:grid-cols-6"
        >
          <input type="hidden" name="route_id" value={route.id} />
          <input type="hidden" name="city_id" value={city.id} />
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="direction">Direção</Label>
            <Input id="direction" name="direction" required placeholder="Itaci → Carmo" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="origin">De</Label>
            <Input id="origin" name="origin" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="destination">Para</Label>
            <Input id="destination" name="destination" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="departs_at">Hora</Label>
            <Input id="departs_at" name="departs_at" type="time" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Nota</Label>
            <Input id="notes" name="notes" />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-5">
            <input type="checkbox" name="active" defaultChecked />
            Ativo
          </label>
          <div className="md:col-span-1 md:text-right">
            <Button type="submit">Adicionar</Button>
          </div>
        </form>

        {route.schedules.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
            Sem horários cadastrados.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2">Direção</th>
                  <th className="px-3 py-2">Hora</th>
                  <th className="px-3 py-2">Nota</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {route.schedules.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-2">{s.direction}</td>
                    <td className="px-3 py-2 font-mono">{s.departsAt}</td>
                    <td className="text-muted-foreground px-3 py-2">{s.notes}</td>
                    <td className="px-3 py-2 text-right">
                      <form action={deleteFerryScheduleAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="route_id" value={route.id} />
                        <button type="submit" className="text-xs text-rose-600 hover:underline">
                          Remover
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Alertas ────────────────────────────────────────── */}
      <section className="bg-card space-y-3 rounded-2xl border p-5">
        <header>
          <h2 className="text-xl font-bold">Avisos da rota</h2>
          <p className="text-muted-foreground text-sm">
            Manutenção, eventos especiais, alteração de horário, etc.
          </p>
        </header>

        <form
          action={upsertFerryAlertAction}
          className="bg-background grid gap-3 rounded-xl border p-4 md:grid-cols-6"
        >
          <input type="hidden" name="route_id" value={route.id} />
          <input type="hidden" name="city_id" value={city.id} />
          <div className="space-y-1.5">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              name="type"
              className="bg-background w-full rounded-md border px-3 py-2 text-sm"
            >
              {ALERT_TYPES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-1.5 md:col-span-3">
            <Label htmlFor="message">Mensagem</Label>
            <Input id="message" name="message" required />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-5">
            <input type="checkbox" name="active" defaultChecked />
            Ativo
          </label>
          <div className="md:col-span-1 md:text-right">
            <Button type="submit">Adicionar</Button>
          </div>
        </form>

        {route.alerts.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
            Sem avisos cadastrados.
          </p>
        ) : (
          <ul className="space-y-2">
            {route.alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-xl border p-3"
              >
                <div>
                  <p className="m-0 text-sm font-semibold">
                    [{a.type}] {a.title}
                  </p>
                  <p className="text-muted-foreground m-0 text-sm">{a.message}</p>
                </div>
                <form action={deleteFerryAlertAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="route_id" value={route.id} />
                  <button type="submit" className="text-xs text-rose-600 hover:underline">
                    Remover
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5">
        <h2 className="text-lg font-semibold text-rose-700">Zona de perigo</h2>
        <p className="mb-3 text-sm text-rose-700/80">
          Apaga a rota e todos os horários e avisos vinculados. Ação irreversível.
        </p>
        <form action={deleteFerryRouteAction}>
          <input type="hidden" name="id" value={route.id} />
          <Button type="submit" variant="destructive">
            Apagar rota
          </Button>
        </form>
      </section>
    </div>
  );
}

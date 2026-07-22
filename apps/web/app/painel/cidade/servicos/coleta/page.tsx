import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CsvImportDialog } from '@/components/admin/utilities/csv-import-dialog';
import { GarbageMatrix } from '@/components/admin/utilities/garbage-matrix';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getGarbageSchedule } from '@/lib/utilities/queries';
import { bulkImportGarbageAction, deleteGarbageScheduleAction, upsertGarbageScheduleAction } from './actions';

export default async function ServicosColetaAdminPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = await createClient();
  const [{ data: districts }, { data: rows }, schedule] = await Promise.all([
    supabase.from('districts').select('id, name').eq('city_id', city.id).order('display_order'),
    supabase
      .from('garbage_schedules')
      .select('id, district_id, type, day_of_week, start_time, end_time, active, districts(name)')
      .eq('city_id', city.id)
      .order('day_of_week'),
    getGarbageSchedule({ city_id: city.id }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Coleta de lixo</h1>
        <p className="text-muted-foreground">Matriz semanal por bairro e importação CSV.</p>
      </header>

      <GarbageMatrix schedule={schedule} />

      <form action={upsertGarbageScheduleAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-4">
        <input type="hidden" name="city_id" value={city.id} />
        <div className="space-y-2">
          <Label htmlFor="district_id">Bairro</Label>
          <select id="district_id" name="district_id" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" required>
            {(districts ?? []).map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <select id="type" name="type" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" defaultValue="common">
            <option value="common">Comum</option>
            <option value="recyclable">Reciclável</option>
            <option value="organic">Orgânico</option>
            <option value="electronic">Eletrônico</option>
            <option value="special">Especial</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="day_of_week">Dia</Label>
          <Input id="day_of_week" name="day_of_week" type="number" min={0} max={6} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_time">Início</Label>
          <Input id="start_time" name="start_time" placeholder="07:00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">Fim</Label>
          <Input id="end_time" name="end_time" placeholder="10:00" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Input id="notes" name="notes" />
        </div>
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" name="active" defaultChecked />
          Ativo
        </label>
        <div className="md:col-span-4">
          <Button type="submit">Salvar rota</Button>
        </div>
      </form>

      <CsvImportDialog
        title="Importar coleta"
        cityId={city.id}
        action={bulkImportGarbageAction}
        placeholder="district,type,day,start,end,notes&#10;centro,common,1,07:00,10:00,Coleta domiciliar"
      />

      <div className="grid gap-3">
        {(rows ?? []).map((row) => (
          <article key={row.id} className="flex items-center justify-between rounded-2xl border bg-card p-4">
            <div>
              <h2 className="font-semibold">{(row.districts as { name?: string } | null)?.name ?? 'Bairro'}</h2>
              <p className="text-sm text-muted-foreground">
                {row.type} · dia {row.day_of_week} · {row.start_time?.slice(0, 5) ?? '--:--'}
              </p>
            </div>
            <form action={deleteGarbageScheduleAction}>
              <input type="hidden" name="id" value={row.id} />
              <Button type="submit" variant="secondary" size="sm">Remover</Button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}

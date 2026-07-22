import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PharmacyShiftCalendar } from '@/components/admin/utilities/pharmacy-shift-calendar';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { listPharmacyShifts } from '@/lib/utilities/queries';
import { upsertPharmacyShiftAction } from '../../actions';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FarmaciaPlantaoPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: pharmacy }, shifts] = await Promise.all([
    supabase.from('pharmacies').select('id, name').eq('id', id).eq('city_id', city.id).maybeSingle(),
    listPharmacyShifts({ city_id: city.id, pharmacy_id: id }),
  ]);

  if (!pharmacy) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Plantão: {pharmacy.name}</h1>
        <p className="text-muted-foreground">Calendário mensal simplificado.</p>
      </header>
      <form action={upsertPharmacyShiftAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-4">
        <input type="hidden" name="pharmacy_id" value={pharmacy.id} />
        <div className="space-y-2">
          <Label htmlFor="start_date">Início</Label>
          <Input id="start_date" name="start_date" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Fim</Label>
          <Input id="end_date" name="end_date" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shift_type">Tipo</Label>
          <select id="shift_type" name="shift_type" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="plantao_24h">Plantão 24h</option>
            <option value="noturno">Noturno</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Input id="notes" name="notes" />
        </div>
        <div className="md:col-span-4">
          <Button type="submit">Salvar plantão</Button>
        </div>
      </form>
      <PharmacyShiftCalendar shifts={shifts} />
    </div>
  );
}

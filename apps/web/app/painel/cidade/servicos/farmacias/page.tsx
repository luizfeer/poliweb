import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CsvImportDialog } from '@/components/admin/utilities/csv-import-dialog';
import { PharmacyShiftCalendar } from '@/components/admin/utilities/pharmacy-shift-calendar';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { listPharmacies, listPharmacyShifts } from '@/lib/utilities/queries';
import { bulkImportShiftsAction, upsertPharmacyAction, upsertPharmacyShiftAction } from './actions';

export default async function ServicosFarmaciasAdminPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const [pharmacies, shifts] = await Promise.all([
    listPharmacies({ city_id: city.id, includeInactive: true }),
    listPharmacyShifts({ city_id: city.id }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Farmácias</h1>
        <p className="text-muted-foreground">Cadastro de farmácias e escala de plantão.</p>
      </header>
      <form action={upsertPharmacyAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-4">
        <input type="hidden" name="city_id" value={city.id} />
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" name="address" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input id="lat" name="lat" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input id="lng" name="lng" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="google_maps_url">Google Maps</Label>
          <Input id="google_maps_url" name="google_maps_url" type="url" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_24h" />
          24h
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked />
          Ativa
        </label>
        <div className="md:col-span-4">
          <Button type="submit">Salvar farmácia</Button>
        </div>
      </form>

      <form action={upsertPharmacyShiftAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="pharmacy_id">Farmácia</Label>
          <select id="pharmacy_id" name="pharmacy_id" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
            {pharmacies.map((pharmacy) => <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>)}
          </select>
        </div>
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
        <div className="md:col-span-5">
          <Button type="submit">Salvar plantão</Button>
        </div>
      </form>

      <CsvImportDialog
        title="Importar plantões"
        cityId={city.id}
        action={bulkImportShiftsAction}
        placeholder="pharmacy,start_date,end_date,shift_type,notes&#10;Farmacia Central,2026-05-01,2026-05-01,plantao_24h,Escala oficial"
      />

      <PharmacyShiftCalendar shifts={shifts} />

      <div className="grid gap-3">
        {pharmacies.map((pharmacy) => (
          <article key={pharmacy.id} className="flex items-center justify-between rounded-2xl border bg-card p-4">
            <div>
              <h2 className="font-semibold">{pharmacy.name}</h2>
              <p className="text-sm text-muted-foreground">{pharmacy.phone ?? 'sem telefone'} · {pharmacy.active ? 'ativa' : 'inativa'}</p>
            </div>
            <Link className="rounded-lg border px-3 py-2 text-sm hover:bg-muted" href={`/painel/cidade/servicos/farmacias/${pharmacy.id}/plantao`}>
              Plantão
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

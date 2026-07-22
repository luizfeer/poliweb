import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AmenitiesPicker } from './amenities-picker';

type District = { id: string; name: string };

export function AccommodationForm({ cityId, districts, action }: { cityId: string; districts: District[]; action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-4">
      <input type="hidden" name="city_id" value={cityId} />
      <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" name="name" required /></div>
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <select id="type" name="type" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
          <option value="pousada">Pousada</option><option value="hotel">Hotel</option><option value="chale">Chalé</option><option value="airbnb">Airbnb</option><option value="camping">Camping</option><option value="rancho">Rancho</option><option value="casa_temporada">Casa temporada</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="district_id">Bairro</Label>
        <select id="district_id" name="district_id" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
          <option value="">Sem bairro</option>
          {districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
        </select>
      </div>
      <div className="space-y-2"><Label htmlFor="slug">Slug</Label><Input id="slug" name="slug" /></div>
      <div className="space-y-2 md:col-span-2"><Label htmlFor="short_description">Descrição curta</Label><Input id="short_description" name="short_description" maxLength={160} /></div>
      <div className="space-y-2"><Label htmlFor="price_min">Preço mín.</Label><Input id="price_min" name="price_min" type="number" step="0.01" /></div>
      <div className="space-y-2"><Label htmlFor="price_max">Preço máx.</Label><Input id="price_max" name="price_max" type="number" step="0.01" /></div>
      <div className="space-y-2 md:col-span-4"><Label htmlFor="description">Descrição</Label><textarea id="description" name="description" rows={4} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" /></div>
      <div className="space-y-2 md:col-span-2"><Label htmlFor="address">Endereço</Label><Input id="address" name="address" /></div>
      <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" name="phone" /></div>
      <div className="space-y-2"><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" name="whatsapp" /></div>
      <div className="space-y-2"><Label htmlFor="booking_url">Booking</Label><Input id="booking_url" name="booking_url" type="url" /></div>
      <div className="space-y-2"><Label htmlFor="airbnb_url">Airbnb</Label><Input id="airbnb_url" name="airbnb_url" type="url" /></div>
      <AmenitiesPicker />
      <div className="space-y-2"><Label htmlFor="max_guests">Hóspedes</Label><Input id="max_guests" name="max_guests" type="number" /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="near_lake" /> Pé na água</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="has_marina" /> Marina</label>
      <input type="hidden" name="status" value="draft" />
      <div className="md:col-span-4"><Button type="submit">Salvar hospedagem</Button></div>
    </form>
  );
}

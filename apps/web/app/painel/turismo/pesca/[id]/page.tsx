import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AmenitiesPicker } from '@/components/admin/tourism/amenities-picker';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { upsertFishingGuideAction } from '../actions';

export default async function FishingGuideEditPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-bold">Guia de pesca</h1></header>
      <form action={upsertFishingGuideAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-4">
        <input type="hidden" name="city_id" value={city.id} />
        <div className="space-y-2"><Label htmlFor="full_name">Nome</Label><Input id="full_name" name="full_name" required /></div>
        <div className="space-y-2"><Label htmlFor="license_number">Licença</Label><Input id="license_number" name="license_number" /></div>
        <AmenitiesPicker name="services" label="Serviços" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="has_boat" /> Tem barco</label>
        <div className="space-y-2 md:col-span-4"><Label htmlFor="about">Sobre</Label><textarea id="about" name="about" rows={4} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" /></div>
        <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" name="phone" /></div>
        <div className="space-y-2"><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" name="whatsapp" /></div>
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" /></div>
        <div className="space-y-2"><Label htmlFor="price_range">Faixa</Label><Input id="price_range" name="price_range" /></div>
        <div className="md:col-span-4"><Button type="submit">Salvar guia</Button></div>
      </form>
    </div>
  );
}

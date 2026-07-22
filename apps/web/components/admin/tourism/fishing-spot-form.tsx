import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AmenitiesPicker } from './amenities-picker';

export function FishingSpotForm({ cityId, action }: { cityId: string; action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">
      <input type="hidden" name="city_id" value={cityId} />
      <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" name="name" required /></div>
      <div className="space-y-2"><Label htmlFor="status">Status</Label><select id="status" name="status" className="w-full rounded-lg border bg-background px-3 py-2 text-sm"><option value="draft">Draft</option><option value="published">Publicado</option></select></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="requires_guide" /> Exige guia</label>
      <div className="space-y-2 md:col-span-3"><Label htmlFor="description">Descrição</Label><textarea id="description" name="description" rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" /></div>
      <AmenitiesPicker name="species" label="Espécies" />
      <div className="space-y-2"><Label htmlFor="defeso_period">Defeso</Label><Input id="defeso_period" name="defeso_period" /></div>
      <div className="space-y-2"><Label htmlFor="access_difficulty">Acesso</Label><Input id="access_difficulty" name="access_difficulty" /></div>
      <div className="space-y-2 md:col-span-3"><Label htmlFor="regulations">Regulamento</Label><textarea id="regulations" name="regulations" rows={2} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" /></div>
      <div className="md:col-span-3"><Button type="submit">Salvar ponto</Button></div>
    </form>
  );
}

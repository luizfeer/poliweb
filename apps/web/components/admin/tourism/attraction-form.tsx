import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AttractionForm({ cityId, action }: { cityId: string; action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-4">
      <input type="hidden" name="city_id" value={cityId} />
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" placeholder="recanto-da-furnas" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <select id="type" name="type" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
          <option value="balneario">Balneário</option>
          <option value="mirante">Mirante</option>
          <option value="cachoeira">Cachoeira</option>
          <option value="trilha">Trilha</option>
          <option value="igreja">Igreja</option>
          <option value="museu">Museu</option>
          <option value="parque">Parque</option>
          <option value="praia">Praia</option>
          <option value="lago">Lago</option>
          <option value="historico">Histórico</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select id="status" name="status" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
          <option value="draft">Rascunho</option>
          <option value="pending">Pendente</option>
          <option value="published">Publicado</option>
          <option value="rejected">Rejeitado</option>
          <option value="archived">Arquivado</option>
        </select>
      </div>
      <div className="space-y-2 md:col-span-4">
        <Label htmlFor="description">Descrição</Label>
        <textarea id="description" name="description" rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" name="address" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lat">Latitude</Label>
        <Input id="lat" name="lat" inputMode="decimal" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lng">Longitude</Label>
        <Input id="lng" name="lng" inputMode="decimal" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="difficulty">Dificuldade</Label>
        <Input id="difficulty" name="difficulty" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="duration_minutes">Duração min.</Label>
        <Input id="duration_minutes" name="duration_minutes" type="number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="entry_fee">Entrada</Label>
        <Input id="entry_fee" name="entry_fee" placeholder="Gratuito, R$ 20..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="best_season">Melhor época</Label>
        <Input id="best_season" name="best_season" />
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
        <Label htmlFor="website">Site</Label>
        <Input id="website" name="website" type="url" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instagram">Instagram</Label>
        <Input id="instagram" name="instagram" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="amenities">Comodidades</Label>
        <Input id="amenities" name="amenities" placeholder="banheiro, estacionamento, restaurante" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price_range">Faixa de preço</Label>
        <Input id="price_range" name="price_range" placeholder="$, $$, gratuito" />
      </div>
      <div className="flex items-center gap-4 pt-7">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" /> Destaque</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pet_friendly" /> Pet</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="family_friendly" /> Família</label>
      </div>
      <div className="space-y-2 md:col-span-4">
        <Label htmlFor="tips">Dicas</Label>
        <textarea id="tips" name="tips" rows={2} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
      </div>
      <div className="md:col-span-4">
        <Button type="submit">Salvar atração</Button>
      </div>
    </form>
  );
}

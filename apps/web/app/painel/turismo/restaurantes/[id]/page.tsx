import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AmenitiesPicker } from '@/components/admin/tourism/amenities-picker';
import { ImageUploadField } from '@/components/admin/media/image-upload-field';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { upsertRestaurantAction } from '../actions';

type PageProps = { params: Promise<{ id: string }> };

export default async function RestaurantEditPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const { id } = await params;
  const supabase = await createClient();
  const { data: restaurant } = id === 'novo'
    ? { data: null }
    : await supabase.from('restaurants').select('name, cover_url, photos').eq('id', id).eq('city_id', city.id).maybeSingle();
  const restaurantName = restaurant?.name ?? 'Restaurante';

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-bold">{id === 'novo' ? 'Novo restaurante' : 'Editar restaurante'}</h1></header>
      <form action={upsertRestaurantAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-4">
        <input type="hidden" name="city_id" value={city.id} />
        <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" name="name" required /></div>
        <div className="space-y-2"><Label htmlFor="price_range">Preço</Label><select id="price_range" name="price_range" className="w-full rounded-lg border bg-background px-3 py-2 text-sm"><option value="">N/I</option><option value="$">$</option><option value="$$">$$</option><option value="$$$">$$$</option></select></div>
        <AmenitiesPicker name="cuisine" label="Cozinhas" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="delivery" /> Delivery</label>
        <div className="space-y-2 md:col-span-4"><Label htmlFor="description">Descrição</Label><textarea id="description" name="description" rows={4} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" /></div>
        <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" name="phone" /></div>
        <div className="space-y-2"><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" name="whatsapp" /></div>
        <div className="space-y-2"><Label htmlFor="ifood_url">iFood</Label><Input id="ifood_url" name="ifood_url" type="url" /></div>
        <input type="hidden" name="status" value="draft" />
        <div className="md:col-span-4"><Button type="submit">Salvar restaurante</Button></div>
      </form>
      {id !== 'novo' && (
        <div className="grid gap-4 md:grid-cols-2">
          <ImageUploadField
            entityType="restaurant"
            entityId={id}
            role="cover"
            label="Capa"
            currentUrl={restaurant?.cover_url}
            revalidatePath="/painel/turismo"
            helpText="Imagem principal do restaurante."
            contextLabel={`Capa · ${restaurantName}`}
          />
          <ImageUploadField
            entityType="restaurant"
            entityId={id}
            role="gallery"
            label="Galeria"
            currentUrl={Array.isArray(restaurant?.photos) ? restaurant.photos.find((item): item is string => typeof item === 'string') : null}
            revalidatePath="/painel/turismo"
            helpText="Fotos adicionais."
            contextLabel={`Galeria · ${restaurantName}`}
          />
        </div>
      )}
    </div>
  );
}

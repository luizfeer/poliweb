import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AmenitiesPicker } from '@/components/admin/tourism/amenities-picker';
import { ItineraryBuilder } from '@/components/admin/tourism/itinerary-builder';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { listBusinesses } from '@/lib/businesses';
import { listAttractions, listTourPackages } from '@/lib/tourism';
import { upsertTourPackageAction } from './actions';

export default async function PacotesAdminPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const [packages, attractions, businesses] = await Promise.all([
    listTourPackages({ city_id: city.id, includeDrafts: true, limit: 200 }),
    listAttractions({ city_id: city.id, includeDrafts: true, limit: 200 }),
    listBusinesses({ city_id: city.id, limit: 200 }),
  ]);
  const initialItinerary = attractions.slice(0, 3).map((item, index) => ({
    stop_order: index + 1,
    attraction_id: item.id,
    custom_title: item.name,
    duration_minutes: item.durationMinutes ?? 60,
    notes: '',
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Roteiros</h1>
        <p className="text-muted-foreground">Roteiros curados e ofertas turisticas. A tabela interna continua <code>tour_packages</code>.</p>
      </header>
      <form action={upsertTourPackageAction} className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-4">
        <input type="hidden" name="city_id" value={city.id} />
        <div className="space-y-2"><Label htmlFor="title">Titulo</Label><Input id="title" name="title" required /></div>
        <div className="space-y-2"><Label htmlFor="slug">Slug</Label><Input id="slug" name="slug" placeholder="fim-de-semana-em-furnas" /></div>
        <div className="space-y-2"><Label htmlFor="duration_hours">Duracao</Label><Input id="duration_hours" name="duration_hours" type="number" step="0.5" /></div>
        <div className="space-y-2"><Label htmlFor="price">Preco</Label><Input id="price" name="price" type="number" step="0.01" /></div>
        <div className="space-y-2"><Label htmlFor="difficulty">Dificuldade</Label><Input id="difficulty" name="difficulty" /></div>
        <div className="space-y-2"><Label htmlFor="total_duration_hours">Duracao total</Label><Input id="total_duration_hours" name="total_duration_hours" type="number" step="0.25" /></div>
        <div className="space-y-2"><Label htmlFor="total_distance_km">Distancia km</Label><Input id="total_distance_km" name="total_distance_km" type="number" step="0.1" /></div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="draft">Rascunho</option>
            <option value="pending">Pendente</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
        <div className="space-y-2 md:col-span-4"><Label htmlFor="description">Descricao</Label><textarea id="description" name="description" rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" /></div>
        <AmenitiesPicker name="includes" label="Inclui" />
        <div className="space-y-2"><Label htmlFor="contact_phone">Telefone</Label><Input id="contact_phone" name="contact_phone" /></div>
        <div className="space-y-2"><Label htmlFor="contact_whatsapp">WhatsApp</Label><Input id="contact_whatsapp" name="contact_whatsapp" /></div>
        <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" name="featured" /> Destaque</label>
        <ItineraryBuilder
          attractions={attractions.map((item) => ({ id: item.id, name: item.name }))}
          businesses={businesses.map((item) => ({ id: item.id, name: item.name }))}
          initialStops={initialItinerary}
        />
        <div className="md:col-span-4"><Button type="submit">Salvar roteiro</Button></div>
      </form>
      <div className="grid gap-3">
        {packages.map((item) => (
          <article key={item.id} className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold">{item.title}</h2>
            <p className="text-sm text-muted-foreground">{item.status} · {item.price ?? 'sob consulta'} · {item.itinerary.length} paradas</p>
            {item.status === 'published' ? (
              <Link
                className="text-sm text-primary underline"
                href={`/turismo/roteiros/${item.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver público
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

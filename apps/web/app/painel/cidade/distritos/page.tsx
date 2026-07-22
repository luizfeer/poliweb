import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { deleteDistrictAction, upsertDistrictAction } from './actions';

export default async function DistritosPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = await createClient();
  const { data: districts } = await supabase
    .from('districts')
    .select('*')
    .eq('city_id', city.id)
    .order('display_order');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Distritos</h1>
        <p className="text-muted-foreground">Bairros e regiões usados nos filtros da cidade.</p>
      </header>

      <form action={upsertDistrictAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" required placeholder="centro" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required placeholder="Centro" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zone">Zona</Label>
          <Input id="zone" name="zone" placeholder="centro" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="display_order">Ordem</Label>
          <Input id="display_order" name="display_order" type="number" defaultValue="0" />
        </div>
        <div className="md:col-span-4">
          <Button type="submit">Adicionar distrito</Button>
        </div>
      </form>

      <div className="grid gap-3">
        {(districts ?? []).map((district) => (
          <article
            key={district.id}
            className="flex items-center justify-between rounded-2xl border bg-card p-4"
          >
            <div>
              <h2 className="font-semibold">{district.name}</h2>
              <p className="text-sm text-muted-foreground">
                {district.slug} · {district.zone ?? 'sem zona'} · ordem {district.display_order}
              </p>
            </div>
            <form action={deleteDistrictAction}>
              <input type="hidden" name="id" value={district.id} />
              <Button type="submit" variant="secondary" size="sm">
                Remover
              </Button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}

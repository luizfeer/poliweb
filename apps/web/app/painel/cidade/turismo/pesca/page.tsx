import { FishingSpotForm } from '@/components/admin/tourism/fishing-spot-form';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { listFishingGuides, listFishingSpots } from '@/lib/tourism';
import { upsertFishingSpotAction } from './actions';

export default async function PescaAdminPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const [spots, guides] = await Promise.all([
    listFishingSpots({ city_id: city.id, includeDrafts: true, limit: 200 }),
    listFishingGuides({ city_id: city.id, includeDrafts: true, limit: 200 }),
  ]);

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-bold">Pesca</h1><p className="text-muted-foreground">Pontos públicos e guias para verificação.</p></header>
      <FishingSpotForm cityId={city.id} action={upsertFishingSpotAction} />
      <section className="grid gap-3 md:grid-cols-2">
        {spots.map((item) => <article key={item.id} className="rounded-2xl border bg-card p-4"><h2 className="font-semibold">{item.name}</h2><p className="text-sm text-muted-foreground">Ponto · {item.status}</p></article>)}
        {guides.map((item) => <article key={item.id} className="rounded-2xl border bg-card p-4"><h2 className="font-semibold">{item.fullName}</h2><p className="text-sm text-muted-foreground">Guia · {item.status} · {item.verified ? 'verificado' : 'não verificado'}</p></article>)}
      </section>
    </div>
  );
}

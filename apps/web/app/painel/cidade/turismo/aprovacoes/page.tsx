import { Button } from '@/components/ui/button';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { approveTourismEntityAction } from './actions';
import { moderateAttractionPhotoAction, moderateAttractionReviewAction } from '../atracoes/actions';

export default async function AprovacoesTurismoPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = await createClient();
  const [accommodations, restaurants, guides, reviews, photos] = await Promise.all([
    supabase
      .from('accommodations')
      .select('id, name, status')
      .eq('city_id', city.id)
      .eq('status', 'pending'),
    supabase
      .from('restaurants')
      .select('id, name, status')
      .eq('city_id', city.id)
      .eq('status', 'pending'),
    supabase
      .from('fishing_guides')
      .select('id, full_name, status')
      .eq('city_id', city.id)
      .eq('status', 'pending'),
    supabase
      .from('attraction_reviews')
      .select('id, attraction_id, rating, title, comment, attractions(name)')
      .eq('city_id', city.id)
      .eq('status', 'pending'),
    supabase
      .from('attraction_photos')
      .select('id, attraction_id, caption, storage_path, media_type, attractions(name)')
      .eq('city_id', city.id)
      .eq('status', 'pending'),
  ]);

  const items = [
    ...(accommodations.data ?? []).map((item) => ({
      id: item.id,
      title: item.name,
      type: 'accommodation' as const,
    })),
    ...(restaurants.data ?? []).map((item) => ({
      id: item.id,
      title: item.name,
      type: 'restaurant' as const,
    })),
    ...(guides.data ?? []).map((item) => ({
      id: item.id,
      title: item.full_name,
      type: 'fishing_guide' as const,
    })),
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Aprovações de turismo</h1>
        <p className="text-muted-foreground">Fila de fichas, reviews e fotos pendentes.</p>
      </header>

      <section className="grid gap-3">
        {items.map((item) => (
          <article key={`${item.type}-${item.id}`} className="bg-card rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="text-muted-foreground text-sm">{item.type}</p>
              </div>
              <div className="flex gap-2">
                <form action={approveTourismEntityAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="entity_type" value={item.type} />
                  <input type="hidden" name="action" value="approve" />
                  <Button type="submit" size="sm">
                    Aprovar
                  </Button>
                </form>
                <form action={approveTourismEntityAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="entity_type" value={item.type} />
                  <input type="hidden" name="action" value="reject" />
                  <Button type="submit" size="sm" variant="secondary">
                    Rejeitar
                  </Button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold">Reviews de atrações</h2>
          <div className="mt-3 grid gap-3">
            {(reviews.data ?? []).map((review) => (
              <article key={review.id} className="bg-background rounded-xl border p-4">
                <h3 className="font-semibold">
                  {review.title ?? 'Avaliação'} · {review.rating}/5
                </h3>
                <p className="text-muted-foreground text-sm">
                  {review.attractions?.name ?? 'Atração'} · {review.comment}
                </p>
                <div className="mt-3 flex gap-2">
                  <form action={moderateAttractionReviewAction}>
                    <input type="hidden" name="review_id" value={review.id} />
                    <input type="hidden" name="attraction_id" value={review.attraction_id} />
                    <input type="hidden" name="status" value="published" />
                    <Button type="submit" size="sm">
                      Aprovar
                    </Button>
                  </form>
                  <form action={moderateAttractionReviewAction}>
                    <input type="hidden" name="review_id" value={review.id} />
                    <input type="hidden" name="attraction_id" value={review.attraction_id} />
                    <input type="hidden" name="status" value="rejected" />
                    <Button type="submit" size="sm" variant="secondary">
                      Rejeitar
                    </Button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold">Mídias da comunidade</h2>
          <div className="mt-3 grid gap-3">
            {(photos.data ?? []).map((photo) => (
              <article key={photo.id} className="bg-background rounded-xl border p-4">
                <h3 className="font-semibold">{photo.attractions?.name ?? 'Atração'}</h3>
                <p className="text-muted-foreground text-sm">
                  {photo.media_type === 'video' ? 'Vídeo' : 'Foto'} ·{' '}
                  {photo.caption ?? photo.storage_path}
                </p>
                <div className="mt-3 flex gap-2">
                  <form action={moderateAttractionPhotoAction}>
                    <input type="hidden" name="photo_id" value={photo.id} />
                    <input type="hidden" name="attraction_id" value={photo.attraction_id} />
                    <input type="hidden" name="status" value="published" />
                    <Button type="submit" size="sm">
                      Aprovar
                    </Button>
                  </form>
                  <form action={moderateAttractionPhotoAction}>
                    <input type="hidden" name="photo_id" value={photo.id} />
                    <input type="hidden" name="attraction_id" value={photo.attraction_id} />
                    <input type="hidden" name="status" value="rejected" />
                    <Button type="submit" size="sm" variant="secondary">
                      Rejeitar
                    </Button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

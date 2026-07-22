import { Link } from '@/components/navigation/link';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { replyReviewAction } from '../../actions';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BusinessReviewsPage({ params }: PageProps) {
  const [{ id }, city] = await Promise.all([params, getCurrentCity()]);
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const supabase = await createClient();
  const [{ data: business }, { data: reviews }] = await Promise.all([
    supabase.from('businesses').select('id, name').eq('id', id).eq('city_id', city.id).single(),
    supabase
      .from('business_reviews')
      .select('id, rating, title, comment, status, reply_owner, created_at, profiles(full_name)')
      .eq('business_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (!business) return null;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border bg-card p-6">
        <Link className="text-sm text-muted-foreground hover:underline" href={`/painel/comercio/${business.id}`}>
          ← Voltar para ficha
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Reviews de {business.name}</h1>
      </header>

      <div className="grid gap-3">
        {(reviews ?? []).map((review) => {
          const profile = review.profiles as { full_name?: string | null } | null;
          return (
            <article key={review.id} className="rounded-2xl border bg-card p-5">
              <p className="text-sm font-semibold">
                {review.rating} estrelas · {profile?.full_name ?? 'Cidadão'} · {review.status}
              </p>
              {review.title && <h2 className="mt-2 font-semibold">{review.title}</h2>}
              {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
              {review.reply_owner && (
                <blockquote className="mt-3 rounded-lg bg-muted p-3 text-sm">
                  Resposta atual: {review.reply_owner}
                </blockquote>
              )}
              <form action={replyReviewAction} className="mt-4 grid gap-2">
                <input type="hidden" name="review_id" value={review.id} />
                <textarea
                  className="min-h-20 rounded-lg border px-3 py-2 text-sm"
                  name="reply_owner"
                  placeholder="Responder como dono"
                  defaultValue={review.reply_owner ?? ''}
                  required
                />
                <div>
                  <button className="rounded-lg border px-4 py-2 text-sm hover:bg-muted" type="submit">
                    Salvar resposta
                  </button>
                </div>
              </form>
            </article>
          );
        })}
        {(reviews ?? []).length === 0 && (
          <div className="rounded-2xl border bg-card p-6 text-muted-foreground">
            Nenhum review encontrado para esta ficha.
          </div>
        )}
      </div>
    </div>
  );
}

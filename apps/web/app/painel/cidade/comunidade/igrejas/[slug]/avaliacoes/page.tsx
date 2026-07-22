import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { replyChurchReviewAction, updateChurchReviewStatusAction } from '../actions';

type PageProps = {
  params: Promise<{ slug: string }>;
};

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  published: 'Publicado',
  rejected: 'Rejeitado',
  archived: 'Arquivado',
};

export default async function ChurchReviewsPage({ params }: PageProps) {
  const [{ slug }, city] = await Promise.all([params, getCurrentCity()]);
  if (!city || !city.modules.includes('community')) notFound();

  await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const supabase = await createClient();
  const { data: church } = await supabase.from('churches').select('id, name, slug').eq('slug', slug).eq('city_id', city.id).single();
  if (!church) notFound();
  const { data: reviews } = await supabase
    .from('church_reviews')
    .select('id, church_id, rating, title, comment, status, reply_owner, created_at, profiles(full_name)')
    .eq('city_id', city.id)
    .eq('church_id', church.id)
    .order('created_at', { ascending: false });
  const churchReviews = reviews ?? [];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border bg-card p-6">
        <Link className="text-sm text-muted-foreground hover:underline" href={`/painel/cidade/comunidade/igrejas/${church.slug}`}>
          Voltar para ficha
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Avaliacoes de {church.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Publique, rejeite e responda avaliacoes recebidas na pagina publica.</p>
      </header>

      <div className="grid gap-3">
        {churchReviews.map((review) => {
          const profile = review.profiles as { full_name?: string | null } | null;
          const status = review.status ?? 'pending';
          return (
            <article key={review.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  {review.rating} estrelas - {profile?.full_name ?? 'Cidadao'} - {statusLabel[status] ?? status}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(['published', 'rejected', 'archived'] as const).map((nextStatus) => (
                    <form key={nextStatus} action={updateChurchReviewStatusAction}>
                      <input type="hidden" name="review_id" value={review.id} />
                      <input type="hidden" name="church_id" value={church.id} />
                      <input type="hidden" name="status" value={nextStatus} />
                      <Button type="submit" variant={nextStatus === 'published' ? 'default' : 'outline'} size="sm">
                        {statusLabel[nextStatus]}
                      </Button>
                    </form>
                  ))}
                </div>
              </div>
              {review.title ? <h2 className="mt-2 font-semibold">{review.title}</h2> : null}
              {review.comment ? <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p> : null}
              {review.reply_owner ? (
                <blockquote className="mt-3 rounded-lg bg-muted p-3 text-sm">Resposta atual: {review.reply_owner}</blockquote>
              ) : null}
              <form action={replyChurchReviewAction} className="mt-4 grid gap-2">
                <input type="hidden" name="review_id" value={review.id} />
                <input type="hidden" name="church_id" value={church.id} />
                <textarea
                  className="min-h-20 rounded-lg border px-3 py-2 text-sm"
                  name="reply_owner"
                  placeholder="Responder como igreja"
                  defaultValue={review.reply_owner ?? ''}
                  required
                />
                <div>
                  <Button type="submit" variant="outline" size="sm">
                    Salvar resposta
                  </Button>
                </div>
              </form>
            </article>
          );
        })}
        {churchReviews.length === 0 ? (
          <div className="rounded-2xl border bg-card p-6 text-muted-foreground">Nenhuma avaliacao encontrada para esta igreja.</div>
        ) : null}
      </div>
    </div>
  );
}

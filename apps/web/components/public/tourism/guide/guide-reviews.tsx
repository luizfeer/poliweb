import { ExternalLink, MessageSquareQuote, Star } from 'lucide-react';
import { formatGoogleImportReviewTime } from '@/lib/format/google-import-review-time';
import type { GoogleAttractionReview, GuideReview } from '@/lib/tourism/types';

function StarRating({ rating }: { rating: number | null }) {
  const safe = rating ?? 0;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${safe.toFixed(1)} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < Math.round(safe)
              ? 'size-3.5 fill-sun-500 text-sun-500'
              : 'size-3.5 text-ink-300'
          }
          strokeWidth={2.4}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function GuideReviews({
  reviews,
  googleReviews,
  averageRating,
  totalCount,
}: {
  reviews: GuideReview[];
  googleReviews: GoogleAttractionReview[];
  averageRating: number | null;
  totalCount: number;
}) {
  const total = reviews.length + googleReviews.length || totalCount;

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="m-0 font-display text-[22px] font-extrabold tracking-tight text-ink-900 md:text-[26px]">
          Avaliações
        </h2>
        <div className="flex items-center gap-2 text-[13px]">
          {averageRating ? (
            <span className="flex items-center gap-1 font-bold text-ink-900">
              <Star className="size-4 fill-sun-500 text-sun-500" aria-hidden="true" />
              {averageRating.toFixed(1).replace('.', ',')}
            </span>
          ) : null}
          <span className="text-ink-500">{total} avaliações</span>
        </div>
      </div>

      <div className="space-y-2">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-lg border border-ink-100 bg-white p-4 text-[13px]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StarRating rating={review.rating} />
              <strong>{review.title ?? 'Avaliação'}</strong>
              {review.visitDate ? (
                <span className="text-ink-500">
                  Visitou em{' '}
                  {new Date(review.visitDate).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              ) : null}
            </div>
            {review.comment ? (
              <p className="m-0 mt-2 leading-relaxed text-ink-700">{review.comment}</p>
            ) : null}
            {review.replyOwner ? (
              <blockquote className="mt-2 rounded-md bg-paper-deep p-2 text-[12px] text-ink-700">
                Resposta: {review.replyOwner}
              </blockquote>
            ) : null}
          </article>
        ))}

        {googleReviews.map((review) => {
          const timeLabel = formatGoogleImportReviewTime(review);
          return (
            <article
              key={`google-${review.id}`}
              className="rounded-lg border border-ink-100 bg-paper p-4 text-[13px]"
            >
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-600">
                <MessageSquareQuote className="size-3.5 text-ink-500" aria-hidden="true" />
                <span className="font-semibold text-ink-900">
                  {review.authorName ?? 'Usuário do Google'}
                </span>
                <StarRating rating={review.rating} />
                <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-sky-700">
                  Google
                </span>
                {timeLabel ? <span>{timeLabel}</span> : null}
              </div>
              {review.text ? (
                <p className="m-0 mt-2 leading-relaxed text-ink-800">{review.text}</p>
              ) : null}
              {review.authorUrl ? (
                <a
                  href={review.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-sky-700 hover:underline"
                >
                  Ver no Google
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              ) : null}
            </article>
          );
        })}

        {reviews.length === 0 && googleReviews.length === 0 ? (
          <p className="m-0 rounded-lg border border-ink-100 bg-white p-4 text-[13px] text-ink-700">
            Ainda não há avaliações publicadas para este guia.
          </p>
        ) : null}
      </div>
    </div>
  );
}

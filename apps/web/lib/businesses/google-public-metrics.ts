import type { Business } from '@/lib/businesses/types';

/** Texto do tooltip nativo quando a vitrine mistura métricas do portal com o import Google. */
export const GOOGLE_PUBLIC_METRICS_TOOLTIP =
  'Nota e quantidade de avaliações incluem dados públicos importados do Google.';

/** Indica se a nota ou o total de avaliações exibidos incorporam o import Google (ver `mergePlatformAndGoogleRatings`). */
export function businessPublicMetricsIncludeGoogle(business: Business): boolean {
  const g = business.googleImportSource;
  if (!g) return false;

  const portal = business.portalReviewsCount ?? 0;
  const total = business.reviewsCount ?? 0;
  if (total > portal) return true;

  const hasGoogleSignal =
    (typeof g.rating === 'number' && Number.isFinite(g.rating)) ||
    (typeof g.userRatingCount === 'number' && g.userRatingCount > 0) ||
    (Array.isArray(g.approvedReviews) && g.approvedReviews.length > 0);

  if (!hasGoogleSignal) return false;

  return portal === 0 && typeof business.rating === 'number';
}

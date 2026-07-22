type BusinessRatingRow = {
  import_source: unknown;
  business_reviews:
    | { rating: number | null; status: string | null }[]
    | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getGooglePlacesSource(value: unknown): Record<string, unknown> | null {
  return asRecord(asRecord(value)?.google_places);
}

export function getBusinessRating(
  row: BusinessRatingRow,
): { rating: number | null; reviewsCount: number | null } {
  const portalReviews = (row.business_reviews ?? []).filter(
    (review): review is { rating: number; status: string | null } =>
      review.status === 'published' && typeof review.rating === 'number',
  );
  const portalCount = portalReviews.length;
  const portalAverage =
    portalCount > 0
      ? portalReviews.reduce((sum, review) => sum + review.rating, 0) / portalCount
      : null;

  const google = getGooglePlacesSource(row.import_source);
  const googleRating = asNumber(google?.rating);
  const googleCount = asNumber(google?.user_rating_count);
  const approvedGoogleCount = Array.isArray(google?.approved_reviews)
    ? google.approved_reviews.length
    : 0;
  const resolvedGoogleCount =
    googleCount !== null && googleCount > 0 ? Math.round(googleCount) : approvedGoogleCount;

  if (portalAverage !== null && googleRating !== null && resolvedGoogleCount > 0) {
    const total = portalCount + resolvedGoogleCount;
    return {
      rating: (portalAverage * portalCount + googleRating * resolvedGoogleCount) / total,
      reviewsCount: total,
    };
  }

  if (portalAverage !== null) {
    return {
      rating: portalAverage,
      reviewsCount: portalCount + resolvedGoogleCount || portalCount,
    };
  }

  if (googleRating !== null) {
    return {
      rating: googleRating,
      reviewsCount: resolvedGoogleCount > 0 ? resolvedGoogleCount : null,
    };
  }

  return { rating: null, reviewsCount: portalCount + resolvedGoogleCount || null };
}

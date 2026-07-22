import { cachedJson, invalidate } from '@/lib/api/cached-json';
import { getBusinessRating } from '@/lib/businesses/business-rating';
import { env } from '@/lib/env';
import { asStringArray, firstImage } from '@/lib/media/cover-image';
import { supabase } from '@/lib/supabase';
import type {
  Amenity,
  Business,
  BusinessDetail,
  BusinessPromotion,
  BusinessReview,
  EntityPost,
  GoogleImportReview,
  GoogleImportSource,
  GoogleImportSummary,
  Hours,
  PaymentMethod,
  RelatedBusiness,
} from '@/lib/businesses/types';

const DETAIL_TTL_MS = 5 * 60 * 1000;

/** Mesmo select público do web (`apps/web/lib/businesses/queries.ts`). */
const BUSINESS_PUBLIC_SELECT = `
  *,
  cities(slug),
  districts(name),
  business_category_assignments(
    category_id,
    is_primary,
    business_categories(slug, name, parent_id, icon)
  ),
  business_reviews(rating, status)
`;

type BusinessRow = {
  id: string;
  city_id: string;
  cities?: { slug: string | null } | null;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  google_maps_url: string | null;
  address: string | null;
  district_id: string | null;
  districts?: { name: string | null } | null;
  cep: string | null;
  lat: number | null;
  lng: number | null;
  hours: unknown;
  amenities: unknown;
  payment_methods: unknown;
  cover_url: string | null;
  logo_url: string | null;
  og_image_url: string | null;
  og_square_image_url: string | null;
  photos: unknown;
  import_source: unknown;
  status: Business['status'] | null;
  plan: Business['plan'] | null;
  featured: boolean | null;
  verified: boolean | null;
  claimed: boolean | null;
  ordering_enabled: boolean | null;
  views_count: number | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  business_category_assignments?:
    | {
        category_id: string;
        is_primary: boolean | null;
        business_categories: {
          slug: string;
          name: string;
          parent_id: string | null;
          icon: string | null;
        } | null;
      }[]
    | null;
  business_reviews?: { rating: number; status: Business['status'] | null }[] | null;
};

// ───────────────────── helpers puros (porte do web) ─────────────────────

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asHours(value: unknown): Hours | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Hours) : undefined;
}

function asGoogleSummaries(value: unknown): GoogleImportSummary[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const summaries = value
    .map((item): GoogleImportSummary | null => {
      const summary = asRecord(item);
      const kind = asString(summary?.kind);
      const label = asString(summary?.label);
      const text = asString(summary?.text);
      if (!label || !text || (kind !== 'editorial' && kind !== 'review' && kind !== 'generative'))
        return null;
      return { kind, label, text };
    })
    .filter((item): item is GoogleImportSummary => Boolean(item));
  return summaries.length > 0 ? summaries : undefined;
}

function asGoogleReviews(value: unknown): GoogleImportReview[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const reviews = value
    .map((item): GoogleImportReview | null => {
      const review = asRecord(item);
      const id = asString(review?.id);
      if (!id) return null;
      return {
        id,
        authorName: asString(review?.authorName),
        authorUrl: asString(review?.authorUrl),
        rating: asNumber(review?.rating),
        text: asString(review?.text),
        relativeTime: asString(review?.relativeTime),
        publishedAt: asString(review?.publishedAt),
      };
    })
    .filter((item): item is GoogleImportReview => Boolean(item));
  return reviews.length > 0 ? reviews : undefined;
}

function asGoogleImportSource(value: unknown): GoogleImportSource | undefined {
  const source = asRecord(value);
  const google = asRecord(source?.google_places);
  if (!google) return undefined;
  return {
    placeId: asString(google.place_id),
    googleMapsUrl: asString(google.google_maps_url),
    streetViewUrl: asString(google.street_view_url),
    rating: asNumber(google.rating),
    userRatingCount: asNumber(google.user_rating_count),
    businessStatus: asString(google.business_status),
    priceLevel: asString(google.price_level),
    priceRange: asString(google.price_range),
    openNow: asBoolean(google.open_now),
    summaries: asGoogleSummaries(google.summaries),
    approvedReviews: asGoogleReviews(google.approved_reviews),
  };
}

function mergePlatformAndGoogleRatings(
  publishedReviews: { rating: number }[],
  googleImport: GoogleImportSource | undefined,
): { rating: number | undefined; reviewsCount: number | undefined; portalReviewsCount: number | undefined } {
  const platformCount = publishedReviews.length;
  const platformAvg =
    platformCount > 0
      ? publishedReviews.reduce((sum, review) => sum + review.rating, 0) / platformCount
      : null;

  const gRatingRaw = googleImport?.rating;
  const gRatingNum = typeof gRatingRaw === 'number' && Number.isFinite(gRatingRaw) ? gRatingRaw : null;

  const userCnt = googleImport?.userRatingCount;
  const gCountFromField = typeof userCnt === 'number' && userCnt > 0 ? Math.max(0, Math.round(userCnt)) : 0;
  const gApproved = googleImport?.approvedReviews?.length ?? 0;
  const gCount = gCountFromField > 0 ? gCountFromField : gApproved > 0 ? gApproved : 0;

  const portalReviewsCount = platformCount > 0 ? platformCount : undefined;

  let rating: number | undefined;
  let reviewsCount: number | undefined;

  if (platformAvg !== null && gRatingNum !== null && gCount > 0) {
    const totalW = platformCount + gCount;
    rating = (platformAvg * platformCount + gRatingNum * gCount) / totalW;
    reviewsCount = totalW;
  } else if (platformAvg !== null) {
    rating = platformAvg;
    reviewsCount = platformCount + gCount > 0 ? platformCount + gCount : platformCount;
  } else if (gRatingNum !== null) {
    rating = gRatingNum;
    reviewsCount = gCount > 0 ? gCount : gApproved > 0 ? gApproved : undefined;
  } else if (platformCount + gCount > 0) {
    reviewsCount = platformCount + gCount;
  }

  return { rating, reviewsCount, portalReviewsCount };
}

function toBusiness(row: BusinessRow): Business {
  const googleImportSource = asGoogleImportSource(row.import_source);
  const sortedAssignments = [...(row.business_category_assignments ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary),
  );
  const categories = sortedAssignments
    .map((a) => a.business_categories?.slug)
    .filter((slug): slug is string => Boolean(slug));
  const categoryNames = sortedAssignments
    .map((a) => a.business_categories?.name)
    .filter((name): name is string => Boolean(name));
  const publishedReviews = (row.business_reviews ?? []).filter((r) => r.status === 'published');
  const { rating, reviewsCount, portalReviewsCount } = mergePlatformAndGoogleRatings(
    publishedReviews,
    googleImportSource,
  );

  return {
    id: row.id,
    cityId: row.city_id,
    citySlug: row.cities?.slug ?? '',
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description ?? undefined,
    description: row.description ?? undefined,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    instagram: row.instagram ?? undefined,
    facebook: row.facebook ?? undefined,
    googleMapsUrl: row.google_maps_url ?? undefined,
    googleImportSource,
    address: row.address ?? undefined,
    districtId: row.district_id,
    district: row.districts?.name ?? undefined,
    cep: row.cep ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    hours: asHours(row.hours),
    amenities: asStringArray(row.amenities) as Amenity[],
    paymentMethods: asStringArray(row.payment_methods) as PaymentMethod[],
    categories,
    categoryNames,
    categoryIds: sortedAssignments.map((a) => a.category_id),
    coverUrl: row.cover_url ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    ogImageUrl: row.og_image_url ?? undefined,
    ogSquareImageUrl: row.og_square_image_url ?? undefined,
    photos: asStringArray(row.photos),
    status: row.status ?? 'draft',
    plan: row.plan ?? 'free',
    featured: row.featured ?? false,
    verified: row.verified ?? false,
    claimed: row.claimed ?? false,
    orderingEnabled: row.ordering_enabled ?? false,
    viewsCount: row.views_count ?? 0,
    rating,
    reviewsCount,
    portalReviewsCount,
    publishedAt: row.published_at ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

// ───────────────────── sub-fetchers ─────────────────────

async function fetchPromotions(businessId: string): Promise<BusinessPromotion[]> {
  const { data, error } = await supabase
    .from('business_promotions')
    .select('id, business_id, title, description, coupon_code, discount_percent, valid_from, valid_until, active')
    .eq('business_id', businessId)
    .eq('active', true)
    .order('valid_from', { ascending: false });
  if (error || !data) return [];
  return data.map((p) => ({
    id: p.id,
    businessId: p.business_id,
    title: p.title,
    description: p.description ?? undefined,
    couponCode: p.coupon_code ?? undefined,
    discountPercent: p.discount_percent ?? undefined,
    validFrom: p.valid_from ?? undefined,
    validUntil: p.valid_until ?? undefined,
    active: p.active ?? false,
  }));
}

async function fetchReviews(businessId: string): Promise<BusinessReview[]> {
  // Sem join em `profiles` — a RLS de profiles bloqueia o anon e derrubava a
  // query inteira (avaliações sumiam). Autor cai em "cidadão" na UI.
  const { data, error } = await supabase
    .from('business_reviews')
    .select('id, business_id, rating, title, comment, photo_url, reply_owner, reply_at, created_at')
    .eq('business_id', businessId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    businessId: r.business_id,
    authorName: undefined,
    rating: r.rating,
    title: r.title ?? undefined,
    comment: r.comment ?? undefined,
    photoUrl: r.photo_url ?? undefined,
    replyOwner: r.reply_owner ?? undefined,
    replyAt: r.reply_at ?? undefined,
    createdAt: r.created_at ?? undefined,
  }));
}

async function fetchPosts(businessId: string): Promise<EntityPost[]> {
  const { data, error } = await supabase
    .from('entity_posts')
    .select('id, entity_type, entity_id, title, body, image_url, video_url, button_label, button_url, pinned, published_at, created_at')
    .eq('entity_type', 'business')
    .eq('entity_id', businessId)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(5);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    body: row.body ?? null,
    imageUrl: row.image_url ?? null,
    videoUrl: row.video_url ?? null,
    buttonLabel: row.button_label ?? null,
    buttonUrl: row.button_url ?? null,
    pinned: row.pinned ?? false,
    publishedAt: row.published_at ?? null,
    createdAt: row.created_at ?? null,
  }));
}

type RelatedRow = {
  id: string;
  slug: string;
  name: string;
  cover_url: string | null;
  logo_url: string | null;
  photos: unknown;
  import_source: unknown;
  districts: { name: string | null } | null;
  business_category_assignments:
    | { is_primary: boolean | null; business_categories: { name: string } | null }[]
    | null;
  business_reviews: { rating: number | null; status: string | null }[] | null;
};

async function fetchRelated(
  cityId: string,
  primaryCategoryId: string | undefined,
  excludeId: string,
): Promise<RelatedBusiness[]> {
  if (!primaryCategoryId) return [];
  const { data, error } = await supabase
    .from('businesses')
    .select(
      'id, slug, name, cover_url, logo_url, photos, import_source, districts(name), business_category_assignments!inner(is_primary, category_id, business_categories(name)), business_reviews(rating, status)',
    )
    .eq('city_id', cityId)
    .eq('status', 'published')
    .eq('business_category_assignments.category_id', primaryCategoryId)
    .neq('id', excludeId)
    .limit(6);
  if (error || !data) return [];

  return (data as unknown as RelatedRow[]).slice(0, 5).map((row) => {
    const assignments = [...(row.business_category_assignments ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary),
    );
    const scores = getBusinessRating(row);
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      coverUrl: firstImage([row.cover_url, row.logo_url, ...asStringArray(row.photos)]),
      district: row.districts?.name ?? null,
      categoryLabel: assignments[0]?.business_categories?.name ?? null,
      rating: scores.rating,
      reviewsCount: scores.reviewsCount,
    };
  });
}

// ───────────────────── API pública ─────────────────────

async function fetchBusinessDetailRemote(
  slug: string,
  citySlug: string,
): Promise<BusinessDetail | null> {
  try {
    const { data: city } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .maybeSingle<{ id: string }>();
    if (!city) return null;

    const { data, error } = await supabase
      .from('businesses')
      .select(BUSINESS_PUBLIC_SELECT)
      .eq('city_id', city.id)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !data) {
      if (__DEV__ && error) console.warn('[fetchBusinessDetail] erro', error);
      return null;
    }

    const business = toBusiness(data as unknown as BusinessRow);
    const [promotions, reviews, posts, related] = await Promise.all([
      fetchPromotions(business.id),
      fetchReviews(business.id),
      fetchPosts(business.id),
      fetchRelated(business.cityId, business.categoryIds?.[0], business.id),
    ]);

    return { business, promotions, reviews, posts, related };
  } catch (err) {
    if (__DEV__) console.warn('[fetchBusinessDetail] falha', err);
    return null;
  }
}

function cacheKey(slug: string, citySlug: string): string {
  return `business:detail:${citySlug}:${slug}`;
}

/** Detalhe completo com cache SWR (carrega rápido + revalida em background). */
export async function getBusinessDetail(
  slug: string,
  citySlug = env.defaultCitySlug,
): Promise<BusinessDetail | null> {
  return cachedJson<BusinessDetail>(
    cacheKey(slug, citySlug),
    () => fetchBusinessDetailRemote(slug, citySlug),
    { ttlMs: DETAIL_TTL_MS },
  );
}

/** Aquece o cache antes do toque abrir a tela (chamar no onPressIn dos cards). */
export function prefetchBusinessDetail(slug: string, citySlug = env.defaultCitySlug): void {
  void getBusinessDetail(slug, citySlug).catch(() => undefined);
}

/** Força refetch (ex.: pull-to-refresh ou ao voltar do WebView de edição). */
export async function invalidateBusinessDetail(
  slug: string,
  citySlug = env.defaultCitySlug,
): Promise<void> {
  await invalidate(cacheKey(slug, citySlug));
}

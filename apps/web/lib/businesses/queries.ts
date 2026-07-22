import 'server-only';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { publicCached } from '@/lib/cache/public-query';
import { CATEGORIES, CATEGORY_BY_SLUG, MACRO_CATEGORIES } from './categories';
import { haystackMatchesSearchQuery, normalizeForSearch } from '@/lib/search/query-tokens';
import { MOCK_BUSINESSES } from './mock';
import type {
  Amenity,
  Business,
  BusinessCategory,
  BusinessPromotion,
  BusinessReview,
  BusinessSearchParams,
  GoogleImportReview,
  GoogleImportSource,
  GoogleImportSummary,
  Hours,
  PaymentMethod,
} from './types';

const DEFAULT_LIMIT = 50;
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_BUSINESSES === 'true';
const HARD_MAX_BUSINESSES_PER_CITY = 2000;
const FEATURED_HOME_CANDIDATE_LIMIT = 100;
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
  business_category_assignments?: Array<{
    category_id: string;
    is_primary: boolean | null;
    business_categories: {
      slug: string;
      name: string;
      parent_id: string | null;
      icon: string | null;
    } | null;
  }> | null;
  business_reviews?: Array<{
    rating: number;
    status: Business['status'] | null;
  }> | null;
};

type CategoryRow = {
  id: string;
  city_id: string | null;
  slug: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  display_order: number | null;
};

function normalizeText(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

/** Aceita uma slug (macro ou folha) e retorna todos os slugs (incluindo descendentes). */
function expandCategorySlugs(slug: string): string[] {
  const node = CATEGORY_BY_SLUG[slug];
  if (!node) return [];
  if (node.parent) return [slug];
  // É uma macro: incluir todas as folhas + a própria macro
  return [slug, ...CATEGORIES.filter((c) => c.parent === slug).map((c) => c.slug)];
}

function applyFilters(items: Business[], p: BusinessSearchParams): Business[] {
  let result = items.filter((b) => b.status === 'published');

  if (p.category) {
    const slugs = expandCategorySlugs(p.category);
    result = result.filter((b) => b.categories.some((cs) => slugs.includes(cs)));
  }
  if (p.category_id) {
    result = result.filter((b) => b.categoryIds?.includes(p.category_id!));
  }
  if (p.q) {
    const qNorm = normalizeForSearch(p.q);
    result = result.filter((b) => {
      const haystack = normalizeForSearch(getBusinessSearchFields(b).join(' '));
      return haystackMatchesSearchQuery(haystack, qNorm);
    });
  }
  if (p.district) {
    const district = normalizeText(p.district);
    result = result.filter((b) => normalizeText(b.district ?? '').includes(district));
  }
  if (p.district_id) {
    result = result.filter((b) => b.districtId === p.district_id);
  }
  if (p.amenity) {
    result = result.filter((b) => b.amenities?.includes(p.amenity!));
  }
  if (p.hasWhatsapp) {
    result = result.filter((b) => Boolean(b.whatsapp));
  }

  switch (p.sort) {
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      break;
    case 'recent':
      result.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
      break;
    case 'featured':
      result.sort((a, b) => {
        const featuredDiff = Number(b.featured ?? false) - Number(a.featured ?? false);
        if (featuredDiff !== 0) return featuredDiff;
        return (
          (b.rating ?? 0) * Math.log1p(b.reviewsCount ?? 0) -
          (a.rating ?? 0) * Math.log1p(a.reviewsCount ?? 0)
        );
      });
      break;
    case 'rating':
    default:
      result.sort(
        (a, b) =>
          (b.rating ?? 0) * Math.log1p(b.reviewsCount ?? 0) -
          (a.rating ?? 0) * Math.log1p(a.reviewsCount ?? 0),
      );
      break;
  }

  const offset = p.offset ?? (p.page && p.page > 1 ? (p.page - 1) * (p.limit ?? DEFAULT_LIMIT) : 0);
  const limit = p.limit ?? DEFAULT_LIMIT;
  return result.slice(offset, offset + limit);
}

export function getBusinessSearchFields(business: Business): string[] {
  const categoryFields = business.categories.flatMap((slug) => {
    const category = CATEGORY_BY_SLUG[slug];
    const parent = category?.parent ? CATEGORY_BY_SLUG[category.parent] : undefined;

    return [slug, category?.name, category?.parent, parent?.name];
  });

  return [
    business.name,
    business.shortDescription,
    business.description,
    business.district,
    business.address,
    ...categoryFields,
  ].filter((value): value is string => Boolean(value));
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

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

function mergePlatformAndGoogleRatings(
  publishedReviews: Array<{ rating: number }>,
  googleImport: GoogleImportSource | undefined,
): { rating: number | undefined; reviewsCount: number | undefined; portalReviewsCount: number | undefined } {
  const platformCount = publishedReviews.length;
  const platformAvg =
    platformCount > 0
      ? publishedReviews.reduce((sum, review) => sum + review.rating, 0) / platformCount
      : null;

  const gRatingRaw = googleImport?.rating;
  const gRatingNum =
    typeof gRatingRaw === 'number' && Number.isFinite(gRatingRaw) ? gRatingRaw : null;

  const userCnt = googleImport?.userRatingCount;
  const gCountFromField =
    typeof userCnt === 'number' && userCnt > 0 ? Math.max(0, Math.round(userCnt)) : 0;
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

function toBusiness(row: BusinessRow): Business {
  const googleImportSource = asGoogleImportSource(row.import_source);
  const assignments = row.business_category_assignments ?? [];
  const sortedAssignments = [...assignments].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary),
  );
  const categories = sortedAssignments
    .map((assignment) => assignment.business_categories?.slug)
    .filter((slug): slug is string => Boolean(slug));
  const publishedReviews = (row.business_reviews ?? []).filter(
    (review) => review.status === 'published',
  );
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
    categoryIds: sortedAssignments.map((assignment) => assignment.category_id),
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

function toCategory(row: CategoryRow, byId: Map<string, CategoryRow>): BusinessCategory {
  const parent = row.parent_id ? byId.get(row.parent_id) : undefined;

  return {
    id: row.id,
    cityId: row.city_id,
    slug: row.slug,
    name: row.name,
    parent: parent?.slug,
    icon: row.icon ?? 'Store',
  };
}

async function getCityId(cityId?: string): Promise<string | null> {
  if (cityId) return cityId;
  const city = await getCurrentCity();
  return city?.id ?? null;
}

function shouldFallbackToMock(error: unknown): boolean {
  if (USE_MOCK) return true;
  if (process.env.NODE_ENV === 'production') return false;
  return Boolean(error);
}

function fetchAllPublishedBusinesses(cityId: string, hasWhatsapp: boolean): Promise<Business[]> {
  return publicCached(
    {
      key: 'businesses:all-published',
      tags: ['businesses', `businesses:${cityId}`],
      parts: [cityId, hasWhatsapp ? 'wpp' : 'all'],
    },
    async (supabase) => {
      let query = supabase
        .from('businesses')
        .select(BUSINESS_PUBLIC_SELECT)
        .eq('city_id', cityId)
        .eq('status', 'published');

      if (hasWhatsapp) query = query.not('whatsapp', 'is', null);

      const { data, error } = await query.limit(HARD_MAX_BUSINESSES_PER_CITY);
      if (error) throw error;
      return ((data ?? []) as unknown as BusinessRow[]).map(toBusiness);
    },
  );
}

async function fetchBusinesses(params: BusinessSearchParams): Promise<Business[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  try {
    const all = await fetchAllPublishedBusinesses(cityId, Boolean(params.hasWhatsapp));
    return applyFilters(all, params);
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      return applyFilters(MOCK_BUSINESSES, params);
    }
    throw error;
  }
}

/** Conta (aproximado) por macro-categoria sem disparar N queries. */
export async function countByMacroCategory(): Promise<Record<string, number>> {
  const cityId = await getCityId();
  if (!cityId) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('business_category_assignments')
    .select(
      `
      business_id,
      business_categories!inner(slug, parent_id),
      businesses!inner(city_id, status)
    `,
    )
    .eq('businesses.city_id', cityId)
    .eq('businesses.status', 'published');

  if (error) {
    if (shouldFallbackToMock(error)) {
      const output: Record<string, Set<string>> = {};
      for (const b of MOCK_BUSINESSES.filter((b) => b.status === 'published')) {
        for (const slug of b.categories) {
          const node = CATEGORY_BY_SLUG[slug];
          const macro = node?.parent ?? slug;
          (output[macro] ??= new Set()).add(b.id);
        }
      }
      return Object.fromEntries(Object.entries(output).map(([k, v]) => [k, v.size]));
    }
    throw error;
  }

  const buckets: Record<string, Set<string>> = {};
  for (const row of (data ?? []) as Array<{
    business_id: string;
    business_categories: { slug: string; parent_id: string | null } | null;
  }>) {
    const slug = row.business_categories?.slug;
    if (!slug) continue;
    const node = CATEGORY_BY_SLUG[slug];
    const macro = node?.parent ?? slug;
    (buckets[macro] ??= new Set()).add(row.business_id);
  }

  return Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.size]));
}

// ───────────────────── API pública ─────────────────────

export async function listBusinesses(params: BusinessSearchParams = {}): Promise<Business[]> {
  if (USE_MOCK) return applyFilters(MOCK_BUSINESSES, params);
  return fetchBusinesses(params);
}

export async function listFeaturedBusinesses(limit = 6): Promise<Business[]> {
  return listFeatured({ limit });
}

export async function listActiveFeaturedBusinesses(
  params: { city_id?: string; limit?: number } = {},
): Promise<Business[]> {
  if (USE_MOCK) {
    const limit = params.limit ?? 6;
    return applyFilters(MOCK_BUSINESSES, { sort: 'featured', limit: FEATURED_HOME_CANDIDATE_LIMIT })
      .filter((business) => business.featured && business.plan !== 'free')
      .slice(0, limit);
  }

  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];
  const limit = params.limit ?? 6;

  try {
    return await publicCached(
      {
        key: 'businesses:active-featured',
        tags: ['businesses', `businesses:${cityId}`],
        revalidate: 600,
        parts: [cityId, limit],
      },
      async (supabase) => {
        const { data, error } = await supabase
          .from('businesses')
          .select(BUSINESS_PUBLIC_SELECT)
          .eq('city_id', cityId)
          .eq('status', 'published')
          .eq('featured', true)
          .neq('plan', 'free')
          .limit(Math.max(limit, FEATURED_HOME_CANDIDATE_LIMIT));

        if (error) throw error;
        return applyFilters(((data ?? []) as unknown as BusinessRow[]).map(toBusiness), {
          sort: 'featured',
          limit,
        });
      },
    );
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      return applyFilters(MOCK_BUSINESSES, {
        sort: 'featured',
        limit: FEATURED_HOME_CANDIDATE_LIMIT,
      })
        .filter((business) => business.featured && business.plan !== 'free')
        .slice(0, limit);
    }
    throw error;
  }
}

export async function listFeatured(
  params: { city_id?: string; limit?: number } = {},
): Promise<Business[]> {
  return listBusinesses({ city_id: params.city_id, sort: 'featured', limit: params.limit ?? 6 });
}

export async function listByCategory(
  categorySlug: string,
  params: Omit<BusinessSearchParams, 'category'> = {},
): Promise<Business[]> {
  return listBusinesses({ ...params, category: categorySlug });
}

export async function searchBusinesses(
  q: string,
  params: Omit<BusinessSearchParams, 'q'> = {},
): Promise<Business[]> {
  return listBusinesses({ ...params, q });
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  if (USE_MOCK) {
    return MOCK_BUSINESSES.find((b) => b.slug === slug && b.status === 'published') ?? null;
  }

  const cityId = await getCityId();
  if (!cityId) return null;

  try {
    return await publicCached(
      {
        key: 'businesses:detail',
        tags: ['businesses', `businesses:${cityId}`, `business:${cityId}:${slug}`],
        parts: [cityId, slug],
      },
      async (supabase) => {
        const { data, error } = await supabase
          .from('businesses')
          .select(BUSINESS_PUBLIC_SELECT)
          .eq('city_id', cityId)
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle();

        if (error) throw error;
        return data ? toBusiness(data as unknown as BusinessRow) : null;
      },
    );
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      return MOCK_BUSINESSES.find((b) => b.slug === slug && b.status === 'published') ?? null;
    }
    throw error;
  }
}

/** Conta negócios por categoria (aceita macro ou folha). Para badges de listagem. */
export async function countByCategory(slug: string): Promise<number> {
  return (await listByCategory(slug, { limit: 1000 })).length;
}

/** Distritos/bairros únicos com pelo menos um negócio publicado. Pra filtros. */
export async function listDistrictsWithBusinesses(): Promise<string[]> {
  const businesses = await listBusinesses({ limit: 1000 });
  return Array.from(
    new Set(businesses.map((b) => b.district).filter((d): d is string => Boolean(d))),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export async function listCategories(
  params: { city_id?: string } = {},
): Promise<BusinessCategory[]> {
  if (USE_MOCK) return CATEGORIES;

  const cityId = await getCityId(params.city_id);
  if (!cityId) return MACRO_CATEGORIES;

  try {
    return await publicCached(
      {
        key: 'businesses:categories',
        tags: ['businesses', `businesses:${cityId}`, 'business-categories'],
        revalidate: 3600,
        parts: [cityId],
      },
      async (supabase) => {
        const { data, error } = await supabase
          .from('business_categories')
          .select('id, city_id, slug, name, parent_id, icon, display_order')
          .or(`city_id.is.null,city_id.eq.${cityId}`)
          .eq('active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        const rows = (data ?? []) as CategoryRow[];
        const byId = new Map(rows.map((row) => [row.id, row]));
        return rows.map((row) => toCategory(row, byId));
      },
    );
  } catch (error) {
    if (shouldFallbackToMock(error)) return CATEGORIES;
    throw error;
  }
}

export async function listBusinessPromotions(businessId: string): Promise<BusinessPromotion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('business_promotions')
    .select(
      'id, business_id, title, description, coupon_code, discount_percent, valid_from, valid_until, active',
    )
    .eq('business_id', businessId)
    .eq('active', true)
    .order('valid_from', { ascending: false });

  if (error) return [];

  return (data ?? []).map((promotion) => ({
    id: promotion.id,
    businessId: promotion.business_id,
    title: promotion.title,
    description: promotion.description ?? undefined,
    couponCode: promotion.coupon_code ?? undefined,
    discountPercent: promotion.discount_percent ?? undefined,
    validFrom: promotion.valid_from ?? undefined,
    validUntil: promotion.valid_until ?? undefined,
    active: promotion.active ?? false,
  }));
}

export type CityPromotion = {
  id: string;
  title: string;
  discountPercent: number | null;
  couponCode: string | null;
  businessName: string;
  businessSlug: string;
  logoUrl: string | null;
};

export async function listCityPromotions(
  params: number | { city_id?: string; limit?: number } = {},
): Promise<CityPromotion[]> {
  const limit = typeof params === 'number' ? params : (params.limit ?? 8);
  const cityId = await getCityId(typeof params === 'number' ? undefined : params.city_id);
  if (!cityId) return [];

  const now = new Date();
  now.setMinutes(0, 0, 0);
  const hourBucket = now.toISOString();

  return publicCached(
    {
      key: 'businesses:city-promotions',
      tags: ['businesses', `businesses:${cityId}`, 'business-promotions'],
      revalidate: 600,
      parts: [cityId, limit, hourBucket],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('business_promotions')
        .select(
          'id, title, discount_percent, coupon_code, valid_from, valid_until, businesses!inner(city_id, name, slug, status, logo_url)',
        )
        .eq('active', true)
        .eq('businesses.status', 'published')
        .eq('businesses.city_id', cityId)
        .lte('valid_from', hourBucket)
        .or(`valid_until.is.null,valid_until.gte.${hourBucket}`)
        .order('valid_from', { ascending: false })
        .limit(limit);

      if (error || !data) return [];

      return data
        .map((row) => {
          const business = row.businesses as {
            name: string;
            slug: string;
            logo_url: string | null;
          } | null;
          if (!business) return null;
          return {
            id: row.id,
            title: row.title,
            discountPercent: row.discount_percent ?? null,
            couponCode: row.coupon_code ?? null,
            businessName: business.name,
            businessSlug: business.slug,
            logoUrl: business.logo_url ?? null,
          } satisfies CityPromotion;
        })
        .filter((item): item is CityPromotion => item !== null);
    },
  );
}

export async function listBusinessReviews(businessId: string): Promise<BusinessReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('business_reviews')
    .select(
      'id, business_id, rating, title, comment, photo_url, reply_owner, reply_at, created_at, profiles(full_name)',
    )
    .eq('business_id', businessId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data ?? []).map((review) => ({
    id: review.id,
    businessId: review.business_id,
    authorName: (review.profiles as { full_name?: string | null } | null)?.full_name ?? undefined,
    rating: review.rating,
    title: review.title ?? undefined,
    comment: review.comment ?? undefined,
    photoUrl: review.photo_url ?? undefined,
    replyOwner: review.reply_owner ?? undefined,
    replyAt: review.reply_at ?? undefined,
    createdAt: review.created_at ?? undefined,
  }));
}

import 'server-only';

import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { publicCached } from '@/lib/cache/public-query';
import type {
  Accommodation,
  AccommodationKind,
  Attraction,
  AttractionFull,
  AttractionKind,
  AttractionPhoto,
  AttractionReview,
  AttractionService,
  FishingGuide,
  FishingSpot,
  GoogleAttractionPhoto,
  GoogleAttractionReview,
  GuideContentBlock,
  GuideFaqItem,
  GuideHighlight,
  GuideKind,
  GuideLinkedEntity,
  GuidePhoto,
  GuidePracticalItem,
  GuideReview,
  GuideSection,
  TourismGuide,
  TourismGuideFull,
  TourPackage,
  TourismRestaurant,
} from './types';

type DistrictJoin = { name: string | null } | null;

type AccommodationRow = {
  id: string;
  city_id: string;
  district_id: string | null;
  districts?: DistrictJoin;
  slug: string;
  name: string;
  type: AccommodationKind | null;
  short_description: string | null;
  description: string | null;
  address: string | null;
  cep: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  booking_url: string | null;
  airbnb_url: string | null;
  instagram: string | null;
  price_min: number | null;
  price_max: number | null;
  rooms_count: number | null;
  max_guests: number | null;
  amenities: unknown;
  near_lake: boolean | null;
  has_marina: boolean | null;
  cover_url: string | null;
  photos: unknown;
  rating: number | null;
  owner_profile_id: string | null;
  status: Accommodation['status'] | null;
  featured: boolean | null;
  featured_until?: string | null;
  verified: boolean | null;
  og_image_url: string | null;
  og_square_image_url: string | null;
};

type RestaurantRow = {
  id: string;
  city_id: string;
  district_id: string | null;
  districts?: DistrictJoin;
  slug: string;
  name: string;
  description: string | null;
  cuisine: unknown;
  price_range: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  hours: unknown;
  delivery: boolean | null;
  ifood_url: string | null;
  cover_url: string | null;
  photos: unknown;
  lat: number | null;
  lng: number | null;
  owner_profile_id: string | null;
  status: TourismRestaurant['status'] | null;
  featured: boolean | null;
  featured_until?: string | null;
  rating: number | null;
  og_image_url: string | null;
  og_square_image_url: string | null;
};

type AttractionRow = {
  id: string;
  city_id: string;
  slug: string;
  name: string;
  type: AttractionKind | null;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  hours_legacy_text: string | null;
  entry_fee: string | null;
  difficulty: string | null;
  duration_minutes: number | null;
  cover_url: string | null;
  photos: unknown;
  best_season: string | null;
  owner_profile_id: string | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  street_view_url: string | null;
  rating: number | null;
  reviews_count: number | null;
  google_summary: string | null;
  google_photos: unknown;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  accessibility: unknown;
  amenities: unknown;
  tips: string | null;
  price_range: string | null;
  pet_friendly: boolean | null;
  family_friendly: boolean | null;
  status: Attraction['status'] | null;
  featured: boolean | null;
  og_image_url: string | null;
  og_square_image_url: string | null;
};

type AttractionReviewRow = {
  id: string;
  attraction_id: string;
  city_id: string;
  author_profile_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  photo_url: string | null;
  status: AttractionReview['status'] | null;
  reply_owner: string | null;
  reply_at: string | null;
  created_at: string | null;
};

type AttractionPhotoRow = {
  id: string;
  attraction_id: string;
  city_id: string;
  author_profile_id: string;
  storage_path: string;
  media_type: 'image' | 'video' | null;
  caption: string | null;
  status: AttractionPhoto['status'] | null;
  created_at: string | null;
};

type AttractionServiceRow = {
  id: string;
  attraction_id: string;
  kind: string;
  label: string;
  details: string | null;
  price: number | null;
  contact_business_id: string | null;
};

const blockedPublicAttractionSlugs = new Set([
  'mirante-do-cristo',
  'cachoeira-do-lobo',
  'cachoeira-pedra-molhada',
  'cachoeira-do-silvestre',
  'cachoeiras-de-furnas-por-barco',
]);

function isPublicAttraction(item: Attraction) {
  return (
    !blockedPublicAttractionSlugs.has(item.slug) &&
    !item.slug.includes('demo') &&
    !item.name.toLowerCase().includes('demo')
  );
}

function isPublicTourPackage(item: TourPackage) {
  return !item.slug.includes('demo') && !item.title.toLowerCase().includes('demo');
}

async function getCityId(cityId?: string): Promise<string | null> {
  if (cityId) return cityId;
  const city = await getCurrentCity();
  return city?.id ?? null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
    : [];
}

function getGoogleAttractionPhotos(value: unknown): GoogleAttractionPhoto[] {
  const record = asRecord(value);
  const rows = [...asRecordArray(record.imported_photos), ...asRecordArray(record.pending_photos)];
  const seen = new Set<string>();
  const photos: GoogleAttractionPhoto[] = [];

  for (const row of rows) {
    const name = asNullableString(row.name);
    const url = asNullableString(row.cdn_url) ?? asNullableString(row.url);
    const key = name ?? url;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    photos.push({
      name: name ?? key,
      role: asNullableString(row.role),
      attribution: asNullableString(row.attribution),
      url,
    });
  }

  return photos;
}

function getGoogleAttractionReviews(value: unknown): GoogleAttractionReview[] {
  const record = asRecord(value);
  return asRecordArray(record.approved_reviews)
    .map((row, index) => {
      const id = asNullableString(row.id) ?? asNullableString(row.name) ?? `google-review-${index}`;
      return {
        id,
        authorName: asNullableString(row.authorName) ?? asNullableString(row.author_name),
        authorUrl: asNullableString(row.authorUrl) ?? asNullableString(row.author_url),
        rating: asNullableNumber(row.rating),
        text: asNullableString(row.text),
        relativeTime:
          asNullableString(row.relativeTime) ??
          asNullableString(row.relative_time) ??
          asNullableString(row.relativePublishTimeDescription),
        publishedAt:
          asNullableString(row.publishedAt) ??
          asNullableString(row.published_at) ??
          asNullableString(row.publishTime),
      };
    })
    .filter((review) => Boolean(review.text) || review.rating !== null);
}

function hasAiSummary(text: string | null): boolean {
  return Boolean(text?.includes('Resumido por IA'));
}

function toAccommodation(row: AccommodationRow): Accommodation {
  return {
    id: row.id,
    cityId: row.city_id,
    districtId: row.district_id,
    districtName: row.districts?.name ?? null,
    slug: row.slug,
    name: row.name,
    type: row.type ?? 'pousada',
    shortDescription: row.short_description,
    description: row.description,
    address: row.address,
    cep: row.cep,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    website: row.website,
    bookingUrl: row.booking_url,
    airbnbUrl: row.airbnb_url,
    instagram: row.instagram,
    priceMin: row.price_min,
    priceMax: row.price_max,
    roomsCount: row.rooms_count,
    maxGuests: row.max_guests,
    amenities: asStringArray(row.amenities),
    nearLake: row.near_lake ?? false,
    hasMarina: row.has_marina ?? false,
    coverUrl: row.cover_url,
    photos: asStringArray(row.photos),
    rating: row.rating,
    ownerProfileId: row.owner_profile_id,
    status: row.status ?? 'draft',
    featured: row.featured ?? false,
    featuredUntil: row.featured_until,
    verified: row.verified ?? false,
    aiSummary: hasAiSummary(row.short_description) || hasAiSummary(row.description),
    ogImageUrl: row.og_image_url ?? undefined,
    ogSquareImageUrl: row.og_square_image_url ?? undefined,
  };
}

function toRestaurant(row: RestaurantRow): TourismRestaurant {
  return {
    id: row.id,
    cityId: row.city_id,
    districtId: row.district_id,
    districtName: row.districts?.name ?? null,
    slug: row.slug,
    name: row.name,
    description: row.description,
    cuisine: asStringArray(row.cuisine),
    priceRange: row.price_range,
    address: row.address,
    phone: row.phone,
    whatsapp: row.whatsapp,
    hours: asRecord(row.hours),
    delivery: row.delivery ?? false,
    ifoodUrl: row.ifood_url,
    coverUrl: row.cover_url,
    photos: asStringArray(row.photos),
    lat: row.lat,
    lng: row.lng,
    ownerProfileId: row.owner_profile_id,
    status: row.status ?? 'draft',
    featured: row.featured ?? false,
    featuredUntil: row.featured_until,
    rating: row.rating,
    aiSummary: hasAiSummary(row.description),
    ogImageUrl: row.og_image_url ?? undefined,
    ogSquareImageUrl: row.og_square_image_url ?? undefined,
  };
}

function selectAccommodation() {
  return 'id, city_id, district_id, slug, name, type, short_description, description, address, cep, lat, lng, phone, whatsapp, email, website, booking_url, airbnb_url, instagram, price_min, price_max, rooms_count, max_guests, amenities, near_lake, has_marina, cover_url, photos, rating, owner_profile_id, status, featured, featured_until, verified, og_image_url, og_square_image_url, districts(name)';
}

function selectRestaurant() {
  return 'id, city_id, district_id, slug, name, description, cuisine, price_range, address, phone, whatsapp, hours, delivery, ifood_url, cover_url, photos, lat, lng, owner_profile_id, status, featured, featured_until, rating, og_image_url, og_square_image_url, districts(name)';
}

function selectAttraction() {
  return 'id, city_id, slug, name, type, description, address, lat, lng, hours_legacy_text, entry_fee, difficulty, duration_minutes, cover_url, photos, best_season, owner_profile_id, google_place_id, google_maps_url, street_view_url, rating, reviews_count, google_summary, google_photos, phone, whatsapp, website, instagram, accessibility, amenities, tips, price_range, pet_friendly, family_friendly, status, featured, og_image_url, og_square_image_url';
}

function toAttraction(row: AttractionRow): Attraction {
  return {
    id: row.id,
    cityId: row.city_id,
    slug: row.slug,
    name: row.name,
    type: row.type ?? 'balneario',
    description: row.description,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    hoursLegacyText: row.hours_legacy_text,
    entryFee: row.entry_fee,
    difficulty: row.difficulty,
    durationMinutes: row.duration_minutes,
    coverUrl: row.cover_url,
    photos: asStringArray(row.photos),
    bestSeason: row.best_season,
    ownerProfileId: row.owner_profile_id,
    googlePlaceId: row.google_place_id,
    googleMapsUrl: row.google_maps_url,
    streetViewUrl: row.street_view_url,
    rating: row.rating,
    reviewsCount: row.reviews_count ?? 0,
    googleSummary: row.google_summary,
    googlePhotos: getGoogleAttractionPhotos(row.google_photos),
    googleReviews: getGoogleAttractionReviews(row.google_photos),
    phone: row.phone,
    whatsapp: row.whatsapp,
    website: row.website,
    instagram: row.instagram,
    accessibility: asRecord(row.accessibility),
    amenities: asStringArray(row.amenities),
    tips: row.tips,
    priceRange: row.price_range,
    petFriendly: row.pet_friendly ?? false,
    familyFriendly: row.family_friendly ?? false,
    status: row.status ?? 'draft',
    featured: row.featured ?? false,
    ogImageUrl: row.og_image_url ?? undefined,
    ogSquareImageUrl: row.og_square_image_url ?? undefined,
  };
}

function toAttractionReview(row: AttractionReviewRow): AttractionReview {
  return {
    id: row.id,
    attractionId: row.attraction_id,
    cityId: row.city_id,
    authorProfileId: row.author_profile_id,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    photoUrl: row.photo_url,
    status: row.status ?? 'pending',
    replyOwner: row.reply_owner,
    replyAt: row.reply_at,
    createdAt: row.created_at,
  };
}

function toAttractionPhoto(row: AttractionPhotoRow): AttractionPhoto {
  return {
    id: row.id,
    attractionId: row.attraction_id,
    cityId: row.city_id,
    authorProfileId: row.author_profile_id,
    storagePath: row.storage_path,
    mediaType: row.media_type ?? 'image',
    caption: row.caption,
    status: row.status ?? 'pending',
    createdAt: row.created_at,
  };
}

function toAttractionService(row: AttractionServiceRow): AttractionService {
  return {
    id: row.id,
    attractionId: row.attraction_id,
    kind: row.kind,
    label: row.label,
    details: row.details,
    price: row.price,
    contactBusinessId: row.contact_business_id,
  };
}

export async function listAccommodations(
  params: {
    city_id?: string;
    filters?: {
      type?: AccommodationKind;
      near_lake?: boolean;
      has_marina?: boolean;
      district_id?: string;
      max_price?: number;
      max_guests?: number;
      amenity?: string;
    };
    includeDrafts?: boolean;
    limit?: number;
  } = {},
): Promise<Accommodation[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const limit = params.limit ?? 50;
  const f = params.filters ?? {};

  if (params.includeDrafts) {
    const supabase = await createClient();
    let query = supabase.from('accommodations').select(selectAccommodation()).eq('city_id', cityId);
    if (f.type) query = query.eq('type', f.type);
    if (f.near_lake !== undefined) query = query.eq('near_lake', f.near_lake);
    if (f.has_marina !== undefined) query = query.eq('has_marina', f.has_marina);
    if (f.district_id) query = query.eq('district_id', f.district_id);
    if (f.max_price) query = query.lte('price_min', f.max_price);
    if (f.max_guests) query = query.gte('max_guests', f.max_guests);
    query = query
      .order('featured', { ascending: false })
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);
    const { data, error } = await query;
    if (error) return [];
    let items = ((data ?? []) as unknown as AccommodationRow[]).map(toAccommodation);
    if (f.amenity) items = items.filter((item) => item.amenities.includes(f.amenity!));
    return items;
  }

  return publicCached(
    {
      key: 'tourism:accommodations',
      tags: ['tourism', `tourism:${cityId}`, `accommodations:${cityId}`],
      parts: [
        cityId,
        f.type ?? '',
        f.near_lake ?? '',
        f.has_marina ?? '',
        f.district_id ?? '',
        f.max_price ?? '',
        f.max_guests ?? '',
        f.amenity ?? '',
        limit,
      ],
    },
    async (supabase) => {
      let query = supabase
        .from('accommodations')
        .select(selectAccommodation())
        .eq('city_id', cityId)
        .eq('status', 'published');
      if (f.type) query = query.eq('type', f.type);
      if (f.near_lake !== undefined) query = query.eq('near_lake', f.near_lake);
      if (f.has_marina !== undefined) query = query.eq('has_marina', f.has_marina);
      if (f.district_id) query = query.eq('district_id', f.district_id);
      if (f.max_price) query = query.lte('price_min', f.max_price);
      if (f.max_guests) query = query.gte('max_guests', f.max_guests);
      query = query
        .order('featured', { ascending: false })
        .order('featured_until', { ascending: false, nullsFirst: false })
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(limit);
      const { data, error } = await query;
      if (error) return [];
      let items = ((data ?? []) as unknown as AccommodationRow[]).map(toAccommodation);
      if (f.amenity) items = items.filter((item) => item.amenities.includes(f.amenity!));
      return items;
    },
  );
}

export async function getAccommodationBySlug(params: {
  city_id?: string;
  slug: string;
}): Promise<Accommodation | null> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return null;

  return publicCached(
    {
      key: 'tourism:accommodation-detail',
      tags: [
        'tourism',
        `tourism:${cityId}`,
        `accommodations:${cityId}`,
        `accommodation:${cityId}:${params.slug}`,
      ],
      parts: [cityId, params.slug],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('accommodations')
        .select(selectAccommodation())
        .eq('city_id', cityId)
        .eq('slug', params.slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error || !data) return null;
      return toAccommodation(data as unknown as AccommodationRow);
    },
  );
}

export async function listRestaurants(
  params: {
    city_id?: string;
    cuisine?: string;
    price_range?: string;
    delivery?: boolean;
    includeDrafts?: boolean;
    limit?: number;
  } = {},
): Promise<TourismRestaurant[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const limit = params.limit ?? 50;

  if (params.includeDrafts) {
    const supabase = await createClient();
    let query = supabase.from('restaurants').select(selectRestaurant()).eq('city_id', cityId);
    if (params.price_range) query = query.eq('price_range', params.price_range);
    if (params.delivery !== undefined) query = query.eq('delivery', params.delivery);
    query = query
      .order('featured', { ascending: false })
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .limit(limit);
    const { data, error } = await query;
    if (error) return [];
    let items = ((data ?? []) as unknown as RestaurantRow[]).map(toRestaurant);
    if (params.cuisine) items = items.filter((item) => item.cuisine.includes(params.cuisine!));
    return items;
  }

  return publicCached(
    {
      key: 'tourism:restaurants',
      tags: ['tourism', `tourism:${cityId}`, `restaurants:${cityId}`],
      parts: [cityId, params.cuisine ?? '', params.price_range ?? '', params.delivery ?? '', limit],
    },
    async (supabase) => {
      let query = supabase
        .from('restaurants')
        .select(selectRestaurant())
        .eq('city_id', cityId)
        .eq('status', 'published');
      if (params.price_range) query = query.eq('price_range', params.price_range);
      if (params.delivery !== undefined) query = query.eq('delivery', params.delivery);
      query = query
        .order('featured', { ascending: false })
        .order('featured_until', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })
        .limit(limit);
      const { data, error } = await query;
      if (error) return [];
      let items = ((data ?? []) as unknown as RestaurantRow[]).map(toRestaurant);
      if (params.cuisine) items = items.filter((item) => item.cuisine.includes(params.cuisine!));
      return items;
    },
  );
}

export async function getRestaurantBySlug(params: {
  city_id?: string;
  slug: string;
}): Promise<TourismRestaurant | null> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return null;

  return publicCached(
    {
      key: 'tourism:restaurant-detail',
      tags: [
        'tourism',
        `tourism:${cityId}`,
        `restaurants:${cityId}`,
        `restaurant:${cityId}:${params.slug}`,
      ],
      parts: [cityId, params.slug],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('restaurants')
        .select(selectRestaurant())
        .eq('city_id', cityId)
        .eq('slug', params.slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error || !data) return null;
      return toRestaurant(data as unknown as RestaurantRow);
    },
  );
}

export async function listAttractions(
  params: { city_id?: string; type?: AttractionKind; includeDrafts?: boolean; limit?: number } = {},
): Promise<Attraction[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const limit = params.limit ?? 50;

  if (params.includeDrafts) {
    const supabase = await createClient();
    let query = supabase.from('attractions').select(selectAttraction()).eq('city_id', cityId);
    if (params.type) query = query.eq('type', params.type);
    const { data, error } = await query
      .order('featured', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data ?? []) as unknown as AttractionRow[]).map(toAttraction);
  }

  return publicCached(
    {
      key: 'tourism:attractions',
      tags: ['tourism', `tourism:${cityId}`, `attractions:${cityId}`],
      parts: [cityId, params.type ?? '', limit],
    },
    async (supabase) => {
      let query = supabase
        .from('attractions')
        .select(selectAttraction())
        .eq('city_id', cityId)
        .eq('status', 'published');
      if (params.type) query = query.eq('type', params.type);
      const { data, error } = await query
        .order('featured', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) return [];
      const items = ((data ?? []) as unknown as AttractionRow[]).map(toAttraction);
      return items.filter(isPublicAttraction);
    },
  );
}

export async function getAttractionBySlug(params: {
  city_id?: string;
  slug: string;
}): Promise<Attraction | null> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return null;

  return publicCached(
    {
      key: 'tourism:attraction-detail',
      tags: [
        'tourism',
        `tourism:${cityId}`,
        `attractions:${cityId}`,
        `attraction:${cityId}:${params.slug}`,
      ],
      parts: [cityId, params.slug],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('attractions')
        .select(selectAttraction())
        .eq('city_id', cityId)
        .eq('slug', params.slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error || !data) return null;
      const item = toAttraction(data as unknown as AttractionRow);
      return isPublicAttraction(item) ? item : null;
    },
  );
}

export async function listAttractionsAdmin(
  params: {
    city_id?: string;
    status?: Attraction['status'];
    type?: AttractionKind;
    featured?: boolean;
    withoutOwner?: boolean;
    q?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<{ items: Attraction[]; count: number }> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return { items: [], count: 0 };
  const supabase = await createClient();
  const pageSize = params.pageSize ?? 25;
  const page = Math.max(params.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('attractions')
    .select(selectAttraction(), { count: 'exact' })
    .eq('city_id', cityId);

  if (params.status) query = query.eq('status', params.status);
  if (params.type) query = query.eq('type', params.type);
  if (params.featured !== undefined) query = query.eq('featured', params.featured);
  if (params.withoutOwner) query = query.is('owner_profile_id', null);
  if (params.q) query = query.ilike('name', `%${params.q}%`);

  const { data, error, count } = await query
    .order('featured', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(from, to);
  if (error) return { items: [], count: 0 };
  return {
    items: ((data ?? []) as unknown as AttractionRow[]).map(toAttraction),
    count: count ?? 0,
  };
}

/** Atrações publicáveis, na ordem será aplicada na página do guia. */
export async function listPublishedAttractionsByIds(params: {
  city_id: string;
  ids: string[];
}): Promise<Attraction[]> {
  const unique = [...new Set(params.ids)].filter(Boolean).sort();
  if (unique.length === 0) return [];

  return publicCached(
    {
      key: 'tourism:attractions-by-ids',
      tags: ['tourism', `tourism:${params.city_id}`, `attractions:${params.city_id}`],
      parts: [params.city_id, unique.join(',')],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('attractions')
        .select(selectAttraction())
        .eq('city_id', params.city_id)
        .in('id', unique)
        .eq('status', 'published');
      if (error || !data) return [];
      const items = ((data ?? []) as unknown as AttractionRow[]).map(toAttraction);
      return items.filter(isPublicAttraction);
    },
  );
}

export async function getAttractionFullBySlug(params: {
  city_id?: string;
  slug: string;
}): Promise<AttractionFull | null> {
  const attraction = await getAttractionBySlug(params);
  if (!attraction) return null;
  const supabase = await createClient();

  const [reviewsResult, photosResult, servicesResult, packagesResult] = await Promise.all([
    supabase
      .from('attraction_reviews')
      .select(
        'id, attraction_id, city_id, author_profile_id, rating, title, comment, photo_url, status, reply_owner, reply_at, created_at',
      )
      .eq('attraction_id', attraction.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('attraction_photos')
      .select(
        'id, attraction_id, city_id, author_profile_id, storage_path, media_type, caption, status, created_at',
      )
      .eq('attraction_id', attraction.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('attraction_services')
      .select('id, attraction_id, kind, label, details, price, contact_business_id')
      .eq('attraction_id', attraction.id)
      .order('kind'),
    supabase
      .from('tour_packages')
      .select('*')
      .eq('city_id', attraction.cityId)
      .eq('status', 'published')
      .contains('itinerary', [{ attraction_id: attraction.id }])
      .limit(6),
  ]);

  const reviews = ((reviewsResult.data ?? []) as unknown as AttractionReviewRow[]).map(
    toAttractionReview,
  );
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : attraction.rating;

  return {
    ...attraction,
    reviews,
    publicPhotos: ((photosResult.data ?? []) as unknown as AttractionPhotoRow[]).map(
      toAttractionPhoto,
    ),
    services: ((servicesResult.data ?? []) as unknown as AttractionServiceRow[]).map(
      toAttractionService,
    ),
    relatedPackages: ((packagesResult.data ?? []) as unknown[]).map(toTourPackage),
    averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
  };
}

function mapFishingSpot(row: Record<string, unknown>): FishingSpot {
  return {
    id: row.id as string,
    cityId: row.city_id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string | null,
    lat: row.lat as number | null,
    lng: row.lng as number | null,
    species: asStringArray(row.species),
    regulations: row.regulations as string | null,
    defesoPeriod: row.defeso_period as string | null,
    requiresGuide: (row.requires_guide as boolean | null) ?? false,
    accessDifficulty: row.access_difficulty as FishingSpot['accessDifficulty'],
    coverUrl: row.cover_url as string | null,
    photos: asStringArray(row.photos),
    status: (row.status as FishingSpot['status']) ?? 'draft',
  };
}

export async function listFishingSpots(
  params: { city_id?: string; includeDrafts?: boolean; limit?: number } = {},
): Promise<FishingSpot[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const limit = params.limit ?? 50;

  if (params.includeDrafts) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('fishing_spots')
      .select('*')
      .eq('city_id', cityId)
      .order('name')
      .limit(limit);
    if (error) return [];
    return (data ?? []).map((row) => mapFishingSpot(row as Record<string, unknown>));
  }

  return publicCached(
    {
      key: 'tourism:fishing-spots',
      tags: ['tourism', `tourism:${cityId}`, `fishing:${cityId}`],
      parts: [cityId, limit],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('fishing_spots')
        .select('*')
        .eq('city_id', cityId)
        .eq('status', 'published')
        .order('name')
        .limit(limit);
      if (error) return [];
      return (data ?? []).map((row) => mapFishingSpot(row as Record<string, unknown>));
    },
  );
}

export async function getFishingSpotBySlug(params: {
  city_id?: string;
  slug: string;
}): Promise<FishingSpot | null> {
  const items = await listFishingSpots({ city_id: params.city_id, limit: 200 });
  return items.find((item) => item.slug === params.slug) ?? null;
}

function mapFishingGuide(value: unknown): FishingGuide {
  const row = value as Record<string, unknown>;
  return {
    id: row.id as string,
    cityId: row.city_id as string,
    slug: row.slug as string,
    fullName: row.full_name as string,
    licenseNumber: row.license_number as string | null,
    about: row.about as string | null,
    phone: row.phone as string | null,
    whatsapp: row.whatsapp as string | null,
    email: row.email as string | null,
    services: asStringArray(row.services),
    priceRange: row.price_range as string | null,
    hasBoat: (row.has_boat as boolean | null) ?? false,
    photoUrl: row.photo_url as string | null,
    ownerProfileId: row.owner_profile_id as string | null,
    status: ((row.status as string | null) ?? 'draft') as FishingGuide['status'],
    verified: (row.verified as boolean | null) ?? false,
    ogImageUrl: (row.og_image_url as string | null) ?? undefined,
    ogSquareImageUrl: (row.og_square_image_url as string | null) ?? undefined,
  };
}

export async function listFishingGuides(
  params: { city_id?: string; has_boat?: boolean; includeDrafts?: boolean; limit?: number } = {},
): Promise<FishingGuide[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const limit = params.limit ?? 50;

  if (params.includeDrafts) {
    const supabase = await createClient();
    let query = supabase.from('fishing_guides').select('*').eq('city_id', cityId);
    if (params.has_boat !== undefined) query = query.eq('has_boat', params.has_boat);
    const { data, error } = await query
      .order('verified', { ascending: false })
      .order('full_name')
      .limit(limit);
    if (error) return [];
    return ((data ?? []) as unknown[]).map(mapFishingGuide);
  }

  return publicCached(
    {
      key: 'tourism:fishing-guides',
      tags: ['tourism', `tourism:${cityId}`, `fishing:${cityId}`],
      parts: [cityId, params.has_boat ?? '', limit],
    },
    async (supabase) => {
      let query = supabase
        .from('fishing_guides')
        .select('*')
        .eq('city_id', cityId)
        .eq('status', 'published');
      if (params.has_boat !== undefined) query = query.eq('has_boat', params.has_boat);
      const { data, error } = await query
        .order('verified', { ascending: false })
        .order('full_name')
        .limit(limit);
      if (error) return [];
      return ((data ?? []) as unknown[]).map(mapFishingGuide);
    },
  );
}

export async function getFishingGuideBySlug(params: {
  city_id?: string;
  slug: string;
}): Promise<FishingGuide | null> {
  const items = await listFishingGuides({ city_id: params.city_id, limit: 200 });
  return items.find((item) => item.slug === params.slug) ?? null;
}

export async function listTourPackages(
  params: {
    city_id?: string;
    provider_business_id?: string;
    includeDrafts?: boolean;
    limit?: number;
  } = {},
): Promise<TourPackage[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const limit = params.limit ?? 50;

  if (params.includeDrafts) {
    const supabase = await createClient();
    let query = supabase.from('tour_packages').select('*').eq('city_id', cityId);
    if (params.provider_business_id)
      query = query.eq('provider_business_id', params.provider_business_id);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
    if (error) return [];
    return ((data ?? []) as unknown[]).map(toTourPackage);
  }

  return publicCached(
    {
      key: 'tourism:tour-packages',
      tags: ['tourism', `tourism:${cityId}`, `tour-packages:${cityId}`],
      parts: [cityId, params.provider_business_id ?? '', limit],
    },
    async (supabase) => {
      let query = supabase
        .from('tour_packages')
        .select('*')
        .eq('city_id', cityId)
        .eq('status', 'published');
      if (params.provider_business_id)
        query = query.eq('provider_business_id', params.provider_business_id);
      const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
      if (error) return [];
      const items = ((data ?? []) as unknown[]).map(toTourPackage);
      return items.filter(isPublicTourPackage);
    },
  );
}

export async function getTourPackageBySlug(params: {
  city_id?: string;
  slug: string;
}): Promise<TourPackage | null> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return null;

  return publicCached(
    {
      key: 'tourism:tour-package-detail',
      tags: [
        'tourism',
        `tourism:${cityId}`,
        `tour-packages:${cityId}`,
        `tour-package:${cityId}:${params.slug}`,
      ],
      parts: [cityId, params.slug],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('tour_packages')
        .select('*')
        .eq('city_id', cityId)
        .eq('slug', params.slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error || !data) return null;
      const item = toTourPackage(data);
      return isPublicTourPackage(item) ? item : null;
    },
  );
}

function toTourPackage(value: unknown): TourPackage {
  const row = value as {
    id: string;
    city_id: string;
    provider_business_id: string | null;
    slug: string;
    title: string;
    description: string | null;
    duration_hours: number | null;
    price: number | null;
    includes: unknown;
    contact_phone: string | null;
    contact_whatsapp: string | null;
    cover_url: string | null;
    itinerary?: unknown;
    difficulty?: string | null;
    total_duration_hours?: number | null;
    total_distance_km?: number | null;
    gallery?: unknown;
    featured?: boolean | null;
    status: TourPackage['status'] | null;
  };
  return {
    id: row.id,
    cityId: row.city_id,
    providerBusinessId: row.provider_business_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    durationHours: row.duration_hours,
    price: row.price,
    includes: asStringArray(row.includes),
    contactPhone: row.contact_phone,
    contactWhatsapp: row.contact_whatsapp,
    coverUrl: row.cover_url,
    itinerary: Array.isArray(row.itinerary) ? row.itinerary : [],
    difficulty: row.difficulty ?? null,
    totalDurationHours: row.total_duration_hours ?? null,
    totalDistanceKm: row.total_distance_km ?? null,
    gallery: asStringArray(row.gallery),
    featured: row.featured ?? false,
    status: row.status ?? 'draft',
  };
}

// ---------------------------------------------------------------------------
// Tourism Guides
// ---------------------------------------------------------------------------

type GuideRow = {
  id: string;
  city_id: string;
  slug: string;
  aliases: unknown;
  kind: GuideKind | null;
  name: string;
  tagline: string | null;
  description: string | null;
  youtube_url: string | null;
  cover_url: string | null;
  photos: unknown;
  google_place_id: string | null;
  google_maps_url: string | null;
  google_summary: string | null;
  google_photos: unknown;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  sections: unknown;
  seo: unknown;
  practical_info: unknown;
  faq: unknown;
  highlights: unknown;
  content_blocks: unknown;
  rating: number | null;
  reviews_count: number | null;
  owner_profile_id: string | null;
  status: TourismGuide['status'] | null;
  featured: boolean | null;
  og_image_url: string | null;
  og_square_image_url: string | null;
};

type GuideReviewRow = {
  id: string;
  guide_id: string;
  city_id: string;
  author_profile_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  photo_url: string | null;
  visit_date: string | null;
  status: GuideReview['status'] | null;
  reply_owner: string | null;
  reply_at: string | null;
  created_at: string | null;
};

type GuidePhotoRow = {
  id: string;
  guide_id: string;
  city_id: string;
  author_profile_id: string;
  storage_path: string;
  caption: string | null;
  status: GuidePhoto['status'] | null;
  created_at: string | null;
};

type GuideLinkedEntityRow = {
  id: string;
  guide_id: string;
  entity_type: string;
  entity_id: string;
  sort_order: number;
  label: string | null;
  description: string | null;
};

function selectGuide() {
  return 'id, city_id, slug, aliases, kind, name, tagline, description, youtube_url, cover_url, photos, google_place_id, google_maps_url, google_summary, google_photos, address, lat, lng, phone, whatsapp, website, instagram, sections, seo, practical_info, faq, highlights, content_blocks, rating, reviews_count, owner_profile_id, status, featured, og_image_url, og_square_image_url';
}

function asGuideHighlights(value: unknown): GuideHighlight[] {
  return asRecordArray(value).map((row) => ({
    icon: String(row.icon ?? 'star'),
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
  }));
}

function asGuideSections(value: unknown): GuideSection[] {
  return asRecordArray(value).map((row) => ({
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    subtitle: asNullableString(row.subtitle),
    content: Array.isArray(row.content)
      ? row.content.filter((v: unknown) => typeof v === 'string')
      : null,
    items: Array.isArray(row.items)
      ? row.items.map((item: Record<string, unknown>) => {
          const image = asNullableString(item.image);
          return {
            title: String(item.title ?? ''),
            description: String(item.description ?? ''),
            image,
            imageAssetId: asNullableString(item.imageAssetId),
            alt: asNullableString(item.alt),
            tags: asStringArray(item.tags),
            mediaKind: parseMediaKind(item.mediaKind, image),
          };
        })
      : null,
    fares: Array.isArray(row.fares)
      ? row.fares.map((fare: Record<string, unknown>) => ({
          type: String(fare.type ?? ''),
          price: String(fare.price ?? ''),
          note: asNullableString(fare.note),
        }))
      : null,
    warning: asNullableString(row.warning),
    cta:
      row.cta && typeof row.cta === 'object'
        ? {
            label: String((row.cta as Record<string, unknown>).label ?? ''),
            href: String((row.cta as Record<string, unknown>).href ?? ''),
          }
        : null,
    date:
      row.date && typeof row.date === 'object'
        ? {
            month: String((row.date as Record<string, unknown>).month ?? ''),
            mainDay: String((row.date as Record<string, unknown>).mainDay ?? ''),
            period: String((row.date as Record<string, unknown>).period ?? ''),
          }
        : null,
    description: asNullableString(row.description),
    programHighlights: Array.isArray(row.programHighlights)
      ? row.programHighlights.filter((v: unknown) => typeof v === 'string')
      : null,
    tips: Array.isArray(row.tips) ? row.tips.filter((v: unknown) => typeof v === 'string') : null,
    seasons: Array.isArray(row.seasons)
      ? row.seasons.map((s: Record<string, unknown>) => ({
          period: String(s.period ?? ''),
          idealFor: String(s.idealFor ?? ''),
          description: String(s.description ?? ''),
        }))
      : null,
    places: Array.isArray(row.places)
      ? row.places.map((p: Record<string, unknown>) => ({
          name: String(p.name ?? ''),
          category: String(p.category ?? ''),
          description: String(p.description ?? ''),
          address: asNullableString(p.address),
          featured: Boolean(p.featured),
          needsVerification: Boolean(p.needsVerification),
        }))
      : null,
    experiences: Array.isArray(row.experiences)
      ? row.experiences.map((exp: Record<string, unknown>) => {
          const image = asNullableString(exp.image);
          const ctaObj = exp.cta && typeof exp.cta === 'object' ? (exp.cta as Record<string, unknown>) : null;
          return {
            title: String(exp.title ?? ''),
            description: String(exp.description ?? ''),
            image,
            imageAssetId: asNullableString(exp.imageAssetId),
            alt: asNullableString(exp.alt),
            mediaKind: parseMediaKind(exp.mediaKind, image),
            duration: asNullableString(exp.duration),
            price: asNullableString(exp.price),
            tags: asStringArray(exp.tags),
            cta: ctaObj
              ? {
                  label: String(ctaObj.label ?? ''),
                  href: String(ctaObj.href ?? ''),
                }
              : null,
          };
        })
      : null,
  }));
}

function parseMediaKind(raw: unknown, url: string | null): 'image' | 'video' | null {
  if (raw === 'video' || raw === 'image') return raw;
  if (!url) return null;
  return inferMediaKindFromUrl(url);
}

function inferMediaKindFromUrl(url: string): 'image' | 'video' {
  const clean = url.split('?')[0].toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogv)$/.test(clean)) return 'video';
  return 'image';
}

function asGuideFaq(value: unknown): GuideFaqItem[] {
  return asRecordArray(value).map((row) => ({
    question: String(row.question ?? ''),
    answer: String(row.answer ?? ''),
  }));
}

function asGuidePracticalInfo(value: unknown): GuidePracticalItem[] {
  return asRecordArray(value).map((row) => ({
    title: String(row.title ?? ''),
    text: String(row.text ?? ''),
  }));
}

function asGuideContentBlocks(value: unknown): GuideContentBlock[] {
  return asRecordArray(value).map((row) => ({
    type: (row.type === 'banner' ? 'banner' : 'quote') as 'quote' | 'banner',
    title: String(row.title ?? ''),
    text: String(row.text ?? ''),
    button:
      row.button && typeof row.button === 'object'
        ? {
            label: String((row.button as Record<string, unknown>).label ?? ''),
            href: String((row.button as Record<string, unknown>).href ?? ''),
          }
        : null,
  }));
}

function toGuide(row: GuideRow): TourismGuide {
  return {
    id: row.id,
    cityId: row.city_id,
    slug: row.slug,
    aliases: asStringArray(row.aliases),
    kind: row.kind ?? 'distrito',
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    youtubeUrl: row.youtube_url,
    coverUrl: row.cover_url,
    photos: asStringArray(row.photos),
    googlePlaceId: row.google_place_id,
    googleMapsUrl: row.google_maps_url,
    googleSummary: row.google_summary,
    googlePhotos: getGoogleAttractionPhotos(row.google_photos),
    googleReviews: getGoogleAttractionReviews(row.google_photos),
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    whatsapp: row.whatsapp,
    website: row.website,
    instagram: row.instagram,
    sections: asGuideSections(row.sections),
    seo: asRecord(row.seo),
    practicalInfo: asGuidePracticalInfo(row.practical_info),
    faq: asGuideFaq(row.faq),
    highlights: asGuideHighlights(row.highlights),
    contentBlocks: asGuideContentBlocks(row.content_blocks),
    rating: row.rating,
    reviewsCount: row.reviews_count ?? 0,
    ownerProfileId: row.owner_profile_id,
    status: row.status ?? 'draft',
    featured: row.featured ?? false,
    ogImageUrl: row.og_image_url ?? undefined,
    ogSquareImageUrl: row.og_square_image_url ?? undefined,
  };
}

function toGuideReview(row: GuideReviewRow): GuideReview {
  return {
    id: row.id,
    guideId: row.guide_id,
    cityId: row.city_id,
    authorProfileId: row.author_profile_id,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    photoUrl: row.photo_url,
    visitDate: row.visit_date,
    status: row.status ?? 'pending',
    replyOwner: row.reply_owner,
    replyAt: row.reply_at,
    createdAt: row.created_at,
  };
}

function toGuidePhoto(row: GuidePhotoRow): GuidePhoto {
  return {
    id: row.id,
    guideId: row.guide_id,
    cityId: row.city_id,
    authorProfileId: row.author_profile_id,
    storagePath: row.storage_path,
    caption: row.caption,
    status: row.status ?? 'pending',
    createdAt: row.created_at,
  };
}

function toGuideLinkedEntity(row: GuideLinkedEntityRow): GuideLinkedEntity {
  return {
    id: row.id,
    guideId: row.guide_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    sortOrder: row.sort_order,
    label: row.label,
    description: row.description,
  };
}

function guideFrom(
  supabase:
    | Awaited<ReturnType<typeof createClient>>
    | ReturnType<typeof import('@/lib/supabase/public').createPublicClient>,
  table: string,
) {
  // Tables not yet in generated types — remove after `supabase gen types`
  type UntypedFrom = {
    select: (q: string) => UntypedQuery;
    insert: (r: Record<string, unknown>) => UntypedQuery;
  };
  type UntypedQuery = {
    eq: (c: string, v: unknown) => UntypedQuery;
    contains: (c: string, v: unknown) => UntypedQuery;
    order: (c: string, o?: Record<string, unknown>) => UntypedQuery;
    limit: (n: number) => UntypedQuery;
    single: () => UntypedQuery;
    maybeSingle: () => UntypedQuery;
    then: Promise<unknown>['then'];
  } & PromiseLike<{ data: unknown; error: unknown }>;
  return (supabase as unknown as { from: (t: string) => UntypedFrom }).from(table);
}

export async function listGuides(
  params: { city_id?: string; kind?: GuideKind; includeDrafts?: boolean; limit?: number } = {},
): Promise<TourismGuide[]> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return [];

  const limit = params.limit ?? 50;

  if (params.includeDrafts) {
    const supabase = await createClient();
    let query = guideFrom(supabase, 'tourism_guides').select(selectGuide()).eq('city_id', cityId);
    if (params.kind) query = query.eq('kind', params.kind);
    const { data, error } = await query
      .order('featured', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data ?? []) as unknown as GuideRow[]).map(toGuide);
  }

  return publicCached(
    {
      key: 'tourism:guides',
      tags: ['tourism', `tourism:${cityId}`, `guides:${cityId}`],
      parts: [cityId, params.kind ?? '', limit],
    },
    async (supabase) => {
      let query = guideFrom(supabase, 'tourism_guides')
        .select(selectGuide())
        .eq('city_id', cityId)
        .eq('status', 'published');
      if (params.kind) query = query.eq('kind', params.kind);
      const { data, error } = await query
        .order('featured', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) return [];
      return ((data ?? []) as unknown as GuideRow[]).map(toGuide);
    },
  );
}

export async function getGuideBySlug(params: {
  city_id?: string;
  slug: string;
}): Promise<TourismGuide | null> {
  const cityId = await getCityId(params.city_id);
  if (!cityId) return null;

  return publicCached(
    {
      key: 'tourism:guide-detail',
      tags: ['tourism', `tourism:${cityId}`, `guides:${cityId}`, `guide:${cityId}:${params.slug}`],
      parts: [cityId, params.slug],
    },
    async (supabase) => {
      let { data, error } = await guideFrom(supabase, 'tourism_guides')
        .select(selectGuide())
        .eq('city_id', cityId)
        .eq('slug', params.slug)
        .eq('status', 'published')
        .maybeSingle();

      if (!data && !error) {
        const result = await guideFrom(supabase, 'tourism_guides')
          .select(selectGuide())
          .eq('city_id', cityId)
          .contains('aliases', [params.slug])
          .eq('status', 'published')
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      if (error || !data) return null;
      return toGuide(data as unknown as GuideRow);
    },
  );
}

export async function getGuideFullBySlug(params: {
  city_id?: string;
  slug: string;
}): Promise<TourismGuideFull | null> {
  const guide = await getGuideBySlug(params);
  if (!guide) return null;
  const supabase = await createClient();

  const [reviewsResult, photosResult, linkedResult, cdnMediaResult] = await Promise.all([
    guideFrom(supabase, 'guide_reviews')
      .select(
        'id, guide_id, city_id, author_profile_id, rating, title, comment, photo_url, visit_date, status, reply_owner, reply_at, created_at',
      )
      .eq('guide_id', guide.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(20),
    guideFrom(supabase, 'guide_photos')
      .select('id, guide_id, city_id, author_profile_id, storage_path, caption, status, created_at')
      .eq('guide_id', guide.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(30),
    guideFrom(supabase, 'guide_linked_entities')
      .select('id, guide_id, entity_type, entity_id, sort_order, label, description')
      .eq('guide_id', guide.id)
      .order('sort_order'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('media_links')
      .select('asset_id, role, position, media_assets(cdn_url, content_type, alt_text)')
      .eq('city_id', guide.cityId)
      .eq('entity_type', 'tourism_guide')
      .eq('entity_id', guide.id)
      .eq('role', 'gallery')
      .order('position', { ascending: false }),
  ]);

  const reviews = ((reviewsResult.data ?? []) as unknown as GuideReviewRow[]).map(toGuideReview);
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : guide.rating;

  const cdnMedia = (
    (cdnMediaResult.data ?? []) as Array<{
      asset_id: string;
      media_assets: {
        cdn_url: string | null;
        content_type: string | null;
        alt_text: string | null;
      } | null;
    }>
  ).flatMap((row) => {
    const url = row.media_assets?.cdn_url;
    if (!url) return [];
    const contentType = row.media_assets?.content_type ?? null;
    const kind = contentType?.startsWith('video/') ? 'video' : 'image';
    return [
      {
        assetId: row.asset_id,
        url,
        kind,
        contentType,
        altText: row.media_assets?.alt_text ?? null,
      } as const,
    ];
  });

  return {
    ...guide,
    reviews,
    publicPhotos: ((photosResult.data ?? []) as unknown as GuidePhotoRow[]).map(toGuidePhoto),
    linkedEntities: ((linkedResult.data ?? []) as unknown as GuideLinkedEntityRow[]).map(
      toGuideLinkedEntity,
    ),
    cdnMedia,
    averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
  };
}

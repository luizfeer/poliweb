import 'server-only';
import { getCurrentCity } from '@/lib/cities';
import { searchTermsForBroadIlike } from '@/lib/search/query-tokens';
import { createClient } from '@/lib/supabase/server';
import { isListingType, isPropertyType, type ListingType, type PropertyType } from './pricing';
import {
  asStringArray,
  type Property,
  type PropertyInquiry,
  type PropertyRow,
  type PropertySearchParams,
  type Realtor,
  type RealtorRow,
} from './types';

const DEFAULT_LIMIT = 24;

export async function listProperties(params: PropertySearchParams = {}): Promise<Property[]> {
  const cityId = await resolveCityId(params.cityId);
  if (!cityId) return [];

  const supabase = await createClient();
  let query = supabase
    .from('properties')
    .select(
      `
      *,
      districts(name),
      realtors(id, slug, name, logo_url, creci, verified, whatsapp, phone, email, subscription_plan)
    `,
    )
    .eq('city_id', cityId)
    .eq('status', 'published')
    .eq('review_status', 'approved')
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false })
    .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? DEFAULT_LIMIT) - 1);

  if (params.listingType) query = query.eq('listing_type', params.listingType);
  if (params.propertyType) query = query.eq('property_type', params.propertyType);
  if (params.districtId) query = query.eq('district_id', params.districtId);
  if (params.bedrooms) query = query.gte('bedrooms', params.bedrooms);
  if (params.bathrooms) query = query.gte('bathrooms', params.bathrooms);
  if (params.minPrice !== undefined) query = query.gte('price', params.minPrice);
  if (params.maxPrice !== undefined) query = query.lte('price', params.maxPrice);
  if (params.furnished !== undefined) query = query.eq('furnished', params.furnished);
  if (params.petsAllowed !== undefined) query = query.eq('pets_allowed', params.petsAllowed);
  if (params.q) {
    const terms = searchTermsForBroadIlike(params.q);
    if (terms.length === 1) {
      const t = terms[0];
      query = query.or(`title.ilike.%${t}%,description.ilike.%${t}%,reference_code.ilike.%${t}%`);
    } else if (terms.length > 1) {
      const ors = terms.flatMap((t) => [
        `title.ilike.%${t}%`,
        `description.ilike.%${t}%`,
        `reference_code.ilike.%${t}%`,
      ]);
      query = query.or(ors.join(','));
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as unknown as PropertyRow[]).map(toProperty);
}

export async function listFeaturedProperties(limit = 8): Promise<Property[]> {
  return listProperties({ limit });
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const cityId = await resolveCityId();
  if (!cityId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('properties')
    .select(
      `
      *,
      districts(name),
      realtors(id, slug, name, logo_url, creci, verified, whatsapp, phone, email, subscription_plan)
    `,
    )
    .eq('city_id', cityId)
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('review_status', 'approved')
    .or('expires_at.is.null,expires_at.gt.now()')
    .maybeSingle();

  if (error) throw error;

  return data ? toProperty(data as unknown as PropertyRow) : null;
}

export async function listRealtors(limit = 50): Promise<Realtor[]> {
  const cityId = await resolveCityId();
  if (!cityId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('realtors')
    .select('*, districts(name)')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('name', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return ((data ?? []) as unknown as RealtorRow[]).map(toRealtor);
}

export async function getRealtorBySlug(slug: string): Promise<Realtor | null> {
  const cityId = await resolveCityId();
  if (!cityId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('realtors')
    .select('*, districts(name)')
    .eq('city_id', cityId)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw error;

  return data ? toRealtor(data as unknown as RealtorRow) : null;
}

export async function listPropertiesByRealtor(realtorId: string, limit = 24): Promise<Property[]> {
  return listProperties({ limit }).then((items) =>
    items.filter((item) => item.realtorId === realtorId),
  );
}

export async function listPropertyInquiries(propertyId: string): Promise<PropertyInquiry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('property_inquiries')
    .select(
      'id, property_id, requester_name, requester_email, requester_phone, message, source, status, created_at',
    )
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item) => ({
    id: item.id,
    propertyId: item.property_id,
    requesterName: item.requester_name,
    requesterEmail: item.requester_email,
    requesterPhone: item.requester_phone,
    message: item.message,
    source: item.source,
    status: item.status,
    createdAt: item.created_at,
  }));
}

async function resolveCityId(cityId?: string): Promise<string | null> {
  if (cityId) return cityId;
  const city = await getCurrentCity();
  return city?.id ?? null;
}

function normalizeListingType(value: unknown): ListingType {
  return isListingType(value) ? value : 'sale';
}

function normalizePropertyType(value: unknown): PropertyType {
  return isPropertyType(value) ? value : 'apartment';
}

function toProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    cityId: row.city_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    listingType: normalizeListingType(row.listing_type),
    propertyType: normalizePropertyType(row.property_type),
    status: row.status ?? 'draft',
    reviewStatus: row.review_status,
    paymentStatus: row.payment_status,
    paymentAmountCents: row.payment_amount_cents,
    paymentProviderRef: row.payment_provider_ref,
    rejectionReason: row.rejection_reason,
    price: row.price,
    rentPrice: row.rent_price,
    condoFee: row.condo_fee,
    iptuYearly: row.iptu_yearly,
    areaTotalM2: row.area_total_m2,
    areaUsefulM2: row.area_useful_m2,
    bedrooms: row.bedrooms,
    suites: row.suites,
    bathrooms: row.bathrooms,
    parkingSpaces: row.parking_spaces,
    districtId: row.district_id,
    districtName: row.districts?.name ?? null,
    addressStreet: row.address_street,
    addressNumber: row.address_number,
    addressComplement: row.address_complement,
    cep: row.cep,
    showExactLocation: row.show_exact_location ?? false,
    lat: row.lat,
    lng: row.lng,
    amenities: asStringArray(row.amenities),
    furnished: row.furnished ?? false,
    petsAllowed: row.pets_allowed ?? false,
    hasPool: row.has_pool ?? false,
    hasGrill: row.has_grill ?? false,
    hasGarden: row.has_garden ?? false,
    hasGarage: row.has_garage ?? false,
    nearLake: row.near_lake ?? false,
    coverUrl: row.cover_url,
    photos: asStringArray(row.photos),
    videoUrl: row.video_url,
    featured: row.featured ?? false,
    featuredUntil: row.featured_until,
    viewsCount: row.views_count ?? 0,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerProfileId: row.owner_profile_id,
    realtorId: row.realtor_id,
    realtor: row.realtors
      ? {
          id: row.realtors.id,
          slug: row.realtors.slug,
          name: row.realtors.name,
          logoUrl: row.realtors.logo_url,
          creci: row.realtors.creci,
          verified: row.realtors.verified ?? false,
          whatsapp: row.realtors.whatsapp,
          phone: row.realtors.phone,
          email: row.realtors.email,
          subscriptionPlan: row.realtors.subscription_plan ?? 'free',
        }
      : null,
    ogImageUrl: row.og_image_url ?? undefined,
    ogSquareImageUrl: row.og_square_image_url ?? undefined,
  };
}

function toRealtor(row: RealtorRow): Realtor {
  return {
    id: row.id,
    cityId: row.city_id,
    slug: row.slug,
    name: row.name,
    legalName: row.legal_name,
    cnpj: row.cnpj,
    creci: row.creci,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    districtName: row.districts?.name ?? null,
    about: row.about,
    logoUrl: row.logo_url,
    coverUrl: row.cover_url,
    website: row.website,
    instagram: row.instagram,
    status: row.status ?? 'draft',
    verified: row.verified ?? false,
    featured: row.featured ?? false,
    subscriptionPlan: row.subscription_plan,
    createdAt: row.created_at,
  };
}

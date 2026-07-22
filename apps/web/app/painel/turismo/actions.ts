'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { anthropic, MODELS } from '@/lib/ai/anthropic';
import { getCurrentCity } from '@/lib/cities';
import { requireProfile, requireRole } from '@/lib/auth';
import { createNotification, notifyCityAdmins } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/lib/supabase/database.types';
import { uploadLinkedImage } from '@/lib/media/actions';
import { getErrorMessage } from '@/lib/errors/message';
import {
  getGooglePlaceDetails,
  getGooglePlacePhotoFile,
  searchGooglePlaces,
  type GooglePlaceCandidate,
  type GooglePlaceDetails,
} from '@/lib/google/places';

type AttractionUpdate = Database['public']['Tables']['attractions']['Update'];

type UploadedGooglePhoto = {
  name: string;
  role: 'gallery';
  attribution: string | null;
  asset_id: string;
  cdn_url: string;
  imported_at: string;
};

const nullableString = z
  .string()
  .trim()
  .max(8000)
  .transform((value) => (value ? value : null))
  .nullable();
const statusSchema = z.enum(['draft', 'pending', 'published', 'rejected', 'archived']);
const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]*$/)
  .max(80)
  .optional();

const accommodationSchema = z
  .object({
    id: z.string().uuid().optional(),
    city_id: z.string().uuid(),
    district_id: z.string().uuid().nullable(),
    slug: slugSchema,
    name: z.string().min(2).max(120),
    type: z.enum(['pousada', 'hotel', 'chale', 'airbnb', 'camping', 'rancho', 'casa_temporada']),
    short_description: z.string().max(160).nullable(),
    description: z.string().max(8000).nullable(),
    address: nullableString,
    cep: nullableString,
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    phone: nullableString,
    whatsapp: nullableString,
    email: z.string().email().nullable(),
    website: z.string().url().nullable(),
    booking_url: z.string().url().nullable(),
    airbnb_url: z.string().url().nullable(),
    instagram: nullableString,
    price_min: z.number().nonnegative().nullable(),
    price_max: z.number().nonnegative().nullable(),
    rooms_count: z.number().int().nonnegative().nullable(),
    max_guests: z.number().int().nonnegative().nullable(),
    amenities: z.array(z.string()).default([]),
    near_lake: z.boolean().default(false),
    has_marina: z.boolean().default(false),
    status: statusSchema.default('draft'),
  })
  .refine(
    (data) => !data.price_max || !data.price_min || data.price_max >= data.price_min,
    'price_max < price_min',
  );

const restaurantSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  district_id: z.string().uuid().nullable(),
  slug: slugSchema,
  name: z.string().min(2).max(120),
  description: z.string().max(8000).nullable(),
  cuisine: z.array(z.string()).default([]),
  price_range: z.enum(['$', '$$', '$$$', '$$$$']).nullable(),
  address: nullableString,
  phone: nullableString,
  whatsapp: nullableString,
  hours: z.record(z.string(), z.unknown()).default({}),
  delivery: z.boolean().default(false),
  ifood_url: z.string().url().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  status: statusSchema.default('draft'),
});

const guideSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  slug: slugSchema,
  full_name: z.string().min(2).max(120),
  license_number: nullableString,
  about: z.string().max(8000).nullable(),
  phone: nullableString,
  whatsapp: nullableString,
  email: z.string().email().nullable(),
  services: z.array(z.string()).default([]),
  price_range: nullableString,
  has_boat: z.boolean().default(false),
  photo_url: z.string().url().nullable(),
});

const spotSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  slug: slugSchema,
  name: z.string().min(2).max(120),
  description: z.string().max(8000).nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  species: z.array(z.string()).default([]),
  regulations: z.string().max(2000).nullable(),
  defeso_period: nullableString,
  requires_guide: z.boolean().default(false),
  access_difficulty: nullableString,
  status: statusSchema.default('draft'),
});

const attractionSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  slug: slugSchema,
  name: z.string().min(2).max(120),
  type: z.enum([
    'balneario',
    'mirante',
    'cachoeira',
    'trilha',
    'igreja',
    'museu',
    'parque',
    'praia',
    'lago',
    'historico',
  ]),
  description: z.string().max(8000).nullable(),
  address: nullableString,
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  hours_legacy_text: nullableString,
  entry_fee: nullableString,
  difficulty: nullableString,
  duration_minutes: z.number().int().nonnegative().nullable(),
  best_season: nullableString,
  phone: nullableString,
  whatsapp: nullableString,
  website: z
    .string()
    .url()
    .nullable()
    .or(z.literal('').transform(() => null)),
  instagram: nullableString,
  amenities: z.array(z.string()).default([]),
  tips: nullableString,
  price_range: nullableString,
  pet_friendly: z.boolean().default(false),
  family_friendly: z.boolean().default(false),
  status: statusSchema.default('draft'),
  featured: z.boolean().default(false),
});

const attractionReviewSchema = z.object({
  attraction_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).nullable(),
  comment: z.string().trim().max(2000).nullable(),
});

type AttractionMediaType = 'image' | 'video';

const attractionMediaMimeTypes = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
} satisfies Record<AttractionMediaType, string[]>;
const maxAttractionExperienceMediaItems = 5;

const attractionReviewModerationSchema = z.object({
  review_id: z.string().uuid(),
  attraction_id: z.string().uuid(),
  status: z.enum(['pending', 'published', 'rejected', 'archived']),
});

const attractionReviewReplySchema = z.object({
  review_id: z.string().uuid(),
  attraction_id: z.string().uuid(),
  reply_owner: z.string().trim().min(2).max(1000),
});

const attractionPhotoModerationSchema = z.object({
  photo_id: z.string().uuid(),
  attraction_id: z.string().uuid(),
  status: z.enum(['published', 'rejected', 'archived']),
});

const attractionServiceSchema = z.object({
  id: z.string().uuid().optional(),
  attraction_id: z.string().uuid(),
  kind: z.string().trim().min(2).max(80),
  label: z.string().trim().min(2).max(120),
  details: nullableString,
  price: z.number().nonnegative().nullable(),
  contact_business_id: z.string().uuid().nullable(),
});

const assignAttractionOwnerSchema = z.object({
  attraction_id: z.string().uuid(),
  owner_profile_id: z.string().uuid(),
});

const googleAttractionSearchSchema = z.object({
  attractionId: z.string().uuid(),
  query: z.string().trim().min(2).max(180),
});

const googleAttractionDetailsSchema = z.object({
  attractionId: z.string().uuid(),
  placeId: z.string().trim().min(3).max(180),
});

const googleAttractionApplySchema = z.object({
  attractionId: z.string().uuid(),
  placeId: z.string().trim().min(3).max(180),
  fields: z
    .array(
      z.enum([
        'name',
        'address',
        'phone',
        'website',
        'google_maps_url',
        'street_view',
        'lat_lng',
        'hours',
        'rating',
        'reviews',
        'summaries',
        'attributes',
        'amenities',
        'price',
      ]),
    )
    .default([]),
  photos: z.array(z.string().trim().min(3).max(1024)).max(20).default([]),
  reviews: z.array(z.string().trim().min(3).max(512)).max(5).default([]),
});

const packageSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  provider_business_id: z.string().uuid().nullable(),
  slug: slugSchema,
  title: z.string().min(2).max(140),
  description: z.string().max(8000).nullable(),
  duration_hours: z.number().nonnegative().nullable(),
  price: z.number().nonnegative().nullable(),
  includes: z.array(z.string()).default([]),
  contact_phone: nullableString,
  contact_whatsapp: nullableString,
  itinerary: z.array(z.record(z.string(), z.unknown())).default([]),
  difficulty: nullableString,
  total_duration_hours: z.number().nonnegative().nullable(),
  total_distance_km: z.number().nonnegative().nullable(),
  gallery: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  status: statusSchema.default('draft'),
});

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? '').trim();
  return value ? value : null;
}

function getAttractionMediaType(file: File): AttractionMediaType {
  if (attractionMediaMimeTypes.image.includes(file.type)) return 'image';
  if (attractionMediaMimeTypes.video.includes(file.type)) return 'video';
  throw new Error('Arquivo inválido. Envie JPG, PNG, WebP, MP4, WebM ou MOV.');
}

function getSafeMediaExtension(fileName: string, mediaType: AttractionMediaType): string {
  const rawExtension = fileName
    .split('.')
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const fallback = mediaType === 'image' ? 'jpg' : 'mp4';
  return rawExtension || fallback;
}

function nullableUrl(formData: FormData, key: string): string | null {
  return text(formData, key);
}

function num(formData: FormData, key: string): number | null {
  const value = text(formData, key);
  return value ? Number(value) : null;
}

function arr(formData: FormData, key: string): string[] {
  return String(formData.get(key) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function jsonRecord(formData: FormData, key: string): Record<string, unknown> {
  const value = text(formData, key);
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function jsonArray(formData: FormData, key: string): Record<string, unknown>[] {
  const value = text(formData, key);
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
      : [];
  } catch {
    return [];
  }
}

async function insertAudit(
  action: string,
  cityId: string,
  entityType: string,
  entityId: string | null,
  diff: Json,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('audit_log').insert({
    actor_id: user.id,
    city_id: cityId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    diff,
  });
}

async function assertCanManageAttraction(attractionId: string, cityId: string) {
  const supabase = await createClient();
  const { data: attraction, error } = await supabase
    .from('attractions')
    .select('id, slug, google_photos')
    .eq('id', attractionId)
    .eq('city_id', cityId)
    .single();
  if (error || !attraction) throw error ?? new Error('Atração não encontrada.');
  return attraction;
}

async function grantOwner(entityType: string, entityId: string, profileId: string) {
  const supabase = await createClient();
  await supabase.from('entity_managers').upsert(
    {
      entity_type: entityType,
      entity_id: entityId,
      profile_id: profileId,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    },
    {
      onConflict: 'profile_id,entity_type,entity_id',
    },
  );
}

function slugValue(formData: FormData): string | undefined {
  return text(formData, 'slug') ?? undefined;
}

function pathsFor(entity: string, slug?: string) {
  const publicPaths = ['/turismo'];
  if (entity === 'accommodation')
    publicPaths.push('/turismo/onde-ficar', slug ? `/turismo/onde-ficar/${slug}` : '');
  if (entity === 'restaurant') publicPaths.push('/turismo/onde-comer');
  if (entity === 'fishing_guide')
    publicPaths.push('/turismo/pesca', slug ? `/turismo/pesca/guias/${slug}` : '');
  if (entity === 'fishing_spot')
    publicPaths.push('/turismo/pesca', slug ? `/turismo/pesca/pontos/${slug}` : '');
  if (entity === 'attraction')
    publicPaths.push('/turismo/o-que-fazer', slug ? `/turismo/o-que-fazer/${slug}` : '');
  if (entity === 'tour_package') publicPaths.push('/turismo/pacotes');
  return publicPaths.filter(Boolean);
}

export async function upsertAccommodationAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({
    cityId: city.id,
    kinds: ['merchant', 'city_admin', 'super_admin'],
  });
  const parsed = accommodationSchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    district_id: text(formData, 'district_id'),
    slug: slugValue(formData),
    name: formData.get('name'),
    type: formData.get('type') || 'pousada',
    short_description: text(formData, 'short_description'),
    description: text(formData, 'description'),
    address: text(formData, 'address'),
    cep: text(formData, 'cep'),
    lat: num(formData, 'lat'),
    lng: num(formData, 'lng'),
    phone: text(formData, 'phone'),
    whatsapp: text(formData, 'whatsapp'),
    email: text(formData, 'email'),
    website: nullableUrl(formData, 'website'),
    booking_url: nullableUrl(formData, 'booking_url'),
    airbnb_url: nullableUrl(formData, 'airbnb_url'),
    instagram: text(formData, 'instagram'),
    price_min: num(formData, 'price_min'),
    price_max: num(formData, 'price_max'),
    rooms_count: num(formData, 'rooms_count'),
    max_guests: num(formData, 'max_guests'),
    amenities: arr(formData, 'amenities'),
    near_lake: formData.get('near_lake') === 'on',
    has_marina: formData.get('has_marina') === 'on',
    status: formData.get('status') || 'draft',
  });
  if (parsed.city_id !== city.id) return;
  const supabase = await createClient();
  const payload = { ...parsed, slug: parsed.slug ?? '', amenities: parsed.amenities as Json };
  const { data, error } = parsed.id
    ? await supabase
        .from('accommodations')
        .update(payload)
        .eq('id', parsed.id)
        .eq('city_id', city.id)
        .select('id, slug')
        .single()
    : await supabase
        .from('accommodations')
        .insert({ ...payload, owner_profile_id: auth.profile.id })
        .select('id, slug')
        .single();
  if (error || !data) throw error;
  if (!parsed.id) await grantOwner('accommodation', data.id, auth.profile.id);
  await supabase.from('ai_jobs').insert({
    city_id: city.id,
    job_type: 'generate_embedding',
    input_ref: { entity_type: 'accommodation', entity_id: data.id },
  });
  await insertAudit('tourism.accommodation.upsert', city.id, 'accommodation', data.id, {
    status: parsed.status,
    slug: data.slug,
  });
  pathsFor('accommodation', data.slug).forEach((path) => revalidatePath(path));
  revalidatePath('/painel/turismo');
}

export async function upsertRestaurantAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({
    cityId: city.id,
    kinds: ['merchant', 'city_admin', 'super_admin'],
  });
  const parsed = restaurantSchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    district_id: text(formData, 'district_id'),
    slug: slugValue(formData),
    name: formData.get('name'),
    description: text(formData, 'description'),
    cuisine: arr(formData, 'cuisine'),
    price_range: text(formData, 'price_range'),
    address: text(formData, 'address'),
    phone: text(formData, 'phone'),
    whatsapp: text(formData, 'whatsapp'),
    hours: jsonRecord(formData, 'hours'),
    delivery: formData.get('delivery') === 'on',
    ifood_url: nullableUrl(formData, 'ifood_url'),
    lat: num(formData, 'lat'),
    lng: num(formData, 'lng'),
    status: formData.get('status') || 'draft',
  });
  if (parsed.city_id !== city.id) return;
  const supabase = await createClient();
  const payload = {
    ...parsed,
    slug: parsed.slug ?? '',
    cuisine: parsed.cuisine as Json,
    hours: parsed.hours as Json,
  };
  const { data, error } = parsed.id
    ? await supabase
        .from('restaurants')
        .update(payload)
        .eq('id', parsed.id)
        .eq('city_id', city.id)
        .select('id, slug')
        .single()
    : await supabase
        .from('restaurants')
        .insert({ ...payload, owner_profile_id: auth.profile.id })
        .select('id, slug')
        .single();
  if (error || !data) throw error;
  if (!parsed.id) await grantOwner('restaurant', data.id, auth.profile.id);
  await supabase.from('ai_jobs').insert({
    city_id: city.id,
    job_type: 'generate_embedding',
    input_ref: { entity_type: 'restaurant', entity_id: data.id },
  });
  await insertAudit('tourism.restaurant.upsert', city.id, 'restaurant', data.id, {
    status: parsed.status,
    slug: data.slug,
  });
  pathsFor('restaurant', data.slug).forEach((path) => revalidatePath(path));
  revalidatePath('/painel/turismo');
}

export async function upsertFishingGuideAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({
    cityId: city.id,
    kinds: ['merchant', 'city_admin', 'super_admin'],
  });
  const parsed = guideSchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    slug: slugValue(formData),
    full_name: formData.get('full_name'),
    license_number: text(formData, 'license_number'),
    about: text(formData, 'about'),
    phone: text(formData, 'phone'),
    whatsapp: text(formData, 'whatsapp'),
    email: text(formData, 'email'),
    services: arr(formData, 'services'),
    price_range: text(formData, 'price_range'),
    has_boat: formData.get('has_boat') === 'on',
    photo_url: nullableUrl(formData, 'photo_url'),
  });
  if (parsed.city_id !== city.id) return;
  const supabase = await createClient();
  const payload = {
    ...parsed,
    slug: parsed.slug ?? '',
    services: parsed.services as Json,
    status: 'draft' as const,
  };
  const { data, error } = parsed.id
    ? await supabase
        .from('fishing_guides')
        .update(payload)
        .eq('id', parsed.id)
        .eq('city_id', city.id)
        .select('id, slug')
        .single()
    : await supabase
        .from('fishing_guides')
        .insert({ ...payload, owner_profile_id: auth.profile.id })
        .select('id, slug')
        .single();
  if (error || !data) throw error;
  if (!parsed.id) await grantOwner('fishing_guide', data.id, auth.profile.id);
  await insertAudit('tourism.fishing_guide.upsert', city.id, 'fishing_guide', data.id, {
    slug: data.slug,
  });
  pathsFor('fishing_guide', data.slug).forEach((path) => revalidatePath(path));
  revalidatePath('/painel/turismo');
}

export async function upsertFishingSpotAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = spotSchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    slug: slugValue(formData),
    name: formData.get('name'),
    description: text(formData, 'description'),
    lat: num(formData, 'lat'),
    lng: num(formData, 'lng'),
    species: arr(formData, 'species'),
    regulations: text(formData, 'regulations'),
    defeso_period: text(formData, 'defeso_period'),
    requires_guide: formData.get('requires_guide') === 'on',
    access_difficulty: text(formData, 'access_difficulty'),
    status: formData.get('status') || 'draft',
  });
  if (parsed.city_id !== city.id) return;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fishing_spots')
    .upsert({ ...parsed, slug: parsed.slug ?? '', species: parsed.species as Json })
    .select('id, slug')
    .single();
  if (error || !data) throw error;
  await insertAudit('tourism.fishing_spot.upsert', city.id, 'fishing_spot', data.id, {
    status: parsed.status,
    slug: data.slug,
  });
  pathsFor('fishing_spot', data.slug).forEach((path) => revalidatePath(path));
}

export async function upsertAttractionAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const id = formData.get('id') || undefined;
  const auth = id
    ? await requireProfile()
    : await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const parsed = attractionSchema.parse({
    id,
    city_id: formData.get('city_id'),
    slug: slugValue(formData),
    name: formData.get('name'),
    type: formData.get('type') || 'balneario',
    description: text(formData, 'description'),
    address: text(formData, 'address'),
    lat: num(formData, 'lat'),
    lng: num(formData, 'lng'),
    hours_legacy_text: text(formData, 'hours_legacy_text'),
    entry_fee: text(formData, 'entry_fee'),
    difficulty: text(formData, 'difficulty'),
    duration_minutes: num(formData, 'duration_minutes'),
    best_season: text(formData, 'best_season'),
    phone: text(formData, 'phone'),
    whatsapp: text(formData, 'whatsapp'),
    website: text(formData, 'website'),
    instagram: text(formData, 'instagram'),
    amenities: arr(formData, 'amenities'),
    tips: text(formData, 'tips'),
    price_range: text(formData, 'price_range'),
    pet_friendly: formData.get('pet_friendly') === 'on',
    family_friendly: formData.get('family_friendly') === 'on',
    status: formData.get('status') || 'draft',
    featured: formData.get('featured') === 'on',
  });
  if (parsed.city_id !== city.id) return;
  const supabase = await createClient();
  const payload = { ...parsed, slug: parsed.slug ?? '', amenities: parsed.amenities as Json };
  const { data, error } = parsed.id
    ? await supabase
        .from('attractions')
        .update(payload)
        .eq('id', parsed.id)
        .eq('city_id', city.id)
        .select('id, slug')
        .single()
    : await supabase
        .from('attractions')
        .insert({ ...payload, owner_profile_id: auth.profile.id })
        .select('id, slug')
        .single();
  if (error || !data) throw error;
  if (!parsed.id) await grantOwner('attraction', data.id, auth.profile.id);
  await insertAudit('tourism.attraction.upsert', city.id, 'attraction', data.id, {
    status: parsed.status,
    slug: data.slug,
  });
  pathsFor('attraction', data.slug).forEach((path) => revalidatePath(path));
  revalidatePath('/painel/cidade/turismo');
}

export async function assignAttractionOwnerAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = assignAttractionOwnerSchema.parse({
    attraction_id: formData.get('attraction_id'),
    owner_profile_id: formData.get('owner_profile_id'),
  });
  const supabase = await createClient();
  const { error } = await supabase
    .from('attractions')
    .update({ owner_profile_id: parsed.owner_profile_id })
    .eq('id', parsed.attraction_id)
    .eq('city_id', city.id);
  if (error) throw error;
  await grantOwner('attraction', parsed.attraction_id, parsed.owner_profile_id);
  await insertAudit(
    'tourism.attraction.owner.assign',
    city.id,
    'attraction',
    parsed.attraction_id,
    { owner_profile_id: parsed.owner_profile_id },
  );
  revalidatePath('/painel/cidade/turismo');
  revalidatePath('/painel/cidade/turismo/atracoes');
}

export async function submitAttractionReviewAction(formData: FormData) {
  const [auth, city] = await Promise.all([requireProfile(), getCurrentCity()]);
  if (!city) return;
  const parsed = attractionReviewSchema.parse({
    attraction_id: formData.get('attraction_id'),
    rating: formData.get('rating'),
    title: text(formData, 'title'),
    comment: text(formData, 'comment'),
  });
  const supabase = await createClient();
  const { data: attraction } = await supabase
    .from('attractions')
    .select('id, slug')
    .eq('id', parsed.attraction_id)
    .eq('city_id', city.id)
    .eq('status', 'published')
    .single();
  if (!attraction) return;
  const { data: review, error } = await supabase
    .from('attraction_reviews')
    .upsert({
      attraction_id: parsed.attraction_id,
      city_id: city.id,
      author_profile_id: auth.profile.id,
      rating: parsed.rating,
      title: parsed.title,
      comment: parsed.comment,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error || !review) throw error;
  await supabase.from('ai_jobs').insert({
    city_id: city.id,
    job_type: 'moderate_ugc',
    input_ref: { review_id: review.id, entity_type: 'attraction_review' },
  });
  await notifyCityAdmins({
    cityId: city.id,
    type: 'review.pending',
    priority: 'normal',
    title: 'Review de atração aguardando moderação',
    body: parsed.title ?? parsed.comment ?? 'Uma nova avaliação foi enviada.',
    targetUrl: '/painel/cidade/turismo/aprovacoes',
    entityType: 'attraction_review',
    entityId: review.id,
    metadata: { attraction_id: parsed.attraction_id },
  });
  revalidatePath(`/turismo/o-que-fazer/${attraction.slug}`);
  revalidatePath('/painel/cidade/turismo');
}

export async function moderateAttractionReviewAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireProfile();
  const parsed = attractionReviewModerationSchema.parse({
    review_id: formData.get('review_id'),
    attraction_id: formData.get('attraction_id'),
    status: formData.get('status'),
  });
  const supabase = await createClient();
  const { data: attraction } = await supabase
    .from('attractions')
    .select('slug')
    .eq('id', parsed.attraction_id)
    .eq('city_id', city.id)
    .single();
  const { data: review } = await supabase
    .from('attraction_reviews')
    .select('author_profile_id, title')
    .eq('id', parsed.review_id)
    .eq('attraction_id', parsed.attraction_id)
    .eq('city_id', city.id)
    .maybeSingle();
  if (!attraction) return;
  const { error } = await supabase
    .from('attraction_reviews')
    .update({ status: parsed.status })
    .eq('id', parsed.review_id)
    .eq('attraction_id', parsed.attraction_id)
    .eq('city_id', city.id);
  if (error) throw error;
  if (review?.author_profile_id && parsed.status !== 'pending') {
    await createNotification({
      recipientProfileId: review.author_profile_id,
      cityId: city.id,
      type: parsed.status === 'published' ? 'approval.approved' : 'approval.rejected',
      priority: 'normal',
      title: parsed.status === 'published' ? 'Review aprovado' : 'Review recusado',
      body: review.title ?? 'Sua avaliação foi analisada.',
      targetUrl: `/turismo/o-que-fazer/${attraction.slug}`,
      entityType: 'attraction_review',
      entityId: parsed.review_id,
    });
  }
  revalidatePath(`/turismo/o-que-fazer/${attraction.slug}`);
  revalidatePath('/painel/cidade/turismo');
}

export async function replyAttractionReviewAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireProfile();
  const parsed = attractionReviewReplySchema.parse({
    review_id: formData.get('review_id'),
    attraction_id: formData.get('attraction_id'),
    reply_owner: formData.get('reply_owner'),
  });
  const supabase = await createClient();
  const { data: attraction } = await supabase
    .from('attractions')
    .select('slug')
    .eq('id', parsed.attraction_id)
    .eq('city_id', city.id)
    .single();
  if (!attraction) return;
  const { error } = await supabase
    .from('attraction_reviews')
    .update({ reply_owner: parsed.reply_owner, reply_at: new Date().toISOString() })
    .eq('id', parsed.review_id)
    .eq('attraction_id', parsed.attraction_id)
    .eq('city_id', city.id);
  if (error) throw error;
  revalidatePath(`/turismo/o-que-fazer/${attraction.slug}`);
}

export async function submitAttractionPhotoAction(formData: FormData) {
  const [auth, city] = await Promise.all([requireProfile(), getCurrentCity()]);
  if (!city) return;
  const attractionId = z.string().uuid().parse(formData.get('attraction_id'));
  const caption = text(formData, 'caption');
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;
  const mediaType = getAttractionMediaType(file);
  if (mediaType !== 'image') return;
  const supabase = await createClient();
  const { data: attraction } = await supabase
    .from('attractions')
    .select('id, slug')
    .eq('id', attractionId)
    .eq('city_id', city.id)
    .eq('status', 'published')
    .single();
  if (!attraction) return;
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${city.slug}/attractions/${attractionId}/${auth.profile.id}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from('tourism')
    .upload(path, file, { upsert: false });
  if (uploadError) throw uploadError;
  const { error } = await supabase.from('attraction_photos').insert({
    attraction_id: attractionId,
    city_id: city.id,
    author_profile_id: auth.profile.id,
    storage_path: path,
    media_type: mediaType,
    caption,
    status: 'pending',
  });
  if (error) throw error;
  await notifyCityAdmins({
    cityId: city.id,
    type: 'photo.pending',
    priority: 'normal',
    title: 'Foto de atração aguardando moderação',
    body: caption ?? 'Uma nova foto foi enviada por usuário.',
    targetUrl: '/painel/cidade/turismo/aprovacoes',
    entityType: 'attraction_photo',
    entityId: attractionId,
    metadata: { attraction_id: attractionId },
  });
  await insertAudit('tourism.attraction.photo.submit', city.id, 'attraction', attractionId, {
    storage_path: path,
  });
  revalidatePath(`/turismo/o-que-fazer/${attraction.slug}`);
  revalidatePath('/painel/cidade/turismo');
}

export async function submitAttractionExperienceAction(formData: FormData) {
  const [auth, city] = await Promise.all([requireProfile(), getCurrentCity()]);
  if (!city) return;
  const parsed = attractionReviewSchema.parse({
    attraction_id: formData.get('attraction_id'),
    rating: formData.get('rating'),
    title: text(formData, 'title'),
    comment: text(formData, 'comment'),
  });
  const caption = text(formData, 'caption') ?? parsed.title ?? parsed.comment;
  const mediaFiles = formData
    .getAll('media')
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, maxAttractionExperienceMediaItems);
  const supabase = await createClient();
  const { data: attraction } = await supabase
    .from('attractions')
    .select('id, slug')
    .eq('id', parsed.attraction_id)
    .eq('city_id', city.id)
    .eq('status', 'published')
    .single();
  if (!attraction) return;

  const { data: review, error: reviewError } = await supabase
    .from('attraction_reviews')
    .upsert({
      attraction_id: parsed.attraction_id,
      city_id: city.id,
      author_profile_id: auth.profile.id,
      rating: parsed.rating,
      title: parsed.title,
      comment: parsed.comment,
      status: 'pending',
    })
    .select('id')
    .single();
  if (reviewError || !review) throw reviewError;

  const uploadedMedia: Array<{
    path: string;
    mediaType: AttractionMediaType;
  }> = [];
  for (const [index, file] of mediaFiles.entries()) {
    const mediaType = getAttractionMediaType(file);
    const extension = getSafeMediaExtension(file.name, mediaType);
    const path = `${city.slug}/attractions/${parsed.attraction_id}/${auth.profile.id}-${Date.now()}-${index + 1}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('tourism')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    uploadedMedia.push({ path, mediaType });
  }

  if (uploadedMedia.length > 0) {
    const { error: mediaError } = await supabase.from('attraction_photos').insert(
      uploadedMedia.map((media) => ({
        attraction_id: parsed.attraction_id,
        city_id: city.id,
        author_profile_id: auth.profile.id,
        storage_path: media.path,
        media_type: media.mediaType,
        caption,
        status: 'pending' as const,
      })),
    );
    if (mediaError) throw mediaError;
  }

  await supabase.from('ai_jobs').insert({
    city_id: city.id,
    job_type: 'moderate_ugc',
    input_ref: {
      review_id: review.id,
      media_count: uploadedMedia.length,
      entity_type: 'attraction_experience',
    },
  });
  await notifyCityAdmins({
    cityId: city.id,
    type: 'review.pending',
    priority: 'normal',
    title: 'Experiência de atração aguardando moderação',
    body: parsed.title ?? parsed.comment ?? 'Uma nova experiência foi enviada.',
    targetUrl: '/painel/cidade/turismo/aprovacoes',
    entityType: 'attraction_review',
    entityId: review.id,
    metadata: { attraction_id: parsed.attraction_id, media_count: uploadedMedia.length },
  });
  if (uploadedMedia.length > 0) {
    await insertAudit(
      'tourism.attraction.experience.media.submit',
      city.id,
      'attraction',
      parsed.attraction_id,
      {
        media_count: uploadedMedia.length,
        media_types: uploadedMedia.map((media) => media.mediaType),
      },
    );
  }
  revalidatePath(`/turismo/o-que-fazer/${attraction.slug}`);
  revalidatePath('/painel/cidade/turismo');
}

export async function moderateAttractionPhotoAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireProfile();
  const parsed = attractionPhotoModerationSchema.parse({
    photo_id: formData.get('photo_id'),
    attraction_id: formData.get('attraction_id'),
    status: formData.get('status'),
  });
  const supabase = await createClient();
  const { data: attraction } = await supabase
    .from('attractions')
    .select('slug')
    .eq('id', parsed.attraction_id)
    .eq('city_id', city.id)
    .single();
  const { data: photo } = await supabase
    .from('attraction_photos')
    .select('author_profile_id, caption')
    .eq('id', parsed.photo_id)
    .eq('attraction_id', parsed.attraction_id)
    .eq('city_id', city.id)
    .maybeSingle();
  if (!attraction) return;
  const { error } = await supabase
    .from('attraction_photos')
    .update({
      status: parsed.status,
      moderated_by: auth.profile.id,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', parsed.photo_id)
    .eq('attraction_id', parsed.attraction_id)
    .eq('city_id', city.id);
  if (error) throw error;
  if (photo?.author_profile_id) {
    await createNotification({
      recipientProfileId: photo.author_profile_id,
      cityId: city.id,
      type: parsed.status === 'published' ? 'approval.approved' : 'approval.rejected',
      priority: 'normal',
      title: parsed.status === 'published' ? 'Foto aprovada' : 'Foto recusada',
      body: photo.caption ?? 'Sua foto foi analisada.',
      targetUrl: `/turismo/o-que-fazer/${attraction.slug}`,
      entityType: 'attraction_photo',
      entityId: parsed.photo_id,
    });
  }
  revalidatePath(`/turismo/o-que-fazer/${attraction.slug}`);
  revalidatePath('/painel/cidade/turismo');
}

export async function upsertAttractionServiceAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireProfile();
  const parsed = attractionServiceSchema.parse({
    id: formData.get('id') || undefined,
    attraction_id: formData.get('attraction_id'),
    kind: formData.get('kind'),
    label: formData.get('label'),
    details: text(formData, 'details'),
    price: num(formData, 'price'),
    contact_business_id: text(formData, 'contact_business_id'),
  });
  const supabase = await createClient();
  const { data: attraction } = await supabase
    .from('attractions')
    .select('slug')
    .eq('id', parsed.attraction_id)
    .eq('city_id', city.id)
    .single();
  if (!attraction) return;
  const { error } = await supabase.from('attraction_services').upsert(parsed);
  if (error) throw error;
  revalidatePath(`/turismo/o-que-fazer/${attraction.slug}`);
  revalidatePath('/painel/cidade/turismo/atracoes');
}

export async function searchGoogleAttractionCandidatesAction(
  input: unknown,
): Promise<{ candidates: GooglePlaceCandidate[]; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { candidates: [], error: 'Cidade atual não encontrada.' };
  await requireProfile();
  const parsed = googleAttractionSearchSchema.parse(input);
  await assertCanManageAttraction(parsed.attractionId, city.id);

  try {
    const candidates = await searchGooglePlaces(`${parsed.query} ${city.name} ${city.state}`);
    return { candidates };
  } catch (caught) {
    return {
      candidates: [],
      error: caught instanceof Error ? caught.message : 'Falha ao buscar no Google.',
    };
  }
}

export async function getGoogleAttractionDetailsAction(
  input: unknown,
): Promise<{ details: GooglePlaceDetails | null; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { details: null, error: 'Cidade atual não encontrada.' };
  await requireProfile();
  const parsed = googleAttractionDetailsSchema.parse(input);
  await assertCanManageAttraction(parsed.attractionId, city.id);

  try {
    const details = await getGooglePlaceDetails(parsed.placeId);
    return { details };
  } catch (caught) {
    return {
      details: null,
      error: caught instanceof Error ? caught.message : 'Falha ao carregar dados do Google.',
    };
  }
}

export async function applyGoogleAttractionImportAction(
  input: unknown,
): Promise<{ ok: boolean; error?: string; applied?: { fields: number; photos: number } }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade atual não encontrada.' };
  const auth = await requireProfile();
  const parsedResult = googleAttractionApplySchema.safeParse(input);
  if (!parsedResult.success)
    return { ok: false, error: 'Dados selecionados para importação estão inválidos.' };
  const parsed = parsedResult.data;

  try {
    const current = await assertCanManageAttraction(parsed.attractionId, city.id);
    const details = await getGooglePlaceDetails(parsed.placeId);
    const photoDetailsByName = new Map(details.photos.map((photo) => [photo.name, photo]));
    const selectedPhotos = parsed.photos.map((name) => ({
      name,
      role: 'gallery' as const,
      attribution: photoDetailsByName.get(name)?.attribution ?? null,
    }));
    const uploadedPhotos: UploadedGooglePhoto[] = [];
    const approvedReviews = details.reviews.filter((review) => parsed.reviews.includes(review.id));
    const summary = details.summaries[0]?.text ?? null;
    const supabase = await createClient();

    for (const [index, photo] of selectedPhotos.entries()) {
      try {
        const file = await getGooglePlacePhotoFile(
          photo.name,
          `google-attraction-${parsed.attractionId}-${index + 1}.jpg`,
        );
        const uploaded = await uploadLinkedImage({
          entityType: 'attraction',
          entityId: parsed.attractionId,
          role: 'gallery',
          file,
          actorProfileId: auth.profile.id,
          altText: photo.attribution
            ? `Foto do Google. Credito: ${photo.attribution}`
            : 'Foto importada do Google.',
        });

        uploadedPhotos.push({
          name: photo.name,
          role: 'gallery',
          attribution: photo.attribution,
          asset_id: uploaded.id,
          cdn_url: uploaded.url,
          imported_at: new Date().toISOString(),
        });
      } catch (caught) {
        throw new Error(
          `Falha ao importar foto ${index + 1}/${selectedPhotos.length}: ${getErrorMessage(caught, 'erro desconhecido')}`,
        );
      }
    }

    const payload: AttractionUpdate = {
      google_place_id: details.placeId,
      last_google_sync_at: new Date().toISOString(),
      google_photos: mergeGoogleAttractionPhotos(
        current.google_photos ?? null,
        selectedPhotos,
        uploadedPhotos,
        approvedReviews,
      ),
    };

    if (parsed.fields.includes('name')) payload.name = details.name;
    if (parsed.fields.includes('address')) payload.address = details.address;
    if (parsed.fields.includes('phone')) {
      payload.phone = details.phone;
      payload.whatsapp = details.phone;
    }
    if (parsed.fields.includes('website')) payload.website = details.website;
    if (parsed.fields.includes('google_maps_url')) payload.google_maps_url = details.googleMapsUrl;
    if (parsed.fields.includes('street_view')) payload.street_view_url = details.streetViewUrl;
    if (parsed.fields.includes('lat_lng')) {
      payload.lat = details.lat;
      payload.lng = details.lng;
    }
    if (parsed.fields.includes('hours')) {
      payload.hours_legacy_text = details.hours.length > 0 ? details.hours.join('\n') : null;
    }
    if (parsed.fields.includes('rating')) {
      payload.rating = details.rating;
      payload.reviews_count = details.userRatingCount;
    }
    if (parsed.fields.includes('summaries')) {
      payload.google_summary = summary;
      payload.google_summary_at = summary ? new Date().toISOString() : null;
    }
    if (parsed.fields.includes('attributes')) {
      payload.accessibility = details.attributes as Json;
    }
    if (parsed.fields.includes('amenities')) {
      payload.amenities = details.amenities as Json;
    }
    if (parsed.fields.includes('price')) {
      payload.price_range = details.priceRange ?? details.priceLevel;
    }

    const { error } = await supabase
      .from('attractions')
      .update(payload)
      .eq('id', parsed.attractionId)
      .eq('city_id', city.id);
    if (error) throw error;

    await insertAudit(
      'tourism.attraction.google_import.apply',
      city.id,
      'attraction',
      parsed.attractionId,
      {
        place_id: parsed.placeId,
        fields: parsed.fields,
        photos_count: selectedPhotos.length,
        reviews_count: parsed.reviews.length,
      },
    );
    revalidatePath('/painel/cidade/turismo/atracoes');
    revalidatePath(`/painel/cidade/turismo/atracoes/${parsed.attractionId}`);
    revalidatePath(`/turismo/o-que-fazer/${current.slug}`);
    return { ok: true, applied: { fields: parsed.fields.length, photos: selectedPhotos.length } };
  } catch (caught) {
    console.error('[google-import][attraction] failed', caught);
    return { ok: false, error: getErrorMessage(caught, 'Falha ao aplicar importação.') };
  }
}

function mergeGoogleAttractionPhotos(
  current: Json | null,
  pendingPhotos: Array<{ name: string; role: string; attribution: string | null }>,
  importedPhotos: UploadedGooglePhoto[],
  approvedReviews: GooglePlaceDetails['reviews'],
): Json {
  const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  const existingImported =
    'imported_photos' in base && Array.isArray(base.imported_photos) ? base.imported_photos : [];
  return {
    ...base,
    pending_photos: [],
    approved_photos: pendingPhotos.map((photo) => photo.name),
    imported_photos: [...existingImported, ...importedPhotos],
    approved_reviews: approvedReviews,
    updated_at: new Date().toISOString(),
  } as Json;
}

export async function reorderFeaturedAttractionsAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = z
    .object({
      city_id: z.string().uuid(),
      ordered_ids: z
        .string()
        .transform((v) =>
          v
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean),
        )
        .pipe(z.array(z.string().uuid())),
    })
    .parse({
      city_id: formData.get('city_id'),
      ordered_ids: formData.get('ordered_ids'),
    });
  if (parsed.city_id !== city.id) return;
  const supabase = await createClient();
  await Promise.all(
    parsed.ordered_ids.map((id) =>
      supabase.from('attractions').update({ featured: true }).eq('id', id).eq('city_id', city.id),
    ),
  );
  await insertAudit(
    'tourism.attraction.reorder_featured',
    city.id,
    'attraction',
    null,
    parsed as Json,
  );
  revalidatePath('/turismo');
}

export async function upsertTourPackageAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const parsed = packageSchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    provider_business_id: text(formData, 'provider_business_id'),
    slug: slugValue(formData),
    title: formData.get('title'),
    description: text(formData, 'description'),
    duration_hours: num(formData, 'duration_hours'),
    price: num(formData, 'price'),
    includes: arr(formData, 'includes'),
    contact_phone: text(formData, 'contact_phone'),
    contact_whatsapp: text(formData, 'contact_whatsapp'),
    itinerary: jsonArray(formData, 'itinerary'),
    difficulty: text(formData, 'difficulty'),
    total_duration_hours: num(formData, 'total_duration_hours'),
    total_distance_km: num(formData, 'total_distance_km'),
    gallery: arr(formData, 'gallery'),
    featured: formData.get('featured') === 'on',
    status: formData.get('status') || 'draft',
  });
  if (parsed.city_id !== city.id) return;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tour_packages')
    .upsert({
      ...parsed,
      slug: parsed.slug ?? '',
      includes: parsed.includes as Json,
      itinerary: parsed.itinerary as Json,
      gallery: parsed.gallery as Json,
    })
    .select('id, slug')
    .single();
  if (error || !data) throw error;
  await insertAudit('tourism.package.upsert', city.id, 'tour_package', data.id, {
    status: parsed.status,
    slug: data.slug,
  });
  pathsFor('tour_package', data.slug).forEach((path) => revalidatePath(path));
}

export async function uploadAccommodationMediaAction(formData: FormData) {
  return uploadTourismMediaAction(formData, 'accommodation', 'accommodations', 'accommodation_id');
}

export async function uploadRestaurantMediaAction(formData: FormData) {
  return uploadTourismMediaAction(formData, 'restaurant', 'restaurants', 'restaurant_id');
}

async function uploadTourismMediaAction(
  formData: FormData,
  entityType: 'accommodation' | 'restaurant',
  table: 'accommodations' | 'restaurants',
  idField: string,
) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({
    cityId: city.id,
    kinds: ['merchant', 'city_admin', 'super_admin'],
  });
  const id = z.string().uuid().parse(formData.get(idField));
  const kind = z.enum(['cover', 'gallery']).parse(formData.get('kind'));
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;
  await uploadLinkedImage({
    entityType,
    entityId: id,
    role: kind,
    file,
    altText: null,
    actorProfileId: auth.profile.id,
  });
  revalidatePath('/painel/turismo');
}

export async function requestPublishAccommodationAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const id = z.string().uuid().parse(formData.get('id'));
  const supabase = await createClient();
  const { error } = await supabase
    .from('accommodations')
    .update({ status: 'pending' })
    .eq('id', id)
    .eq('city_id', city.id);
  if (error) throw error;
  await insertAudit('tourism.accommodation.publish.request', city.id, 'accommodation', id, {});
  revalidatePath('/painel/turismo');
  revalidatePath('/painel/cidade/turismo/aprovacoes');
}

export async function generateSeoCopyAction(formData: FormData): Promise<void> {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({
    cityId: city.id,
    kinds: ['merchant', 'city_admin', 'super_admin'],
  });
  const parsed = z
    .object({
      id: z.string().uuid(),
      entity_type: z.enum(['accommodation', 'restaurant', 'fishing_guide']),
      target: z.enum(['description', 'short_description', 'about']),
    })
    .parse({
      id: formData.get('id'),
      entity_type: formData.get('entity_type'),
      target: formData.get('target'),
    });
  const supabase = await createClient();
  await supabase.from('ai_jobs').insert({
    city_id: city.id,
    job_type: 'seo_meta',
    status: 'running',
    model: MODELS.sonnet,
    input_ref: { ...parsed, actor_id: auth.profile.id },
    started_at: new Date().toISOString(),
  });
  const prompt = `Escreva uma sugestão em PT-BR para ${parsed.target} de uma entidade turística. Seja factual, local e conciso. ID: ${parsed.id}`;
  const response = await anthropic().messages.create({
    model: MODELS.sonnet,
    max_tokens: 350,
    messages: [{ role: 'user', content: prompt }],
  });
  const suggestion = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n')
    .trim();
  await supabase.from('ai_jobs').insert({
    city_id: city.id,
    job_type: 'seo_meta',
    status: 'completed',
    model: MODELS.sonnet,
    input_ref: { ...parsed, actor_id: auth.profile.id },
    output_ref: { suggestion },
    tokens_input: response.usage.input_tokens,
    tokens_output: response.usage.output_tokens,
    finished_at: new Date().toISOString(),
  });
  await insertAudit('tourism.seo.suggest', city.id, parsed.entity_type, parsed.id, {
    target: parsed.target,
  });
}

const convertBusinessSchema = z.object({
  business_id: z.string().uuid(),
  type: z.enum([
    'balneario',
    'mirante',
    'cachoeira',
    'trilha',
    'igreja',
    'museu',
    'parque',
    'praia',
    'lago',
    'historico',
  ]),
});

export async function deleteAttractionAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const attractionId = z.string().uuid().parse(formData.get('attraction_id'));
  const supabase = await createClient();

  const { data: attraction } = await supabase
    .from('attractions')
    .select('id, slug')
    .eq('id', attractionId)
    .eq('city_id', city.id)
    .single();

  const { error } = await supabase
    .from('attractions')
    .delete()
    .eq('id', attractionId)
    .eq('city_id', city.id);
  if (error) throw error;

  await insertAudit('tourism.attraction.delete', city.id, 'attraction', attractionId, {
    slug: attraction?.slug ?? null,
  });

  revalidatePath('/turismo/o-que-fazer');
  if (attraction?.slug) revalidatePath(`/turismo/o-que-fazer/${attraction.slug}`);
  revalidatePath('/painel/cidade/turismo/atracoes');
}

export async function convertBusinessToAttractionAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const city = await getCurrentCity();
    if (!city) return { ok: false, message: 'Cidade atual não encontrada.' };
    await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
    const parsed = convertBusinessSchema.parse({
      business_id: formData.get('business_id'),
      type: formData.get('type'),
    });

    const supabase = await createClient();
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(
        'id, name, slug, description, address, lat, lng, phone, whatsapp, website, instagram, cover_url, photos, owner_profile_id',
      )
      .eq('id', parsed.business_id)
      .eq('city_id', city.id)
      .single();
    if (businessError || !business) {
      return { ok: false, message: businessError?.message ?? 'Comércio não encontrado.' };
    }

    let slug = business.slug;
    const { data: existing } = await supabase
      .from('attractions')
      .select('id')
      .eq('slug', slug)
      .eq('city_id', city.id)
      .maybeSingle();
    if (existing) {
      slug = `${slug}-atracao`;
    }

    const payload = {
      city_id: city.id,
      slug,
      name: business.name,
      type: parsed.type,
      description: business.description,
      address: business.address,
      lat: business.lat,
      lng: business.lng,
      phone: business.phone,
      whatsapp: business.whatsapp,
      website: business.website,
      instagram: business.instagram,
      cover_url: business.cover_url,
      photos: business.photos ?? [],
      owner_profile_id: business.owner_profile_id,
      status: 'draft' as const,
    };

    const { data: attraction, error } = await supabase
      .from('attractions')
      .insert(payload)
      .select('id, slug')
      .single();
    if (error || !attraction) {
      return { ok: false, message: error?.message ?? 'Erro ao criar atração.' };
    }

    if (business.owner_profile_id) {
      await grantOwner('attraction', attraction.id, business.owner_profile_id);
    }

    await insertAudit(
      'tourism.attraction.convert_from_business',
      city.id,
      'attraction',
      attraction.id,
      {
        business_id: business.id,
        business_name: business.name,
        type: parsed.type,
      },
    );
    revalidatePath('/painel/cidade/turismo/atracoes');
    revalidatePath('/turismo/o-que-fazer');
    return { ok: true, message: `Atração "${business.name}" criada com sucesso.` };
  } catch (caught) {
    return { ok: false, message: caught instanceof Error ? caught.message : 'Erro inesperado.' };
  }
}

export async function approveTourismEntityAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = z
    .object({
      id: z.string().uuid(),
      entity_type: z.enum(['accommodation', 'restaurant', 'fishing_guide']),
      action: z.enum(['approve', 'reject']),
    })
    .parse({
      id: formData.get('id'),
      entity_type: formData.get('entity_type'),
      action: formData.get('action'),
    });
  const table =
    parsed.entity_type === 'accommodation'
      ? 'accommodations'
      : parsed.entity_type === 'restaurant'
        ? 'restaurants'
        : 'fishing_guides';
  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ status: parsed.action === 'approve' ? 'published' : 'draft' })
    .eq('id', parsed.id)
    .eq('city_id', city.id);
  if (error) throw error;
  await insertAudit(
    `tourism.${parsed.entity_type}.${parsed.action}`,
    city.id,
    parsed.entity_type,
    parsed.id,
    {},
  );
  revalidatePath('/painel/cidade/turismo/aprovacoes');
  revalidatePath('/turismo');
}

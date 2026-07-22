'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/lib/supabase/database.types';
import { getErrorMessage } from '@/lib/errors/message';
import {
  getGooglePlaceDetails,
  getGooglePlacePhotoFile,
  searchGooglePlaces,
  type GooglePlaceCandidate,
  type GooglePlaceDetails,
} from '@/lib/google/places';
import { uploadLinkedImage } from '@/lib/media/actions';

const nullableString = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const churchSchema = z.object({
  id: z.string().uuid(),
  city_id: z.string().uuid(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(140),
  tradition: z.enum(['catolica', 'evangelica', 'adventista', 'outra']),
  short_description: z.string().min(2).max(240),
  description: nullableString,
  pastor_name: nullableString,
  phone: nullableString,
  whatsapp: nullableString,
  email: z.string().email().nullable().or(z.literal('').transform(() => null)),
  instagram: nullableString,
  website: z.string().url().nullable().or(z.literal('').transform(() => null)),
  address: nullableString,
  google_maps_url: z.string().url().nullable().or(z.literal('').transform(() => null)),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  status: z.enum(['draft', 'pending', 'published', 'rejected', 'archived']),
  featured: z.boolean(),
  verified: z.boolean(),
  claimed: z.boolean(),
});

const scheduleSchema = z.object({
  id: z.string().uuid().optional(),
  church_id: z.string().uuid(),
  city_id: z.string().uuid(),
  weekday: z.coerce.number().int().min(0).max(6),
  starts_at: z.string().regex(/^\d{2}:\d{2}$/),
  ends_at: z.string().regex(/^\d{2}:\d{2}$/).nullable().or(z.literal('').transform(() => null)),
  title: z.string().min(2).max(120),
  note: nullableString,
  source_status: z.enum(['confirmed', 'needs_verification']),
  active: z.boolean(),
});

const reviewReplySchema = z.object({
  review_id: z.string().uuid(),
  church_id: z.string().uuid(),
  reply_owner: z.string().trim().min(2).max(1000),
});

const reviewStatusSchema = z.object({
  review_id: z.string().uuid(),
  church_id: z.string().uuid(),
  status: z.enum(['pending', 'published', 'rejected', 'archived']),
});

const googleSearchSchema = z.object({
  churchId: z.string().uuid(),
  query: z.string().trim().min(2).max(180),
});

const googleDetailsSchema = z.object({
  churchId: z.string().uuid(),
  placeId: z.string().trim().min(3).max(180),
});

const googleApplySchema = z.object({
  churchId: z.string().uuid(),
  placeId: z.string().trim().min(3).max(180),
  fields: z.array(z.enum([
    'name',
    'address',
    'phone',
    'website',
    'google_maps_url',
    'lat_lng',
    'hours',
    'secondary_hours',
    'rating',
    'reviews',
    'summaries',
    'attributes',
    'price',
    'street_view',
  ])).default([]),
  photos: z.array(z.string().trim().min(3).max(1024)).max(20).default([]),
  reviews: z.array(z.string().trim().min(3).max(512)).max(5).default([]),
});

type ChurchUpdate = Database['public']['Tables']['churches']['Update'];

async function requireCommunityAdmin(cityId: string) {
  return requireRole({ cityId, kinds: ['moderator', 'city_admin', 'super_admin'] });
}

type UploadedGoogleChurchPhoto = {
  name: string;
  role: 'gallery';
  attribution: string | null;
  asset_id: string;
  cdn_url: string;
  imported_at: string;
};

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function parseNullableNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

async function assertCanManageChurch(churchId: string, cityId: string) {
  const supabase = await createClient();
  const { data: church, error } = await supabase
    .from('churches')
    .select('id, slug, import_source')
    .eq('id', churchId)
    .eq('city_id', cityId)
    .single();

  if (error || !church) throw error ?? new Error('Igreja nao encontrada.');
  return church;
}

export async function searchGoogleChurchCandidatesAction(input: unknown): Promise<{ candidates: GooglePlaceCandidate[]; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { candidates: [], error: 'Cidade atual nao encontrada.' };

  await requireCommunityAdmin(city.id);
  const parsed = googleSearchSchema.parse(input);
  await assertCanManageChurch(parsed.churchId, city.id);

  try {
    const candidates = await searchGooglePlaces(`${parsed.query} ${city.name} ${city.state}`);
    return { candidates };
  } catch (caught) {
    return { candidates: [], error: caught instanceof Error ? caught.message : 'Falha ao buscar no Google.' };
  }
}

export async function getGoogleChurchDetailsAction(input: unknown): Promise<{ details: GooglePlaceDetails | null; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { details: null, error: 'Cidade atual nao encontrada.' };

  await requireCommunityAdmin(city.id);
  const parsed = googleDetailsSchema.parse(input);
  await assertCanManageChurch(parsed.churchId, city.id);

  try {
    const details = await getGooglePlaceDetails(parsed.placeId);
    return { details };
  } catch (caught) {
    return { details: null, error: caught instanceof Error ? caught.message : 'Falha ao carregar dados do Google.' };
  }
}

export async function applyGoogleChurchImportAction(input: unknown): Promise<{ ok: boolean; error?: string; applied?: { fields: number; photos: number } }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade atual nao encontrada.' };

  const auth = await requireCommunityAdmin(city.id);
  const parsedResult = googleApplySchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false, error: 'Dados selecionados para importacao estao invalidos.' };
  }
  const parsed = parsedResult.data;

  try {
    const current = await assertCanManageChurch(parsed.churchId, city.id);
    const details = await getGooglePlaceDetails(parsed.placeId);
    const supabase = await createClient();
    const photoDetailsByName = new Map(details.photos.map((photo) => [photo.name, photo]));
    const selectedPhotos = parsed.photos.map((name) => ({
      name,
      role: 'gallery' as const,
      attribution: photoDetailsByName.get(name)?.attribution ?? null,
    }));
    const uploadedPhotos: UploadedGoogleChurchPhoto[] = [];

    for (const [index, photo] of selectedPhotos.entries()) {
      const file = await getGooglePlacePhotoFile(photo.name, `google-${parsed.churchId}-${index + 1}.jpg`);
      const uploaded = await uploadLinkedImage({
        entityType: 'church',
        entityId: parsed.churchId,
        role: photo.role,
        file,
        actorProfileId: auth.profile.id,
        altText: photo.attribution ? `Foto do Google. Credito: ${photo.attribution}` : 'Foto importada do Google.',
      });

      uploadedPhotos.push({
        ...photo,
        asset_id: uploaded.id,
        cdn_url: uploaded.url,
        imported_at: new Date().toISOString(),
      });
    }

    const payload: ChurchUpdate = {};
    if (parsed.fields.includes('name')) payload.name = details.name;
    if (parsed.fields.includes('address')) payload.address = details.address;
    if (parsed.fields.includes('phone')) {
      payload.phone = details.phone;
      payload.whatsapp = details.phone;
    }
    if (parsed.fields.includes('website')) payload.website = details.website;
    if (parsed.fields.includes('google_maps_url')) payload.google_maps_url = details.googleMapsUrl;
    if (parsed.fields.includes('lat_lng')) {
      payload.lat = details.lat;
      payload.lng = details.lng;
    }

    payload.import_source = mergeGoogleChurchImportSource(
      current.import_source ?? null,
      details,
      parsed.fields,
      selectedPhotos,
      uploadedPhotos,
      parsed.reviews,
    );

    const { error: updateError } = await supabase
      .from('churches')
      .update(payload)
      .eq('id', parsed.churchId)
      .eq('city_id', city.id);
    if (updateError) throw updateError;

    revalidatePath('/comunidade/igrejas');
    revalidatePath(`/comunidade/igrejas/${current.slug}`);
    revalidatePath(`/painel/cidade/comunidade/igrejas/${current.slug}`);
    return { ok: true, applied: { fields: parsed.fields.length, photos: selectedPhotos.length } };
  } catch (caught) {
    return { ok: false, error: getErrorMessage(caught, 'Falha ao aplicar importacao.') };
  }
}

function mergeGoogleChurchImportSource(
  current: Json | null,
  details: GooglePlaceDetails,
  fields: string[],
  photos: Array<{ name: string; role: string; attribution: string | null }>,
  importedPhotos: UploadedGoogleChurchPhoto[],
  reviewIds: string[],
): Json {
  const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  const currentGoogle = 'google_places' in base && base.google_places && typeof base.google_places === 'object' && !Array.isArray(base.google_places)
    ? base.google_places
    : {};
  const existingImported = 'imported_photos' in currentGoogle && Array.isArray(currentGoogle.imported_photos)
    ? currentGoogle.imported_photos
    : [];
  const approvedReviews = details.reviews.filter((review) => reviewIds.includes(review.id));
  return {
    ...base,
    google_places: {
      ...currentGoogle,
      place_id: details.placeId,
      google_maps_url: details.googleMapsUrl,
      street_view_url: details.streetViewUrl,
      imported_at: new Date().toISOString(),
      approved_fields: fields,
      approved_photos: photos.map((photo) => photo.name),
      pending_photos: [],
      imported_photos: [...existingImported, ...importedPhotos],
      rating: details.rating,
      user_rating_count: details.userRatingCount,
      business_status: details.businessStatus,
      price_level: details.priceLevel,
      price_range: details.priceRange,
      open_now: details.openNow,
      regular_hours_descriptions: details.hours,
      current_hours_descriptions: details.currentHours,
      secondary_hours_descriptions: details.secondaryHours,
      hours_structured: details.hoursStructured,
      attributes: details.attributes,
      summaries: details.summaries,
      approved_reviews: approvedReviews,
      available_reviews: details.reviews,
    },
  } as Json;
}

export async function updateChurchProfileAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireCommunityAdmin(city.id);
  const parsed = churchSchema.parse({
    id: formData.get('id'),
    city_id: formData.get('city_id'),
    slug: formData.get('slug'),
    name: formData.get('name'),
    tradition: formData.get('tradition'),
    short_description: formData.get('short_description'),
    description: field(formData, 'description'),
    pastor_name: field(formData, 'pastor_name'),
    phone: field(formData, 'phone'),
    whatsapp: field(formData, 'whatsapp'),
    email: field(formData, 'email'),
    instagram: field(formData, 'instagram'),
    website: field(formData, 'website'),
    address: field(formData, 'address'),
    google_maps_url: field(formData, 'google_maps_url'),
    lat: parseNullableNumber(formData.get('lat')),
    lng: parseNullableNumber(formData.get('lng')),
    status: formData.get('status'),
    featured: formData.get('featured') === 'on',
    verified: formData.get('verified') === 'on',
    claimed: formData.get('claimed') === 'on',
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('churches')
    .update({
      slug: parsed.slug,
      name: parsed.name,
      tradition: parsed.tradition,
      short_description: parsed.short_description,
      description: parsed.description,
      pastor_name: parsed.pastor_name,
      phone: parsed.phone,
      whatsapp: parsed.whatsapp,
      email: parsed.email,
      instagram: parsed.instagram,
      website: parsed.website,
      address: parsed.address,
      google_maps_url: parsed.google_maps_url,
      lat: parsed.lat,
      lng: parsed.lng,
      status: parsed.status,
      featured: parsed.featured,
      verified: parsed.verified,
      claimed: parsed.claimed,
    })
    .eq('id', parsed.id)
    .eq('city_id', city.id);
  if (error) throw error;

  revalidatePath('/comunidade/igrejas');
  revalidatePath(`/comunidade/igrejas/${parsed.slug}`);
  revalidatePath(`/painel/cidade/comunidade/igrejas/${parsed.slug}`);
  redirect(`/painel/cidade/comunidade/igrejas/${parsed.slug}`);
}

export async function upsertChurchScheduleItemAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireCommunityAdmin(city.id);
  const parsed = scheduleSchema.parse({
    id: formData.get('id') || undefined,
    church_id: formData.get('church_id'),
    city_id: formData.get('city_id'),
    weekday: formData.get('weekday'),
    starts_at: formData.get('starts_at'),
    ends_at: field(formData, 'ends_at'),
    title: formData.get('title'),
    note: field(formData, 'note'),
    source_status: formData.get('source_status'),
    active: formData.get('active') !== 'off',
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const { error } = await supabase.from('church_schedule_items').upsert(parsed);
  if (error) throw error;

  revalidatePath('/comunidade/igrejas');
  revalidatePath('/painel/cidade/comunidade');
}

export async function deleteChurchScheduleItemAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireCommunityAdmin(city.id);
  const parsed = z
    .object({
      id: z.string().uuid(),
      church_id: z.string().uuid(),
      city_id: z.string().uuid(),
    })
    .parse({
      id: formData.get('id'),
      church_id: formData.get('church_id'),
      city_id: formData.get('city_id'),
    });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('church_schedule_items')
    .delete()
    .eq('id', parsed.id)
    .eq('church_id', parsed.church_id)
    .eq('city_id', city.id);
  if (error) throw error;

  revalidatePath('/comunidade/igrejas');
  revalidatePath('/painel/cidade/comunidade');
}

export async function replyChurchReviewAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireCommunityAdmin(city.id);
  const parsed = reviewReplySchema.parse({
    review_id: formData.get('review_id'),
    church_id: formData.get('church_id'),
    reply_owner: formData.get('reply_owner'),
  });

  const supabase = await createClient();
  const { data: church } = await supabase
    .from('churches')
    .select('slug')
    .eq('id', parsed.church_id)
    .eq('city_id', city.id)
    .single();
  if (!church) return;

  const { error } = await supabase
    .from('church_reviews')
    .update({ reply_owner: parsed.reply_owner, reply_at: new Date().toISOString() })
    .eq('id', parsed.review_id)
    .eq('city_id', city.id)
    .eq('church_id', parsed.church_id);
  if (error) throw error;

  revalidatePath(`/comunidade/igrejas/${church.slug}`);
  revalidatePath(`/painel/cidade/comunidade/igrejas/${church.slug}/avaliacoes`);
}

export async function updateChurchReviewStatusAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireCommunityAdmin(city.id);
  const parsed = reviewStatusSchema.parse({
    review_id: formData.get('review_id'),
    church_id: formData.get('church_id'),
    status: formData.get('status'),
  });

  const supabase = await createClient();
  const { data: church } = await supabase
    .from('churches')
    .select('slug')
    .eq('id', parsed.church_id)
    .eq('city_id', city.id)
    .single();
  if (!church) return;

  const { error } = await supabase
    .from('church_reviews')
    .update({ status: parsed.status })
    .eq('id', parsed.review_id)
    .eq('city_id', city.id)
    .eq('church_id', parsed.church_id);
  if (error) throw error;

  revalidatePath(`/comunidade/igrejas/${church.slug}`);
  revalidatePath(`/painel/cidade/comunidade/igrejas/${church.slug}/avaliacoes`);
}

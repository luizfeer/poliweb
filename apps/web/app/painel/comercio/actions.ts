'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { hasRole, requireRole } from '@/lib/auth';
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

const nullableString = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable();

const businessSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  district_id: z.string().uuid().nullable(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  short_description: z.string().max(160).nullable(),
  description: z.string().max(5000).nullable(),
  cnpj: nullableString,
  phone: nullableString,
  whatsapp: nullableString,
  email: z.string().email().nullable(),
  website: z.string().url().nullable(),
  facebook: nullableString,
  google_maps_url: nullableString,
  instagram: nullableString,
  address: nullableString,
  cep: nullableString,
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  hours: z.record(z.string(), z.array(z.object({ open: z.string(), close: z.string() }))).default({}),
  amenities: z.array(z.string()).default([]),
  payment_methods: z.array(z.string()).default([]),
  status: z.enum(['draft', 'pending', 'published', 'archived']).default('draft'),
  category_ids: z.array(z.string().uuid()).min(1).optional(),
  primary_category_id: z.string().uuid().optional(),
});

const orderingSchema = z.object({
  business_id: z.string().uuid(),
  ordering_enabled: z.boolean().default(false),
  delivery_enabled: z.boolean().default(false),
  pickup_enabled: z.boolean().default(false),
  delivery_fee: nullableString,
  delivery_min_order: nullableString,
  delivery_time_min: nullableString,
  pix_key: nullableString,
  order_instructions: nullableString,
  offerings: z.array(z.object({
    kind: z.enum(['product', 'service']),
    name: z.string().min(1).max(160),
    description: nullableString,
    price: nullableString,
  })).default([]),
});

const categoriesSchema = z.object({
  business_id: z.string().uuid(),
  category_ids: z.array(z.string().uuid()).min(1),
  primary_category_id: z.string().uuid(),
});

const promotionSchema = z.object({
  business_id: z.string().uuid(),
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(120),
  description: z.string().max(1000).nullable(),
  coupon_code: nullableString,
  discount_percent: z.number().int().min(0).max(100).nullable(),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime().nullable(),
  active: z.boolean().default(true),
});

const googleSearchSchema = z.object({
  businessId: z.string().uuid(),
  query: z.string().trim().min(2).max(180),
});

const googleDetailsSchema = z.object({
  businessId: z.string().uuid(),
  placeId: z.string().trim().min(3).max(180),
});

const googleApplySchema = z.object({
  businessId: z.string().uuid(),
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
    'amenities',
    'payment_methods',
    'price',
    'street_view',
  ])).default([]),
  photos: z.array(z.string().trim().min(3).max(1024)).max(20).default([]),
  reviews: z.array(z.string().trim().min(3).max(512)).max(5).default([]),
});

type BusinessUpdate = Database['public']['Tables']['businesses']['Update'];

type UploadedGooglePhoto = {
  name: string;
  role: 'gallery';
  attribution: string | null;
  asset_id: string;
  cdn_url: string;
  imported_at: string;
};

function parseNullableNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseStringArray(values: FormDataEntryValue[]): string[] {
  return values
    .flatMap((value) => (typeof value === 'string' ? value.split(',') : []))
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonObject(value: FormDataEntryValue | null): Record<string, Array<{ open: string; close: string }>> {
  if (typeof value !== 'string' || value.trim() === '') return {};
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  return parsed as Record<string, Array<{ open: string; close: string }>>;
}

function parseBusinessFormData(formData: FormData) {
  const hasCategories = formData.has('category_ids');
  return businessSchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    district_id: formData.get('district_id') || null,
    slug: formData.get('slug'),
    name: formData.get('name'),
    short_description: formData.get('short_description') || null,
    description: formData.get('description') || null,
    cnpj: formData.get('cnpj') || null,
    phone: formData.get('phone') || null,
    whatsapp: formData.get('whatsapp') || null,
    email: formData.get('email') || null,
    website: formData.get('website') || null,
    facebook: formData.get('facebook') || null,
    google_maps_url: formData.get('google_maps_url') || null,
    instagram: formData.get('instagram') || null,
    address: formData.get('address') || null,
    cep: formData.get('cep') || null,
    lat: parseNullableNumber(formData.get('lat')),
    lng: parseNullableNumber(formData.get('lng')),
    hours: parseJsonObject(formData.get('hours')),
    amenities: parseStringArray(formData.getAll('amenities')),
    payment_methods: parseStringArray(formData.getAll('payment_methods')),
    status: formData.get('status') || 'draft',
    category_ids: hasCategories ? formData.getAll('category_ids').map(String) : undefined,
    primary_category_id: hasCategories ? formData.get('primary_category_id') : undefined,
  });
}

type PanelDraft = {
  delivery: {
    deliveryEnabled: boolean;
    pickupEnabled: boolean;
    deliveryFee: string | null;
    deliveryMinOrder: string | null;
    deliveryTimeMin: string | null;
    pixKey: string | null;
    orderInstructions: string | null;
  };
  offerings: Array<{
    kind: 'service' | 'product';
    name: string;
    description: string | null;
    price: string | null;
  }>;
};

function parseNullableText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parsePanelDraft(formData: FormData): PanelDraft {
  const kinds = formData.getAll('offering_kind').map(String);
  const names = formData.getAll('offering_name').map(String);
  const descriptions = formData.getAll('offering_description').map(String);
  const prices = formData.getAll('offering_price').map(String);

  return {
    delivery: {
      deliveryEnabled: formData.get('delivery_enabled') === 'on',
      pickupEnabled: formData.get('pickup_enabled') !== 'off',
      deliveryFee: parseNullableText(formData.get('delivery_fee')),
      deliveryMinOrder: parseNullableText(formData.get('delivery_min_order')),
      deliveryTimeMin: parseNullableText(formData.get('delivery_time_min')),
      pixKey: parseNullableText(formData.get('pix_key')),
      orderInstructions: parseNullableText(formData.get('order_instructions')),
    },
    offerings: names
      .map((name, index) => ({
        kind: kinds[index] === 'service' ? 'service' as const : 'product' as const,
        name: name.trim(),
        description: descriptions[index]?.trim() || null,
        price: prices[index]?.trim() || null,
      }))
      .filter((item) => item.name.length > 0),
  };
}

function hasOrderingConfig(draft: PanelDraft): boolean {
  return draft.offerings.length > 0 && (draft.delivery.deliveryEnabled || draft.delivery.pickupEnabled);
}

function mergeImportSource(current: Json | null, draft: PanelDraft): Json {
  const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  return {
    ...base,
    panel_draft: draft,
  } as Json;
}

async function insertAudit(action: string, cityId: string, entityType: string, entityId: string, diff: Json) {
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

async function assertCanManageBusiness(businessId: string, cityId: string, profileId: string) {
  const supabase = await createClient();
  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, owner_profile_id')
    .eq('id', businessId)
    .eq('city_id', cityId)
    .single();

  if (error || !business) throw error ?? new Error('Comércio não encontrado.');
  if (business.owner_profile_id === profileId) return;

  const { data: manager } = await supabase
    .from('entity_managers')
    .select('id')
    .eq('profile_id', profileId)
    .eq('entity_type', 'business')
    .eq('entity_id', businessId)
    .maybeSingle();

  if (manager) return;

  await requireRole({ cityId, kinds: ['city_admin', 'super_admin'] });
}

export async function searchGoogleBusinessCandidatesAction(input: unknown): Promise<{ candidates: GooglePlaceCandidate[]; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { candidates: [], error: 'Cidade atual não encontrada.' };

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const parsed = googleSearchSchema.parse(input);
  await assertCanManageBusiness(parsed.businessId, city.id, auth.profile.id);

  try {
    const candidates = await searchGooglePlaces(`${parsed.query} ${city.name} ${city.state}`);
    return { candidates };
  } catch (caught) {
    return { candidates: [], error: caught instanceof Error ? caught.message : 'Falha ao buscar no Google.' };
  }
}

export async function getGoogleBusinessDetailsAction(input: unknown): Promise<{ details: GooglePlaceDetails | null; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { details: null, error: 'Cidade atual não encontrada.' };

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const parsed = googleDetailsSchema.parse(input);
  await assertCanManageBusiness(parsed.businessId, city.id, auth.profile.id);

  try {
    const details = await getGooglePlaceDetails(parsed.placeId);
    return { details };
  } catch (caught) {
    return { details: null, error: caught instanceof Error ? caught.message : 'Falha ao carregar dados do Google.' };
  }
}

export async function applyGoogleBusinessImportAction(input: unknown): Promise<{ ok: boolean; error?: string; applied?: { fields: number; photos: number } }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade atual não encontrada.' };

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const parsedResult = googleApplySchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false, error: 'Dados selecionados para importação estão inválidos.' };
  }
  const parsed = parsedResult.data;
  await assertCanManageBusiness(parsed.businessId, city.id, auth.profile.id);

  try {
    const details = await getGooglePlaceDetails(parsed.placeId);
    const supabase = await createClient();
    const photoDetailsByName = new Map(details.photos.map((photo) => [photo.name, photo]));
    const selectedPhotos = parsed.photos.map((name) => ({
      name,
      attribution: photoDetailsByName.get(name)?.attribution ?? null,
    }));
    const uploadedPhotos: UploadedGooglePhoto[] = [];
    console.info('[google-import] applying import', {
      businessId: parsed.businessId,
      placeId: parsed.placeId,
      fields: parsed.fields,
      selectedPhotos: selectedPhotos.length,
    });

    const { data: current, error: currentError } = await supabase
      .from('businesses')
      .select('import_source, slug')
      .eq('id', parsed.businessId)
      .eq('city_id', city.id)
      .single();
    if (currentError) throw currentError;

    for (const [index, photo] of selectedPhotos.entries()) {
      const file = await getGooglePlacePhotoFile(photo.name, `google-business-${parsed.businessId}-${index + 1}.jpg`);
      const uploaded = await uploadLinkedImage({
        entityType: 'business',
        entityId: parsed.businessId,
        role: 'gallery',
        file,
        actorProfileId: auth.profile.id,
        altText: photo.attribution ? `Foto do Google. Credito: ${photo.attribution}` : 'Foto importada do Google.',
      });

      uploadedPhotos.push({
        name: photo.name,
        role: 'gallery',
        attribution: photo.attribution,
        asset_id: uploaded.id,
        cdn_url: uploaded.url,
        imported_at: new Date().toISOString(),
      });
    }

    const payload: BusinessUpdate = {};
    if (parsed.fields.includes('name')) payload.name = details.name;
    if (parsed.fields.includes('address')) payload.address = details.address;
    if (parsed.fields.includes('phone')) payload.phone = details.phone;
    if (parsed.fields.includes('website')) payload.website = details.website;
    if (parsed.fields.includes('google_maps_url')) payload.google_maps_url = details.googleMapsUrl;
    if (parsed.fields.includes('lat_lng')) {
      payload.lat = details.lat;
      payload.lng = details.lng;
    }
    if (parsed.fields.includes('hours')) {
      payload.hours = Object.keys(details.hoursStructured).length > 0
        ? details.hoursStructured
        : { google_weekday_descriptions: details.hours };
    }
    if (parsed.fields.includes('amenities') && details.amenities.length > 0) {
      payload.amenities = details.amenities;
    }
    if (parsed.fields.includes('payment_methods') && details.paymentMethods.length > 0) {
      payload.payment_methods = details.paymentMethods;
    }

    payload.import_source = mergeGoogleImportSource(
      current?.import_source ?? null,
      details,
      parsed.fields,
      selectedPhotos.map((photo) => ({
        name: photo.name,
        role: 'gallery',
        attribution: photo.attribution,
      })),
      uploadedPhotos,
      parsed.reviews,
    );

    const { error: updateError } = await supabase
      .from('businesses')
      .update(payload)
      .eq('id', parsed.businessId)
      .eq('city_id', city.id);
    if (updateError) throw updateError;
    console.info('[google-import] fields updated', {
      businessId: parsed.businessId,
      fields: parsed.fields.length,
    });

    console.info('[google-import] finished', {
      businessId: parsed.businessId,
      fields: parsed.fields.length,
      queuedPhotos: selectedPhotos.length,
    });

    await insertAudit('business.google_import.apply', city.id, 'business', parsed.businessId, {
      place_id: parsed.placeId,
      fields: parsed.fields,
      photos_count: selectedPhotos.length,
      reviews_count: parsed.reviews.length,
    });

    revalidatePath('/painel/comercio');
    revalidatePath(`/painel/comercio/${parsed.businessId}`);
    if (current?.slug) revalidatePath(`/comercio/negocio/${current.slug}`);
    return { ok: true, applied: { fields: parsed.fields.length, photos: selectedPhotos.length } };
  } catch (caught) {
    console.error('[google-import] failed', caught);
    return { ok: false, error: getErrorMessage(caught, 'Falha ao aplicar importação.') };
  }
}

function mergeGoogleImportSource(
  current: Json | null,
  details: GooglePlaceDetails,
  fields: string[],
  photos: Array<{ name: string; role: string; attribution: string | null }>,
  importedPhotos: UploadedGooglePhoto[],
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
      amenities: details.amenities,
      payment_methods: details.paymentMethods,
      attributes: details.attributes,
      summaries: details.summaries,
      approved_reviews: approvedReviews,
      available_reviews: details.reviews,
    },
  } as Json;
}

export async function upsertBusinessAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const parsed = parseBusinessFormData(formData);
  if (parsed.city_id !== city.id) return;

  const isInsert = !parsed.id;
  if (isInsert) {
    if (!parsed.category_ids || !parsed.primary_category_id || !parsed.category_ids.includes(parsed.primary_category_id)) return;
  }

  const supabase = await createClient();

  const canManageAll = hasRole(auth.roles, ['city_admin', 'super_admin'], city.id);
  const currentStatus = parsed.id
    ? (await supabase.from('businesses').select('status').eq('id', parsed.id).eq('city_id', city.id).maybeSingle()).data?.status ?? 'draft'
    : 'draft';
  const allowedStatus = canManageAll
    ? parsed.status
    : parsed.status === 'draft' || parsed.status === 'pending'
      ? parsed.status
      : (currentStatus as typeof parsed.status);

  const payload = {
    city_id: city.id,
    district_id: parsed.district_id,
    slug: parsed.slug,
    name: parsed.name,
    short_description: parsed.short_description,
    description: parsed.description,
    cnpj: parsed.cnpj,
    phone: parsed.phone,
    whatsapp: parsed.whatsapp,
    email: parsed.email,
    website: parsed.website,
    facebook: parsed.facebook,
    google_maps_url: parsed.google_maps_url,
    instagram: parsed.instagram,
    address: parsed.address,
    cep: parsed.cep,
    lat: parsed.lat,
    lng: parsed.lng,
    hours: parsed.hours as Json,
    amenities: parsed.amenities,
    payment_methods: parsed.payment_methods,
    status: allowedStatus,
  };

  const { data: business, error } = parsed.id
    ? await supabase
        .from('businesses')
        .update(payload)
        .eq('id', parsed.id)
        .eq('city_id', city.id)
        .select('id, slug')
        .single()
    : await supabase
        .from('businesses')
        .insert({ ...payload, owner_profile_id: auth.profile.id })
        .select('id, slug')
        .single();
  if (error || !business) throw error;

  if (isInsert && parsed.category_ids && parsed.primary_category_id) {
    await supabase.from('business_category_assignments').insert(
      parsed.category_ids.map((categoryId) => ({
        business_id: business.id,
        category_id: categoryId,
        is_primary: categoryId === parsed.primary_category_id,
      })),
    );
  }

  await supabase.from('ai_jobs').insert({
    city_id: city.id,
    job_type: 'generate_embedding',
    input_ref: { entity_type: 'business', entity_id: business.id },
  });
  await insertAudit('business.upsert', city.id, 'business', business.id, {
    slug: parsed.slug,
    status: allowedStatus,
  });

  revalidatePath('/comercio');
  revalidatePath(`/comercio/negocio/${business.slug}`);
  revalidatePath('/painel/comercio');
}

export async function uploadBusinessMediaAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const businessId = z.string().uuid().parse(formData.get('business_id'));
  const kind = z.enum(['logo', 'cover', 'gallery']).parse(formData.get('kind'));
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;

  await uploadLinkedImage({
    entityType: 'business',
    entityId: businessId,
    role: kind,
    file,
    altText: null,
    actorProfileId: auth.profile.id,
  });
  revalidatePath('/painel/comercio');
}

export async function upsertPromotionAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const parsed = promotionSchema.parse({
    business_id: formData.get('business_id'),
    id: formData.get('id') || undefined,
    title: formData.get('title'),
    description: formData.get('description') || null,
    coupon_code: formData.get('coupon_code') || null,
    discount_percent: parseNullableNumber(formData.get('discount_percent')),
    valid_from: new Date(String(formData.get('valid_from'))).toISOString(),
    valid_until: formData.get('valid_until') ? new Date(String(formData.get('valid_until'))).toISOString() : null,
    active: formData.get('active') === 'on',
  });

  const supabase = await createClient();
  const { error } = await supabase.from('business_promotions').upsert(parsed);
  if (error) throw error;

  await insertAudit('business.promotion.upsert', city.id, 'business', parsed.business_id, {
    promotion_id: parsed.id ?? null,
  });
  revalidatePath('/painel/comercio');
}

export async function replyReviewAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const parsed = z
    .object({
      review_id: z.string().uuid(),
      reply_owner: z.string().min(2).max(1000),
    })
    .parse({
      review_id: formData.get('review_id'),
      reply_owner: formData.get('reply_owner'),
    });

  const supabase = await createClient();
  const { error } = await supabase
    .from('business_reviews')
    .update({ reply_owner: parsed.reply_owner, reply_at: new Date().toISOString() })
    .eq('id', parsed.review_id);
  if (error) throw error;

  await insertAudit('business.review.reply', city.id, 'business_review', parsed.review_id, {});
  revalidatePath('/painel/comercio');
}

export async function deleteBusinessAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const businessId = z.string().uuid().parse(formData.get('business_id'));
  await assertCanManageBusiness(businessId, city.id, auth.profile.id);

  const supabase = await createClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('slug')
    .eq('id', businessId)
    .eq('city_id', city.id)
    .single();

  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId)
    .eq('city_id', city.id);
  if (error) throw error;

  await insertAudit('business.delete', city.id, 'business', businessId, { slug: business?.slug ?? null });

  revalidatePath('/comercio');
  revalidatePath('/painel/comercio');
  revalidatePath('/painel/cidade/comercio');
}

export async function convertBusinessToAttractionAction(
  _prevState: unknown,
  formData: FormData,
) {
  const { convertBusinessToAttractionAction: original } = await import('../turismo/actions');
  return original(_prevState, formData);
}

const statusUpdateSchema = z.object({
  business_id: z.string().uuid(),
  status: z.enum(['draft', 'pending', 'published', 'archived']),
});

export async function setBusinessStatusAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const parsed = statusUpdateSchema.parse({
    business_id: formData.get('business_id'),
    status: formData.get('status'),
  });
  await assertCanManageBusiness(parsed.business_id, city.id, auth.profile.id);

  const canManageAll = hasRole(auth.roles, ['city_admin', 'super_admin'], city.id);
  if (!canManageAll && parsed.status !== 'draft' && parsed.status !== 'pending') return;

  const supabase = await createClient();
  const { data: business, error } = await supabase
    .from('businesses')
    .update({ status: parsed.status })
    .eq('id', parsed.business_id)
    .eq('city_id', city.id)
    .select('id, slug')
    .single();
  if (error || !business) throw error;

  await insertAudit('business.status.update', city.id, 'business', business.id, { status: parsed.status });
  revalidatePath('/painel/comercio');
  revalidatePath(`/painel/comercio/${business.id}`);
  revalidatePath(`/comercio/negocio/${business.slug}`);
}

export async function updateBusinessOrderingAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const draftRaw = parsePanelDraft(formData);
  const parsed = orderingSchema.parse({
    business_id: formData.get('business_id'),
    ordering_enabled: formData.get('ordering_enabled') === 'on',
    delivery_enabled: draftRaw.delivery.deliveryEnabled,
    pickup_enabled: draftRaw.delivery.pickupEnabled,
    delivery_fee: draftRaw.delivery.deliveryFee,
    delivery_min_order: draftRaw.delivery.deliveryMinOrder,
    delivery_time_min: draftRaw.delivery.deliveryTimeMin,
    pix_key: draftRaw.delivery.pixKey,
    order_instructions: draftRaw.delivery.orderInstructions,
    offerings: draftRaw.offerings.map((offering) => ({
      kind: offering.kind,
      name: offering.name,
      description: offering.description,
      price: offering.price,
    })),
  });
  await assertCanManageBusiness(parsed.business_id, city.id, auth.profile.id);

  const canManageAll = hasRole(auth.roles, ['city_admin', 'super_admin'], city.id);

  const supabase = await createClient();
  const { data: current } = await supabase
    .from('businesses')
    .select('import_source, ordering_enabled, slug')
    .eq('id', parsed.business_id)
    .eq('city_id', city.id)
    .single();

  const panelDraft: PanelDraft = {
    delivery: {
      deliveryEnabled: parsed.delivery_enabled,
      pickupEnabled: parsed.pickup_enabled,
      deliveryFee: parsed.delivery_fee,
      deliveryMinOrder: parsed.delivery_min_order,
      deliveryTimeMin: parsed.delivery_time_min,
      pixKey: parsed.pix_key,
      orderInstructions: parsed.order_instructions,
    },
    offerings: parsed.offerings.map((offering) => ({
      kind: offering.kind,
      name: offering.name,
      description: offering.description,
      price: offering.price,
    })),
  };

  const merged = mergeImportSource(current?.import_source ?? null, panelDraft);
  const configured = hasOrderingConfig(panelDraft);
  const orderingEnabled = canManageAll ? parsed.ordering_enabled && configured : (current?.ordering_enabled ?? false) && configured;

  const { error } = await supabase
    .from('businesses')
    .update({ import_source: merged, ordering_enabled: orderingEnabled })
    .eq('id', parsed.business_id)
    .eq('city_id', city.id);
  if (error) throw error;

  await insertAudit('business.ordering.update', city.id, 'business', parsed.business_id, {
    ordering_enabled: orderingEnabled,
    offerings_count: panelDraft.offerings.length,
  });
  revalidatePath(`/painel/comercio/${parsed.business_id}`);
  revalidatePath(`/painel/comercio/${parsed.business_id}/pedidos`);
  if (current?.slug) revalidatePath(`/comercio/negocio/${current.slug}`);
}

export async function updateBusinessCategoriesAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const parsed = categoriesSchema.parse({
    business_id: formData.get('business_id'),
    category_ids: formData.getAll('category_ids').map(String),
    primary_category_id: formData.get('primary_category_id'),
  });
  if (!parsed.category_ids.includes(parsed.primary_category_id)) return;
  await assertCanManageBusiness(parsed.business_id, city.id, auth.profile.id);

  const supabase = await createClient();
  const { data: current } = await supabase
    .from('businesses')
    .select('slug')
    .eq('id', parsed.business_id)
    .eq('city_id', city.id)
    .single();

  await supabase.from('business_category_assignments').delete().eq('business_id', parsed.business_id);
  const { error } = await supabase.from('business_category_assignments').insert(
    parsed.category_ids.map((categoryId) => ({
      business_id: parsed.business_id,
      category_id: categoryId,
      is_primary: categoryId === parsed.primary_category_id,
    })),
  );
  if (error) throw error;

  await insertAudit('business.categories.update', city.id, 'business', parsed.business_id, {
    category_ids: parsed.category_ids,
    primary_category_id: parsed.primary_category_id,
  });
  revalidatePath(`/painel/comercio/${parsed.business_id}`);
  revalidatePath(`/painel/comercio/${parsed.business_id}/categorias`);
  if (current?.slug) revalidatePath(`/comercio/negocio/${current.slug}`);
}

export async function requestPublishAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const businessId = z.string().uuid().parse(formData.get('business_id'));
  const supabase = await createClient();

  const { error } = await supabase
    .from('businesses')
    .update({ status: 'pending' })
    .eq('id', businessId)
    .eq('city_id', city.id);
  if (error) throw error;

  await insertAudit('business.publish.request', city.id, 'business', businessId, {});
  revalidatePath('/painel/comercio');
  revalidatePath('/painel/cidade/comercio');
}

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireProfile, requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { uploadLinkedImage } from '@/lib/media/actions';
import { getErrorMessage } from '@/lib/errors/message';
import { parseYouTubeVideoId } from '@/lib/utils/youtube';
import {
  getGooglePlaceDetails,
  getGooglePlacePhotoFile,
  searchGooglePlaces,
  type GooglePlaceCandidate,
  type GooglePlaceDetails,
} from '@/lib/google/places';

const nullableString = z.string().trim().max(12000).transform((value) => (value ? value : null)).nullable();
const statusSchema = z.enum(['draft', 'pending', 'published', 'rejected', 'archived']);
const slugSchema = z.string().regex(/^[a-z0-9-]+$/).max(120);

const guideYoutubeUrlSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null) return null;
    const s = v.trim();
    return s === '' ? null : s;
  })
  .refine((s) => s === null || (s.length <= 500 && parseYouTubeVideoId(s) !== null), {
    message: 'URL do YouTube inválida',
  });

const linkedEntityItemSchema = z.object({
  entity_type: z.enum(['attraction', 'business', 'accommodation', 'restaurant', 'fishing_spot']),
  entity_id: z.string().uuid(),
  sort_order: z.number().int().optional(),
  label: nullableString,
  description: nullableString,
});

const tourismGuideUpsertSchema = z.object({
  id: z.string().uuid(),
  city_id: z.string().uuid(),
  slug: slugSchema,
  aliases: z.array(z.string().regex(/^[a-z0-9-]+$/).max(120)).default([]),
  kind: z.enum(['distrito', 'cidade', 'tematico', 'roteiro']),
  name: z.string().min(2).max(200),
  tagline: nullableString,
  description: nullableString,
  cover_url: nullableString,
  youtube_url: guideYoutubeUrlSchema,
  address: nullableString,
  lat: z.number().finite().nullable(),
  lng: z.number().finite().nullable(),
  phone: nullableString,
  whatsapp: nullableString,
  website: nullableString,
  instagram: nullableString,
  google_place_id: nullableString,
  google_maps_url: nullableString,
  google_summary: nullableString,
  rating: z.number().finite().nullable(),
  reviews_count: z.number().int().nonnegative().nullable(),
  status: statusSchema,
  featured: z.boolean(),
  sections: z.array(z.record(z.string(), z.unknown())).default([]),
  seo: z.record(z.string(), z.unknown()).default({}),
  practical_info: z.array(z.record(z.string(), z.unknown())).default([]),
  faq: z.array(z.record(z.string(), z.unknown())).default([]),
  highlights: z.array(z.record(z.string(), z.unknown())).default([]),
  content_blocks: z.array(z.record(z.string(), z.unknown())).default([]),
  photos: z.array(z.string()).default([]),
  google_photos: z.record(z.string(), z.unknown()).default({}),
  linked_entities: z.array(linkedEntityItemSchema).default([]),
});

const googleGuideSearchSchema = z.object({
  guideId: z.string().uuid(),
  query: z.string().trim().min(2).max(180),
});

const googleGuideDetailsSchema = z.object({
  guideId: z.string().uuid(),
  placeId: z.string().trim().min(3).max(180),
});

const googleGuideApplySchema = z.object({
  guideId: z.string().uuid(),
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
        'summaries',
      ]),
    )
    .default([]),
  photos: z.array(z.string().trim().min(1).max(2048)).max(20).default([]),
  reviews: z.array(z.string().trim().min(1).max(2048)).max(5).default([]),
});

type UploadedGooglePhoto = {
  name: string;
  role: 'gallery';
  attribution: string | null;
  asset_id: string;
  cdn_url: string;
  imported_at: string;
};

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? '').trim();
  return value ? value : null;
}

function num(formData: FormData, key: string): number | null {
  const value = text(formData, key);
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseAliases(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-z0-9-]+$/.test(s));
}

function parseJsonOrEmpty<T>(raw: string | null, label: string, schema: z.ZodType<T>, empty: T): T {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) return empty;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  } catch (caught) {
    throw new Error(`${label}: JSON inválido (${caught instanceof Error ? caught.message : 'erro'})`);
  }
}

async function insertAudit(action: string, cityId: string, entityType: string, entityId: string | null, diff: Json) {
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

async function assertCanManageGuide(guideId: string, cityId: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tourism_guides')
    .select('id, slug, google_photos, practical_info')
    .eq('id', guideId)
    .eq('city_id', cityId)
    .single();
  if (error || !data) throw error ?? new Error('Guia não encontrado.');
  return data as { id: string; slug: string; google_photos: Json | null; practical_info: Json | null };
}

export async function upsertTourismGuideAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const sections = parseJsonOrEmpty(text(formData, 'sections_json'), 'Seções', z.array(z.record(z.string(), z.unknown())), []);
  const seo = parseJsonOrEmpty(text(formData, 'seo_json'), 'SEO', z.record(z.string(), z.unknown()), {});
  const practical_info = parseJsonOrEmpty(
    text(formData, 'practical_info_json'),
    'Informações práticas',
    z.array(z.record(z.string(), z.unknown())),
    [],
  );
  const faq = parseJsonOrEmpty(text(formData, 'faq_json'), 'FAQ', z.array(z.record(z.string(), z.unknown())), []);
  const highlights = parseJsonOrEmpty(text(formData, 'highlights_json'), 'Destaques', z.array(z.record(z.string(), z.unknown())), []);
  const content_blocks = parseJsonOrEmpty(text(formData, 'content_blocks_json'), 'Blocos', z.array(z.record(z.string(), z.unknown())), []);
  const photos = parseJsonOrEmpty(text(formData, 'photos_json'), 'Fotos (URLs)', z.array(z.string()), []);
  const google_photos = parseJsonOrEmpty(text(formData, 'google_photos_json'), 'Google fotos', z.record(z.string(), z.unknown()), {});
  const linked_entities = parseJsonOrEmpty(
    text(formData, 'linked_entities_json'),
    'Entidades ligadas',
    z.array(linkedEntityItemSchema),
    [],
  );

  const reviewsCountRaw = num(formData, 'reviews_count');

  const parsed = tourismGuideUpsertSchema.parse({
    id: formData.get('id'),
    city_id: formData.get('city_id'),
    slug: text(formData, 'slug'),
    aliases: parseAliases(text(formData, 'aliases')),
    kind: text(formData, 'kind') ?? 'distrito',
    name: text(formData, 'name'),
    tagline: text(formData, 'tagline'),
    description: text(formData, 'description'),
    cover_url: text(formData, 'cover_url'),
    youtube_url: text(formData, 'youtube_url'),
    address: text(formData, 'address'),
    lat: num(formData, 'lat'),
    lng: num(formData, 'lng'),
    phone: text(formData, 'phone'),
    whatsapp: text(formData, 'whatsapp'),
    website: text(formData, 'website'),
    instagram: text(formData, 'instagram'),
    google_place_id: text(formData, 'google_place_id'),
    google_maps_url: text(formData, 'google_maps_url'),
    google_summary: text(formData, 'google_summary'),
    rating: num(formData, 'rating'),
    reviews_count: reviewsCountRaw !== null ? Math.round(reviewsCountRaw) : null,
    status: text(formData, 'status') ?? 'draft',
    featured: formData.get('featured') === 'on',
    sections,
    seo,
    practical_info,
    faq,
    highlights,
    content_blocks,
    photos,
    google_photos,
    linked_entities,
  });

  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();

  const payload = {
    slug: parsed.slug,
    aliases: parsed.aliases,
    kind: parsed.kind,
    name: parsed.name,
    tagline: parsed.tagline,
    description: parsed.description,
    cover_url: parsed.cover_url,
    youtube_url: parsed.youtube_url,
    address: parsed.address,
    lat: parsed.lat,
    lng: parsed.lng,
    phone: parsed.phone,
    whatsapp: parsed.whatsapp,
    website: parsed.website,
    instagram: parsed.instagram,
    google_place_id: parsed.google_place_id,
    google_maps_url: parsed.google_maps_url,
    google_summary: parsed.google_summary,
    rating: parsed.rating,
    reviews_count: parsed.reviews_count ?? 0,
    status: parsed.status,
    featured: parsed.featured,
    sections: parsed.sections as Json,
    seo: parsed.seo as Json,
    practical_info: parsed.practical_info as Json,
    faq: parsed.faq as Json,
    highlights: parsed.highlights as Json,
    content_blocks: parsed.content_blocks as Json,
    photos: parsed.photos as unknown as Json,
    google_photos: parsed.google_photos as Json,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('tourism_guides').update(payload).eq('id', parsed.id).eq('city_id', city.id);

  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('guide_linked_entities').delete().eq('guide_id', parsed.id);

  if (parsed.linked_entities.length > 0) {
    const rows = parsed.linked_entities.map((row, index) => ({
      guide_id: parsed.id,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      sort_order: row.sort_order ?? index,
      label: row.label,
      description: row.description,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: linkError } = await (supabase as any).from('guide_linked_entities').insert(rows);
    if (linkError) throw linkError;
  }

  await insertAudit('tourism.guide.upsert', city.id, 'tourism_guide', parsed.id, { slug: parsed.slug, status: parsed.status });
  revalidatePath('/painel/cidade/turismo/guias');
  revalidatePath(`/painel/cidade/turismo/guias/${parsed.id}`);
  revalidatePath('/turismo/guias');
  revalidatePath(`/turismo/guias/${parsed.slug}`);
}

const searchGuideAttractionsSchema = z.object({
  q: z.string().trim().min(2).max(120),
});

export type GuideAttractionSearchHit = {
  id: string;
  name: string;
  slug: string;
  type: string;
};

export async function searchAttractionsForGuideLinkAction(
  input: unknown,
): Promise<{ items: GuideAttractionSearchHit[]; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { items: [], error: 'Cidade atual não encontrada.' };
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = searchGuideAttractionsSchema.safeParse(input);
  if (!parsed.success) return { items: [] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attractions')
    .select('id, name, slug, type')
    .eq('city_id', city.id)
    .ilike('name', `%${parsed.data.q}%`)
    .order('name', { ascending: true })
    .limit(25);

  if (error) return { items: [], error: error.message };
  const rows = (data ?? []) as Array<{ id: string; name: string; slug: string; type: string | null }>;
  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type ?? 'historico',
    })),
  };
}

export async function searchGoogleGuideCandidatesAction(
  input: unknown,
): Promise<{ candidates: GooglePlaceCandidate[]; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { candidates: [], error: 'Cidade atual não encontrada.' };
  await requireProfile();
  const parsed = googleGuideSearchSchema.parse(input);
  await assertCanManageGuide(parsed.guideId, city.id);

  try {
    const candidates = await searchGooglePlaces(`${parsed.query} ${city.name} ${city.state}`);
    return { candidates };
  } catch (caught) {
    return { candidates: [], error: caught instanceof Error ? caught.message : 'Falha ao buscar no Google.' };
  }
}

export async function getGoogleGuideDetailsAction(
  input: unknown,
): Promise<{ details: GooglePlaceDetails | null; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { details: null, error: 'Cidade atual não encontrada.' };
  await requireProfile();
  const parsed = googleGuideDetailsSchema.parse(input);
  await assertCanManageGuide(parsed.guideId, city.id);

  try {
    const details = await getGooglePlaceDetails(parsed.placeId);
    return { details };
  } catch (caught) {
    return { details: null, error: caught instanceof Error ? caught.message : 'Falha ao carregar dados do Google.' };
  }
}

function mergeGoogleGuidePhotos(
  current: Json | null,
  pendingPhotos: Array<{ name: string; role: string; attribution: string | null }>,
  importedPhotos: UploadedGooglePhoto[],
  approvedReviews: GooglePlaceDetails['reviews'],
  streetViewUrl: string | null | undefined,
): Json {
  const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  const existingImported =
    'imported_photos' in base && Array.isArray((base as Record<string, unknown>).imported_photos)
      ? (base as Record<string, unknown>).imported_photos
      : [];
  const merged: Record<string, unknown> = {
    ...base,
    pending_photos: [],
    approved_photos: pendingPhotos.map((photo) => photo.name),
    imported_photos: [...(existingImported as unknown[]), ...importedPhotos],
    approved_reviews: approvedReviews,
    updated_at: new Date().toISOString(),
  };
  if (streetViewUrl !== undefined) {
    merged.street_view_url = streetViewUrl;
  }
  return merged as Json;
}

const PRACTICAL_HOURS_TITLE = 'Horários (Google)';

function mergePracticalInfoWithGoogleHours(
  current: Json | null,
  weekdayLines: string[],
): Array<{ title: string; text: string }> {
  const rows = Array.isArray(current)
    ? current.filter((row): row is { title: string; text: string } => {
        if (!row || typeof row !== 'object') return false;
        const o = row as Record<string, unknown>;
        return typeof o.title === 'string' && typeof o.text === 'string';
      })
    : [];
  const rest = rows.filter((r) => r.title !== PRACTICAL_HOURS_TITLE);
  if (weekdayLines.length === 0) return rest;
  return [...rest, { title: PRACTICAL_HOURS_TITLE, text: weekdayLines.join('\n') }];
}

export async function applyGoogleGuideImportAction(
  input: unknown,
): Promise<{ ok: boolean; error?: string; applied?: { fields: number; photos: number } }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade atual não encontrada.' };
  const auth = await requireProfile();
  const parsedResult = googleGuideApplySchema.safeParse(input);
  if (!parsedResult.success) {
    return {
      ok: false,
      error: `Dados da importação inválidos: ${parsedResult.error.issues.map((i) => i.message).join('; ')}`,
    };
  }
  const parsed = parsedResult.data;

  try {
    const current = await assertCanManageGuide(parsed.guideId, city.id);
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
        const file = await getGooglePlacePhotoFile(photo.name, `google-guide-${parsed.guideId}-${index + 1}.jpg`);
        const uploaded = await uploadLinkedImage({
          entityType: 'tourism_guide',
          entityId: parsed.guideId,
          role: 'gallery',
          file,
          actorProfileId: auth.profile.id,
          altText: photo.attribution ? `Foto do Google. Crédito: ${photo.attribution}` : 'Foto importada do Google.',
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

    const streetViewForMerge = parsed.fields.includes('street_view') ? details.streetViewUrl : undefined;
    const mergedPhotos = mergeGoogleGuidePhotos(
      current.google_photos ?? null,
      selectedPhotos,
      uploadedPhotos,
      approvedReviews,
      streetViewForMerge,
    );

    const payload: Record<string, unknown> = {
      google_place_id: details.placeId,
      google_photos: mergedPhotos,
    };

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
    if (parsed.fields.includes('rating')) {
      payload.rating = details.rating;
      payload.reviews_count = details.userRatingCount ?? 0;
    }
    if (parsed.fields.includes('summaries')) payload.google_summary = summary;
    if (parsed.fields.includes('hours')) {
      payload.practical_info = mergePracticalInfoWithGoogleHours(
        current.practical_info,
        details.hours,
      ) as Json;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tourism_guides')
      .update(payload)
      .eq('id', parsed.guideId)
      .eq('city_id', city.id);
    if (error) throw error;

    await insertAudit('tourism.guide.google_import.apply', city.id, 'tourism_guide', parsed.guideId, {
      place_id: parsed.placeId,
      fields: parsed.fields,
      photos_count: selectedPhotos.length,
      reviews_count: parsed.reviews.length,
    });
    revalidatePath('/painel/cidade/turismo/guias');
    revalidatePath(`/painel/cidade/turismo/guias/${parsed.guideId}`);
    revalidatePath('/turismo/guias');
    revalidatePath(`/turismo/guias/${current.slug}`);
    return { ok: true, applied: { fields: parsed.fields.length, photos: selectedPhotos.length } };
  } catch (caught) {
    console.error('[google-import][guide] failed', caught);
    return { ok: false, error: getErrorMessage(caught, 'Falha ao aplicar importação.') };
  }
}

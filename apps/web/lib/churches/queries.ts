import 'server-only';

import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { publicCached } from '@/lib/cache/public-query';
import { churches, churchSchedule, weekdayOrder } from './mock';
import type { Church, ChurchPhoto, ChurchReview, ChurchScheduleItem, WeekdayKey } from './types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_CHURCHES === 'true';

const weekdayByNumber: Record<number, WeekdayKey> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado',
};

const weekdayNumberByKey: Record<WeekdayKey, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

type ChurchRow = {
  id: string;
  slug: string;
  name: string;
  tradition: Church['tradition'];
  address: string | null;
  google_maps_url: string | null;
  cover_url: string | null;
  logo_url: string | null;
  pastor_name: string | null;
  phone: string | null;
  instagram: string | null;
  short_description: string | null;
  claimed: boolean | null;
  featured: boolean | null;
  og_image_url: string | null;
  og_square_image_url: string | null;
  import_source: unknown;
  districts?: { name: string | null } | null;
  church_reviews?: Array<{
    rating: number;
    status: string | null;
  }> | null;
};

type ChurchScheduleRow = {
  id: string;
  churches?: { slug: string | null } | null;
  weekday: number;
  starts_at: string;
  title: string;
  note: string | null;
  source_status: ChurchScheduleItem['sourceStatus'];
};

type ChurchMediaLinkRow = {
  role: string;
  position: number | null;
  is_primary: boolean | null;
  media_assets: {
    cdn_url: string | null;
    alt_text: string | null;
    content_type: string | null;
  } | null;
};

function byTime(a: ChurchScheduleItem, b: ChurchScheduleItem) {
  return a.time.localeCompare(b.time);
}

function sortMockSchedule(items: ChurchScheduleItem[]) {
  return [...items].sort((a, b) => {
    const weekdayDiff = weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday);
    return weekdayDiff || byTime(a, b);
  });
}

function shouldFallbackToMock(error: unknown): boolean {
  if (USE_MOCK) return true;
  if (process.env.NODE_ENV === 'production') return false;
  return Boolean(error);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function googlePhotosFromImportSource(slug: string, importSource: unknown): ChurchPhoto[] {
  const source = asRecord(importSource);
  const google = asRecord(source?.google_places);
  if (!google) return [];

  const pending = Array.isArray(google.pending_photos) ? google.pending_photos : [];
  const imported = Array.isArray(google.imported_photos) ? google.imported_photos : [];
  const approvedNames = Array.isArray(google.approved_photos)
    ? google.approved_photos.filter((item): item is string => typeof item === 'string')
    : [];
  const photoRecords = [...pending, ...imported]
    .map(asRecord)
    .filter((item): item is Record<string, unknown> => Boolean(item));

  return approvedNames
    .map((name) => {
      const record = photoRecords.find((item) => item.name === name);
      if (record && typeof record.cdn_url === 'string') {
        return {
          src: record.cdn_url,
          attribution: typeof record.attribution === 'string' ? record.attribution : null,
        };
      }

      return {
        src: `/api/church-google-photo?slug=${encodeURIComponent(slug)}&name=${encodeURIComponent(name)}&w=900`,
        attribution: record && typeof record.attribution === 'string' ? record.attribution : null,
      };
    })
    .filter((photo, index, all) => all.findIndex((item) => item.src === photo.src) === index);
}

function toChurch(row: ChurchRow): Church {
  const publishedReviews = (row.church_reviews ?? []).filter(
    (review) => review.status === 'published',
  );
  const rating =
    publishedReviews.length > 0
      ? publishedReviews.reduce((sum, review) => sum + review.rating, 0) / publishedReviews.length
      : undefined;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tradition: row.tradition,
    neighborhood: row.districts?.name ?? null,
    address: row.address,
    googleMapsUrl: row.google_maps_url,
    coverUrl: row.cover_url,
    logoUrl: row.logo_url,
    photos: googlePhotosFromImportSource(row.slug, row.import_source),
    pastorName: row.pastor_name,
    phone: row.phone,
    instagram: row.instagram,
    shortDescription: row.short_description ?? '',
    claimed: row.claimed ?? false,
    featured: row.featured ?? false,
    rating,
    reviewsCount: publishedReviews.length || undefined,
    ogImageUrl: row.og_image_url ?? undefined,
    ogSquareImageUrl: row.og_square_image_url ?? undefined,
  };
}

function toChurchMediaPhoto(row: ChurchMediaLinkRow): ChurchPhoto | null {
  const url = row.media_assets?.cdn_url;
  if (!url) return null;
  return {
    src: url,
    attribution: row.media_assets?.alt_text ?? null,
    contentType: row.media_assets?.content_type ?? null,
  };
}

async function listChurchMediaPhotos(churchId: string, cityId: string): Promise<ChurchPhoto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('media_links')
    .select('role, position, is_primary, media_assets(cdn_url, alt_text, content_type)')
    .eq('city_id', cityId)
    .eq('entity_type', 'church')
    .eq('entity_id', churchId)
    .in('role', ['cover', 'gallery'])
    .order('is_primary', { ascending: false })
    .order('position', { ascending: true });

  if (error) return [];

  return ((data ?? []) as unknown as ChurchMediaLinkRow[])
    .map(toChurchMediaPhoto)
    .filter((item): item is ChurchPhoto => Boolean(item));
}

function toScheduleItem(row: ChurchScheduleRow): ChurchScheduleItem {
  return {
    id: row.id,
    churchSlug: row.churches?.slug ?? '',
    weekday: weekdayByNumber[row.weekday] ?? 'domingo',
    time: row.starts_at.slice(0, 5),
    title: row.title,
    note: row.note,
    sourceStatus: row.source_status,
  };
}

async function getCityId(): Promise<string | null> {
  const city = await getCurrentCity();
  return city?.id ?? null;
}

function listChurchesCached(cityId: string) {
  return publicCached(
    {
      key: 'churches:list',
      tags: ['churches', `churches:${cityId}`],
      parts: [cityId],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('churches')
        .select(
          'id, slug, name, tradition, address, google_maps_url, cover_url, logo_url, import_source, pastor_name, phone, instagram, short_description, claimed, featured, og_image_url, og_square_image_url, districts(name), church_reviews(rating, status)',
        )
        .eq('city_id', cityId)
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return ((data ?? []) as unknown as ChurchRow[]).map(toChurch);
    },
  );
}

export async function listChurches(): Promise<Church[]> {
  if (USE_MOCK) {
    return [...churches].sort(
      (a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name),
    );
  }

  const cityId = await getCityId();
  if (!cityId) return [];

  try {
    return await listChurchesCached(cityId);
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      return [...churches].sort(
        (a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name),
      );
    }
    throw error;
  }
}

export async function getChurchBySlug(slug: string): Promise<Church | null> {
  if (USE_MOCK) {
    return churches.find((church) => church.slug === slug) ?? null;
  }

  const cityId = await getCityId();
  if (!cityId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('churches')
    .select(
      'id, slug, name, tradition, address, google_maps_url, cover_url, logo_url, import_source, pastor_name, phone, instagram, short_description, claimed, featured, og_image_url, og_square_image_url, districts(name), church_reviews(rating, status)',
    )
    .eq('city_id', cityId)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    if (shouldFallbackToMock(error)) {
      return churches.find((church) => church.slug === slug) ?? null;
    }

    throw error;
  }

  if (!data) return null;

  const church = toChurch(data as unknown as ChurchRow);
  const linkedPhotos = await listChurchMediaPhotos(church.id, cityId);
  const allPhotos = [...linkedPhotos, ...(church.photos ?? [])];
  church.photos = allPhotos.filter(
    (photo, index, all) => all.findIndex((item) => item.src === photo.src) === index,
  );
  return church;
}

export async function listChurchReviews(churchId: string): Promise<ChurchReview[]> {
  const cityId = await getCityId();
  if (!cityId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('church_reviews')
    .select(
      'id, church_id, rating, title, comment, reply_owner, reply_at, created_at, profiles(full_name)',
    )
    .eq('city_id', cityId)
    .eq('church_id', churchId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data ?? []).map((review) => ({
    id: review.id,
    churchId: review.church_id,
    authorName: (review.profiles as { full_name?: string | null } | null)?.full_name ?? undefined,
    rating: review.rating,
    title: review.title ?? undefined,
    comment: review.comment ?? undefined,
    replyOwner: review.reply_owner ?? undefined,
    replyAt: review.reply_at ?? undefined,
    createdAt: review.created_at ?? undefined,
  }));
}

function listChurchScheduleCached(cityId: string) {
  return publicCached(
    {
      key: 'churches:schedule',
      tags: ['churches', `churches:${cityId}`],
      parts: [cityId],
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from('church_schedule_items')
        .select('id, weekday, starts_at, title, note, source_status, churches(slug)')
        .eq('city_id', cityId)
        .eq('active', true)
        .order('weekday', { ascending: true })
        .order('starts_at', { ascending: true });

      if (error) throw error;
      return ((data ?? []) as unknown as ChurchScheduleRow[]).map(toScheduleItem);
    },
  );
}

export async function listChurchSchedule(): Promise<ChurchScheduleItem[]> {
  if (USE_MOCK) {
    return sortMockSchedule(churchSchedule);
  }

  const cityId = await getCityId();
  if (!cityId) return [];

  try {
    return await listChurchScheduleCached(cityId);
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      return sortMockSchedule(churchSchedule);
    }
    throw error;
  }
}

export async function listScheduleByChurchSlug(slug: string): Promise<ChurchScheduleItem[]> {
  if (USE_MOCK) {
    return churchSchedule.filter((item) => item.churchSlug === slug).sort(byTime);
  }

  const cityId = await getCityId();
  if (!cityId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('church_schedule_items')
    .select('id, weekday, starts_at, title, note, source_status, churches!inner(slug)')
    .eq('city_id', cityId)
    .eq('active', true)
    .eq('churches.slug', slug)
    .order('starts_at', { ascending: true });

  if (error) {
    if (shouldFallbackToMock(error)) {
      return churchSchedule.filter((item) => item.churchSlug === slug).sort(byTime);
    }

    throw error;
  }

  return ((data ?? []) as unknown as ChurchScheduleRow[]).map(toScheduleItem).sort(byTime);
}

export async function listScheduleByWeekday(weekday: WeekdayKey): Promise<ChurchScheduleItem[]> {
  if (USE_MOCK) {
    return churchSchedule.filter((item) => item.weekday === weekday).sort(byTime);
  }

  const cityId = await getCityId();
  if (!cityId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('church_schedule_items')
    .select('id, weekday, starts_at, title, note, source_status, churches(slug)')
    .eq('city_id', cityId)
    .eq('active', true)
    .eq('weekday', weekdayNumberByKey[weekday])
    .order('starts_at', { ascending: true });

  if (error) {
    if (shouldFallbackToMock(error)) {
      return churchSchedule.filter((item) => item.weekday === weekday).sort(byTime);
    }

    throw error;
  }

  return ((data ?? []) as unknown as ChurchScheduleRow[]).map(toScheduleItem).sort(byTime);
}

export function getChurchNameBySlug(slug: string): string {
  return churches.find((church) => church.slug === slug)?.name ?? 'Igreja';
}

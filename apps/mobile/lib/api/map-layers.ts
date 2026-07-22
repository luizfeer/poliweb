import { getBusinessRating } from '@/lib/businesses/business-rating';
import {
  categorySlugsFromAssignments,
  hasPousadaCategory,
} from '@/lib/businesses/pousadas-category';
import { env } from '@/lib/env';
import {
  asStringArray,
  firstImage,
  resolveAttractionCover,
  resolveAttractionPhotos,
} from '@/lib/media/cover-image';
import { attractionKindLabel } from '@/lib/tourism/attraction-kind';
import { supabase } from '@/lib/supabase';

export type MapPinKind = 'pousada' | 'comercio' | 'atracao';

export type MapPin = {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  coverUrl: string | null;
  photoUrls: string[];
  subtitle: string | null;
  description: string | null;
  metaLabel: string | null;
  categoryLabel: string | null;
  kind: MapPinKind;
  rating: number | null;
  reviewsCount: number | null;
  featured: boolean;
  hasWhatsapp: boolean;
};

export type MapLayersPayload = {
  city: {
    id: string;
    slug: string;
    name: string;
    lat: number;
    lng: number;
  } | null;
  pins: MapPin[];
};

const EMPTY: MapLayersPayload = { city: null, pins: [] };
const DEFAULT_CENTER = { lat: -20.9719, lng: -46.1189 };

type CityRow = {
  id: string;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
};

type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
  cover_url: string | null;
  logo_url: string | null;
  photos: unknown;
  import_source: unknown;
  featured: boolean | null;
  whatsapp: string | null;
  districts: { name: string | null } | null;
  business_category_assignments:
    | Array<{
        is_primary: boolean | null;
        business_categories: { slug: string; name: string } | null;
      }>
    | null;
  business_reviews:
    | { rating: number | null; status: string | null }[]
    | null;
};

type AttractionRow = {
  id: string;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
  cover_url: string | null;
  photos: unknown;
  google_photos: unknown;
  og_image_url: string | null;
  og_square_image_url: string | null;
  description: string | null;
  google_summary: string | null;
  type: string | null;
  rating: number | null;
  reviews_count: number | null;
  featured: boolean | null;
};

function uniqueStrings(values: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function hasCoords<T extends { lat: number | null; lng: number | null }>(
  row: T,
): row is T & { lat: number; lng: number } {
  return (
    typeof row.lat === 'number' &&
    typeof row.lng === 'number' &&
    Number.isFinite(row.lat) &&
    Number.isFinite(row.lng)
  );
}

export type FetchMapLayersOptions = {
  /** Quando informado e layers inclui `comercio`, só retorna comércios cujo `business_category_assignments` tem este slug (top-level ou child). */
  businessCategorySlug?: string;
};

/**
 * Busca pousadas + comércios + atrações direto do Supabase, sem passar pela API web.
 * RLS garante que só registros publicados/visíveis voltam.
 */
export async function fetchMapLayers(
  citySlug = env.defaultCitySlug,
  layers: MapPinKind[] = ['pousada', 'comercio', 'atracao'],
  options: FetchMapLayersOptions = {},
): Promise<MapLayersPayload> {
  try {
    const { data: city, error: cityErr } = await supabase
      .from('cities')
      .select('id, slug, name, lat, lng')
      .eq('slug', citySlug)
      .maybeSingle<CityRow>();

    if (cityErr || !city) {
      if (__DEV__) console.warn('[fetchMapLayers] cidade não encontrada', citySlug, cityErr);
      return EMPTY;
    }

    const want = new Set(layers);
    const tasks: Promise<MapPin[]>[] = [];

    if (want.has('pousada') || want.has('comercio')) {
      tasks.push(
        fetchBusinessPins(city.id, {
          includePousadas: want.has('pousada'),
          includeComercios: want.has('comercio'),
          businessCategorySlug: options.businessCategorySlug,
        }),
      );
    }

    if (want.has('atracao')) {
      tasks.push(fetchAttractionPins(city.id));
    }

    const results = await Promise.all(tasks);
    const pins = results.flat();

    return {
      city: {
        id: city.id,
        slug: city.slug,
        name: city.name,
        lat: city.lat ?? DEFAULT_CENTER.lat,
        lng: city.lng ?? DEFAULT_CENTER.lng,
      },
      pins,
    };
  } catch (error) {
    if (__DEV__) console.warn('[fetchMapLayers] falha', error);
    return EMPTY;
  }
}

async function fetchBusinessPins(
  cityId: string,
  opts: {
    includePousadas: boolean;
    includeComercios: boolean;
    businessCategorySlug?: string;
  },
): Promise<MapPin[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select(
      'id, slug, name, lat, lng, cover_url, logo_url, photos, import_source, featured, whatsapp, districts(name), business_category_assignments(is_primary, business_categories(slug, name)), business_reviews(rating, status)',
    )
    .eq('city_id', cityId)
    .eq('status', 'published')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('featured', { ascending: false })
    .limit(400);

  if (error || !data) {
    if (__DEV__) console.warn('[fetchBusinessPins] erro', error);
    return [];
  }

  const pins: MapPin[] = [];
  for (const row of data as unknown as BusinessRow[]) {
    if (!hasCoords(row)) continue;
    const slugs = categorySlugsFromAssignments(row.business_category_assignments);
    const isPousada = hasPousadaCategory(slugs);
    if (isPousada && !opts.includePousadas) continue;
    if (!isPousada && !opts.includeComercios) continue;

    if (opts.businessCategorySlug && !isPousada) {
      const matches = slugs.includes(opts.businessCategorySlug);
      if (!matches) continue;
    }

    const assignments = [...(row.business_category_assignments ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary),
    );
    const categoryName = assignments[0]?.business_categories?.name ?? null;
    const scores = getBusinessRating(row);

    pins.push({
      id: `${isPousada ? 'pousada' : 'comercio'}:${row.id}`,
      slug: row.slug,
      name: row.name,
      lat: row.lat,
      lng: row.lng,
      coverUrl: firstImage([row.cover_url, row.logo_url, ...asStringArray(row.photos)]) ?? null,
      photoUrls: uniqueStrings([
        row.cover_url,
        row.logo_url,
        ...asStringArray(row.photos),
      ]),
      subtitle: row.districts?.name ?? null,
      description: null,
      metaLabel: null,
      categoryLabel: isPousada ? 'Pousada' : categoryName,
      kind: isPousada ? 'pousada' : 'comercio',
      rating: scores.rating,
      reviewsCount: scores.reviewsCount,
      featured: row.featured ?? false,
      hasWhatsapp: !!row.whatsapp,
    });
  }
  return pins;
}

async function fetchAttractionPins(cityId: string): Promise<MapPin[]> {
  const { data, error } = await supabase
    .from('attractions')
    .select(
      'id, slug, name, type, lat, lng, cover_url, photos, google_photos, og_image_url, og_square_image_url, description, google_summary, rating, reviews_count, featured',
    )
    .eq('city_id', cityId)
    .eq('status', 'published')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('featured', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(200);

  if (error || !data) {
    if (__DEV__) console.warn('[fetchAttractionPins] erro', error);
    return [];
  }

  const pins: MapPin[] = [];
  for (const row of data as unknown as AttractionRow[]) {
    if (!hasCoords(row)) continue;
    const photoUrls = resolveAttractionPhotos(row);
    pins.push({
      id: `atracao:${row.id}`,
      slug: row.slug,
      name: row.name,
      lat: row.lat,
      lng: row.lng,
      coverUrl: photoUrls[0] ?? null,
      photoUrls,
      subtitle: attractionKindLabel(row.type),
      description: row.description ?? row.google_summary ?? null,
      metaLabel: attractionKindLabel(row.type),
      categoryLabel: null,
      kind: 'atracao',
      rating: row.rating,
      reviewsCount: row.reviews_count,
      featured: row.featured ?? false,
      hasWhatsapp: false,
    });
  }
  return pins;
}

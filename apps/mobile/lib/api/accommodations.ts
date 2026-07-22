import {
  categorySlugsFromAssignments,
  hasPousadaCategory,
} from '@/lib/businesses/pousadas-category';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export type AccommodationItem = {
  id: string;
  slug: string;
  name: string;
  district: string | null;
  subtitle: string;
  lat: number | null;
  lng: number | null;
  coverUrl: string | null;
  rating: number | null;
  reviewsCount: number | null;
  featured: boolean;
  priceLabel: string;
};

export type AccommodationsPayload = {
  city: {
    id: string;
    slug: string;
    name: string;
    lat: number;
    lng: number;
  } | null;
  category: { slug: string; name: string };
  items: AccommodationItem[];
};

const DEFAULT_CENTER = { lat: -20.9719, lng: -46.1189 };
const DEFAULT_CATEGORY = { slug: 'pousadas', name: 'Pousadas' };
const EMPTY: AccommodationsPayload = {
  city: null,
  category: DEFAULT_CATEGORY,
  items: [],
};

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
  featured: boolean | null;
  whatsapp: string | null;
  districts: { name: string | null } | null;
  business_category_assignments:
    | Array<{ business_categories: { slug: string } | null }>
    | null;
};

function cityShape(city: CityRow) {
  return {
    id: city.id,
    slug: city.slug,
    name: city.name,
    lat: city.lat ?? DEFAULT_CENTER.lat,
    lng: city.lng ?? DEFAULT_CENTER.lng,
  };
}

/**
 * Busca hospedagens (categoria 'pousadas') direto do Supabase.
 * Sem passar pela API web — RLS já filtra publicadas/cidade.
 */
export async function fetchAccommodations(
  citySlug = env.defaultCitySlug,
): Promise<AccommodationsPayload> {
  try {
    const { data: city } = await supabase
      .from('cities')
      .select('id, slug, name, lat, lng')
      .eq('slug', citySlug)
      .maybeSingle<CityRow>();

    if (!city) return EMPTY;

    const { data, error } = await supabase
      .from('businesses')
      .select(
        'id, slug, name, lat, lng, cover_url, logo_url, featured, whatsapp, districts(name), business_category_assignments(business_categories(slug))',
      )
      .eq('city_id', city.id)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .limit(200);

    if (error || !data) {
      if (__DEV__) console.warn('[fetchAccommodations] erro', error);
      return { ...EMPTY, city: cityShape(city) };
    }

    const onlyPousadas = (data as unknown as BusinessRow[]).filter((row) =>
      hasPousadaCategory(categorySlugsFromAssignments(row.business_category_assignments)),
    );

    const items = onlyPousadas.map((row): AccommodationItem => {
      const district = row.districts?.name ?? null;

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        district,
        subtitle: district ?? '',
        lat: row.lat,
        lng: row.lng,
        coverUrl: row.cover_url ?? row.logo_url ?? null,
        rating: null,
        reviewsCount: null,
        featured: row.featured ?? false,
        priceLabel: row.whatsapp ? 'Chamar no WhatsApp' : 'Ver detalhes',
      };
    });

    return {
      city: cityShape(city),
      category: DEFAULT_CATEGORY,
      items,
    };
  } catch (error) {
    if (__DEV__) console.warn('[fetchAccommodations] falha', error);
    return EMPTY;
  }
}

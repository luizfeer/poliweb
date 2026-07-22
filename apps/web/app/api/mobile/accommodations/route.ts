import { NextResponse, type NextRequest } from 'next/server';

import { CATEGORY_BY_SLUG, listByCategory } from '@/lib/businesses';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const revalidate = 60;

const DEFAULT_CATEGORY = 'pousadas';
const DEFAULT_CENTER = { lat: -20.9719, lng: -46.1189 };

type CityRow = {
  id: string;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
};

function resolveCategorySlug(value: string | null): string {
  return value && CATEGORY_BY_SLUG[value] ? value : DEFAULT_CATEGORY;
}

function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

export async function GET(request: NextRequest) {
  const citySlug = request.nextUrl.searchParams.get('city') ?? 'carmo-do-rio-claro';
  const categorySlug = resolveCategorySlug(request.nextUrl.searchParams.get('categoria'));
  const q = request.nextUrl.searchParams.get('q') ?? undefined;
  const district = request.nextUrl.searchParams.get('bairro') ?? undefined;
  const sort =
    (request.nextUrl.searchParams.get('sort') as 'rating' | 'name' | 'recent' | 'featured' | null) ??
    'featured';

  const supabase = await createClient();
  const { data: city } = await supabase
    .from('cities')
    .select('id, slug, name, lat, lng')
    .eq('slug', citySlug)
    .maybeSingle<CityRow>();

  if (!city) {
    return NextResponse.json({
      city: null,
      category: { slug: categorySlug, name: CATEGORY_BY_SLUG[categorySlug]?.name ?? 'Pousadas' },
      items: [],
    });
  }

  const businesses = await listByCategory(categorySlug, {
    city_id: city.id,
    q,
    district,
    sort,
    limit: 120,
  }).catch(() => []);

  const category = CATEGORY_BY_SLUG[categorySlug];

  return NextResponse.json({
    city: {
      id: city.id,
      slug: city.slug,
      name: city.name,
      lat: city.lat ?? DEFAULT_CENTER.lat,
      lng: city.lng ?? DEFAULT_CENTER.lng,
    },
    category: {
      slug: categorySlug,
      name: category?.name ?? 'Pousadas',
    },
    items: businesses.map((business) => {
      const ratingLabel = business.rating ? `Nota ${formatRating(business.rating)}` : null;
      const reviewsLabel = business.reviewsCount
        ? `${business.reviewsCount} avaliação${business.reviewsCount > 1 ? 'es' : ''}`
        : null;

      return {
        id: business.id,
        slug: business.slug,
        name: business.name,
        district: business.district ?? null,
        subtitle: [business.district, ratingLabel, reviewsLabel].filter(Boolean).join(' · '),
        lat: business.lat ?? null,
        lng: business.lng ?? null,
        coverUrl: business.coverUrl ?? business.logoUrl ?? null,
        rating: business.rating ?? null,
        reviewsCount: business.reviewsCount ?? null,
        featured: business.featured ?? false,
        priceLabel:
          business.googleImportSource?.priceRange ??
          (business.whatsapp ? 'Chamar no WhatsApp' : 'Ver detalhes'),
      };
    }),
  });
}

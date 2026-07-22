import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/auth';
import {
  CATEGORIES,
  CATEGORY_BY_SLUG,
  listByCategory,
  type Business,
} from '@/lib/businesses';
import {
  AccommodationExplorer,
  type AccommodationExplorerItem,
} from './_components/accommodation-explorer';

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    bairro?: string;
    sort?: string;
    whatsapp?: string;
    categoria?: string;
    visualizacao?: string;
  }>;
};

export const metadata = { title: 'Pousadas - Portal Carmelitano' };

const DEFAULT_CATEGORY = 'pousadas';
const VIEW_MODES = ['dividida', 'lista', 'mapa'] as const;

type ViewMode = (typeof VIEW_MODES)[number];

function resolveCategorySlug(value: string | undefined): string {
  return value && CATEGORY_BY_SLUG[value] ? value : DEFAULT_CATEGORY;
}

function resolveViewMode(value: string | undefined): ViewMode {
  return VIEW_MODES.includes(value as ViewMode) ? (value as ViewMode) : 'dividida';
}

function categoryLabel(business: Business, selectedCategory: string): string {
  const category = CATEGORY_BY_SLUG[selectedCategory];
  const childSlugs = CATEGORIES.filter((item) => item.parent === selectedCategory).map((item) => item.slug);
  const categorySlug =
    business.categories.find((slug) => childSlugs.includes(slug)) ??
    business.categories.find((slug) => slug === selectedCategory) ??
    business.categories.find((slug) => CATEGORY_BY_SLUG[slug]?.parent === category?.parent) ??
    selectedCategory;

  return CATEGORY_BY_SLUG[categorySlug]?.name ?? category?.name ?? 'Categoria';
}

function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

function toExplorerItem(business: Business, selectedCategory: string): AccommodationExplorerItem {
  const kind = categoryLabel(business, selectedCategory);
  const ratingLabel = business.rating ? `Nota ${formatRating(business.rating)}` : null;
  const reviewsLabel = business.reviewsCount
    ? `${business.reviewsCount} avaliação${business.reviewsCount > 1 ? 'es' : ''}`
    : null;

  return {
    id: business.id,
    slug: business.slug,
    href: `/comercio/negocio/${business.slug}`,
    name: business.name,
    kind,
    subtitle: [business.district, ratingLabel, reviewsLabel].filter(Boolean).join(' · '),
    description: business.shortDescription ?? business.description ?? business.address ?? null,
    districtName: business.district ?? null,
    lat: business.lat ?? null,
    lng: business.lng ?? null,
    coverUrl: business.coverUrl ?? business.logoUrl ?? null,
    photos: business.photos ?? [],
    rating: business.rating ?? null,
    reviewsCount: business.reviewsCount ?? null,
    featured: business.featured ?? false,
    verified: business.verified ?? false,
    priceLabel: business.googleImportSource?.priceRange ?? (business.whatsapp ? 'Chamar no WhatsApp' : 'Ver detalhes'),
    markerLabel: business.googleImportSource?.priceRange ?? kind,
  };
}

export default async function OndeFicarPage({ searchParams }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  const supabase = await createClient();
  const [{ data: userData }, auth] = await Promise.all([supabase.auth.getUser(), getProfile()]);
  const authUser = userData.user
    ? {
        email: userData.user.email ?? null,
        name:
          (userData.user.user_metadata?.full_name as string | undefined) ??
          (userData.user.user_metadata?.name as string | undefined) ??
          null,
      }
    : null;
  const params = await searchParams;
  const categorySlug = resolveCategorySlug(params?.categoria);
  const viewMode = resolveViewMode(params?.visualizacao);
  const selectedCategory = CATEGORY_BY_SLUG[categorySlug];
  const businesses = await listByCategory(categorySlug, {
    city_id: city.id,
    q: params?.q,
    district: params?.bairro,
    hasWhatsapp: params?.whatsapp === '1',
    sort: (params?.sort as 'rating' | 'name' | 'recent' | 'featured' | undefined) ?? 'featured',
    limit: 120,
  });
  const favoriteBusinessIds =
    auth && businesses.length > 0
      ? await listFavoriteBusinessIds(
          auth.profile.id,
          businesses.map((business) => business.id),
        )
      : [];
  const items = businesses.map((business) => toExplorerItem(business, categorySlug));
  const categoryOptions = CATEGORIES.map((category) => ({
    slug: category.slug,
    name: category.name,
    parent: category.parent ?? null,
  }));

  return (
    <AccommodationExplorer
      city={{
        name: city.name,
        lat: city.lat,
        lng: city.lng,
      }}
      items={items}
      category={{
        slug: categorySlug,
        name: selectedCategory?.name ?? 'Categoria',
      }}
      categoryOptions={categoryOptions}
      viewMode={viewMode}
      user={authUser}
      favoriteBusinessIds={favoriteBusinessIds}
    />
  );
}

async function listFavoriteBusinessIds(profileId: string, businessIds: string[]): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('business_favorites')
    .select('business_id')
    .eq('profile_id', profileId)
    .in('business_id', businessIds);

  if (error) return [];
  return (data ?? []).map((row) => row.business_id);
}

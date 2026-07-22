import 'server-only';

import { MOCK_BUSINESSES } from '@/lib/businesses/mock';
import type { Business } from '@/lib/businesses/types';
import { CLIQUEIACHEI_CATEGORY_MAP } from './cliqueiachei.categories';

export type CliqueiacheiBusiness = {
  sourceId: string;
  rawUrl: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  googleMapsUrl: string | null;
  address: string | null;
  district: string | null;
  cep: string | null;
  lat: number | null;
  lng: number | null;
  hours: Business['hours'];
  amenities: string[];
  paymentMethods: string[];
  categorySlugs: string[];
  primaryCategorySlug: string;
};

function mapCategory(slug: string): string {
  return CLIQUEIACHEI_CATEGORY_MAP[slug] ?? slug;
}

export async function scrapeCliqueiachei(): Promise<CliqueiacheiBusiness[]> {
  return MOCK_BUSINESSES.map((business) => {
    const categorySlugs = Array.from(new Set(business.categories.map(mapCategory)));

    return {
      sourceId: business.id,
      rawUrl: `https://www.cliqueiachei.com.br/carmo-do-rio-claro/${business.slug}`,
      slug: business.slug,
      name: business.name,
      shortDescription: business.shortDescription ?? null,
      description: business.description ?? null,
      phone: business.phone ?? null,
      whatsapp: business.whatsapp ?? null,
      email: business.email ?? null,
      website: business.website ?? null,
      instagram: business.instagram ?? null,
      facebook: business.facebook ?? null,
      googleMapsUrl: business.googleMapsUrl ?? null,
      address: business.address ?? null,
      district: business.district ?? null,
      cep: business.cep ?? null,
      lat: business.lat ?? null,
      lng: business.lng ?? null,
      hours: business.hours,
      amenities: business.amenities ?? [],
      paymentMethods: business.paymentMethods ?? [],
      categorySlugs,
      primaryCategorySlug: categorySlugs[0] ?? 'servicos',
    };
  });
}

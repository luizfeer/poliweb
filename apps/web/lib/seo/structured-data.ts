import 'server-only';

import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';

const ADDRESS = {
  '@type': 'PostalAddress',
  addressLocality: 'Carmo do Rio Claro',
  addressRegion: 'MG',
  addressCountry: 'BR',
} as const;

export function organizationJsonLd() {
  const url = resolvePublicSiteOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Portal Carmelitano',
    alternateName: ['Carmo Local', 'Portal de Carmo do Rio Claro'],
    url,
    logo: `${url}/icon.png`,
    areaServed: {
      '@type': 'City',
      name: 'Carmo do Rio Claro',
      address: ADDRESS,
    },
    sameAs: [
      'https://www.instagram.com/portalcarmelitano',
      'https://www.facebook.com/portalcarmelitano',
    ],
  };
}

export function websiteJsonLd() {
  const url = resolvePublicSiteOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Portal Carmelitano',
    url,
    inLanguage: 'pt-BR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/buscar?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function localBusinessJsonLd(input: {
  name: string;
  url: string;
  description?: string | null;
  telephone?: string | null;
  image?: string | null;
  priceRange?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: input.name,
    url: input.url,
    description: input.description ?? undefined,
    telephone: input.telephone ?? undefined,
    image: input.image ?? undefined,
    priceRange: input.priceRange ?? undefined,
    address: ADDRESS,
  };
}

export function realEstateAgencyJsonLd(input: {
  name: string;
  url: string;
  description?: string | null;
  telephone?: string | null;
  image?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: input.name,
    url: input.url,
    description: input.description ?? undefined,
    telephone: input.telephone ?? undefined,
    image: input.image ?? undefined,
    address: ADDRESS,
  };
}

export function lodgingBusinessJsonLd(input: {
  name: string;
  url: string;
  description?: string | null;
  image?: string | null;
  priceRange?: string | null;
  telephone?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: input.name,
    url: input.url,
    description: input.description ?? undefined,
    image: input.image ?? undefined,
    priceRange: input.priceRange ?? undefined,
    telephone: input.telephone ?? undefined,
    address: ADDRESS,
  };
}

export function restaurantJsonLd(input: {
  name: string;
  url: string;
  description?: string | null;
  image?: string | null;
  priceRange?: string | null;
  telephone?: string | null;
  servesCuisine?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: input.name,
    url: input.url,
    description: input.description ?? undefined,
    image: input.image ?? undefined,
    priceRange: input.priceRange ?? undefined,
    telephone: input.telephone ?? undefined,
    servesCuisine: input.servesCuisine ?? undefined,
    address: ADDRESS,
  };
}

export function touristAttractionJsonLd(input: {
  name: string;
  url: string;
  description?: string | null;
  image?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: input.name,
    url: input.url,
    description: input.description ?? undefined,
    image: input.image ?? undefined,
    geo:
      input.latitude && input.longitude
        ? { '@type': 'GeoCoordinates', latitude: input.latitude, longitude: input.longitude }
        : undefined,
    address: ADDRESS,
  };
}

export function touristTripJsonLd(input: {
  name: string;
  url: string;
  description?: string | null;
  image?: string | null;
  price?: number | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: input.name,
    url: input.url,
    description: input.description ?? undefined,
    image: input.image ?? undefined,
    offers: input.price
      ? { '@type': 'Offer', price: input.price, priceCurrency: 'BRL' }
      : undefined,
  };
}

export function eventJsonLd(input: {
  name: string;
  url: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  location?: string | null;
  image?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: input.name,
    url: input.url,
    startDate: input.startDate,
    endDate: input.endDate ?? undefined,
    description: input.description ?? undefined,
    image: input.image ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: input.location
      ? { '@type': 'Place', name: input.location, address: ADDRESS }
      : { '@type': 'Place', name: 'Carmo do Rio Claro', address: ADDRESS },
  };
}

export function realEstateListingJsonLd(input: {
  name: string;
  url: string;
  description?: string | null;
  price?: number | null;
  image?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: input.name,
    url: input.url,
    description: input.description ?? undefined,
    image: input.image ?? undefined,
    offers: input.price
      ? { '@type': 'Offer', price: input.price, priceCurrency: 'BRL' }
      : undefined,
  };
}

export function articleJsonLd(input: {
  headline: string;
  url: string;
  datePublished?: string | null;
  description?: string | null;
  image?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    url: input.url,
    datePublished: input.datePublished ?? undefined,
    description: input.description ?? undefined,
    image: input.image ?? undefined,
  };
}

import 'server-only';

import { getBusinessSearchFields, listBusinesses } from '@/lib/businesses/queries';
import { listClassifiedsByType } from '@/lib/classifieds/queries';
import { listEvents } from '@/lib/community/queries';
import { listProperties } from '@/lib/real-estate/queries';
import {
  listAccommodations,
  listAttractions,
  listFishingGuides,
  listGuides,
  listRestaurants,
  listTourPackages,
} from '@/lib/tourism/queries';
import { listEmergencyContacts, listHealthFacilities } from '@/lib/utilities/queries';
import type { SearchEntityType, SearchHit } from './types';
import {
  haystackMatchesSearchQuery,
  normalizeForSearch,
  scoreSearchMatch,
} from './query-tokens';
import { databaseSitePageSearch, sitePageSearch } from './site-pages';

export async function fulltextSearch(
  query: string,
  cityId: string,
  options: { limit?: number; types?: SearchEntityType[] } = {},
): Promise<SearchHit[]> {
  const normalized = normalizeForSearch(query);
  if (normalized.length < 2) return [];
  const enabled = new Set(options.types ?? defaultTypes);
  const limit = options.limit ?? 20;
  const sitePages = enabled.has('site_page')
    ? mergeUniqueSitePages([
        ...(await databaseSitePageSearch(query, cityId, limit)),
        ...sitePageSearch(query, limit),
      ], limit)
    : [];

  const [
    businesses,
    accommodations,
    restaurants,
    tourismGuides,
    fishingGuides,
    events,
    classifieds,
    properties,
    attractions,
    tourPackages,
    emergencyContacts,
    healthFacilities,
  ] = await Promise.all([
    enabled.has('business') ? listBusinesses({ city_id: cityId, q: query, limit }) : [],
    enabled.has('accommodation') ? listAccommodations({ city_id: cityId, limit }) : [],
    enabled.has('restaurant') ? listRestaurants({ city_id: cityId, limit }) : [],
    enabled.has('tourism_guide') ? listGuides({ city_id: cityId, limit }) : [],
    enabled.has('fishing_guide') ? listFishingGuides({ city_id: cityId, limit }) : [],
    enabled.has('event') ? listEvents({ city_id: cityId, q: query, when: 'all', limit }) : [],
    enabled.has('classified') ? listClassifiedsByType({ cityId, q: query, limit }) : [],
    enabled.has('property') ? listProperties({ cityId, q: query, limit }) : [],
    enabled.has('attraction') ? listAttractions({ city_id: cityId, limit }) : [],
    enabled.has('tour_package') ? listTourPackages({ city_id: cityId, limit }) : [],
    enabled.has('emergency_contact') ? listEmergencyContacts({ city_id: cityId }) : [],
    enabled.has('health_facility') ? listHealthFacilities({ city_id: cityId }) : [],
  ]);

  const hits: SearchHit[] = [
    ...businesses.map((item) => ({
      entityType: 'business' as const,
      entityId: item.id,
      score: score(normalized, getBusinessSearchFields(item)),
      title: item.name,
      subtitle: item.shortDescription ?? item.district ?? null,
      description: item.description ?? item.shortDescription ?? null,
      url: `/comercio/negocio/${item.slug}`,
      coverUrl: item.coverUrl ?? item.logoUrl ?? null,
      phone: item.phone ?? null,
      whatsapp: item.whatsapp ?? null,
      source: 'fulltext' as const,
    })),
    ...accommodations
      .filter((item) =>
        matchesFields(normalized, [item.name, item.shortDescription, item.description, item.address]),
      )
      .map((item) => ({
        entityType: 'accommodation' as const,
        entityId: item.id,
        score: score(normalized, [item.name, item.shortDescription, item.description, item.address]),
        title: item.name,
        subtitle: item.shortDescription ?? item.type,
        description: item.description,
        url: `/turismo/onde-ficar/${item.slug}`,
        coverUrl: item.coverUrl,
        source: 'fulltext' as const,
      })),
    ...restaurants
      .filter((item) =>
        matchesFields(normalized, [item.name, item.description, item.address, ...item.cuisine]),
      )
      .map((item) => ({
        entityType: 'restaurant' as const,
        entityId: item.id,
        score: score(normalized, [item.name, item.description, item.address, ...item.cuisine]),
        title: item.name,
        subtitle: item.address,
        description: item.description,
        url: '/turismo/onde-comer',
        coverUrl: item.coverUrl,
        source: 'fulltext' as const,
      })),
    ...tourismGuides
      .filter((item) =>
        matchesFields(normalized, [item.name, item.tagline, item.description, ...item.aliases]),
      )
      .map((item) => ({
        entityType: 'tourism_guide' as const,
        entityId: item.id,
        score: score(normalized, [item.name, item.tagline, item.description, ...item.aliases]),
        title: item.name,
        subtitle: item.tagline,
        description: item.description,
        url: `/turismo/guias/${item.slug}`,
        coverUrl: item.coverUrl,
        source: 'fulltext' as const,
      })),
    ...fishingGuides
      .filter((item) => matchesFields(normalized, [item.fullName, item.about, ...item.services]))
      .map((item) => ({
        entityType: 'fishing_guide' as const,
        entityId: item.id,
        score: score(normalized, [item.fullName, item.about, ...item.services]),
        title: item.fullName,
        subtitle: item.priceRange,
        description: item.about,
        url: `/turismo/pesca/guias/${item.slug}`,
        coverUrl: item.photoUrl,
        source: 'fulltext' as const,
      })),
    ...events.map((item) => ({
      entityType: 'event' as const,
      entityId: item.id,
      score: score(normalized, [item.title, item.description, item.location, item.address, item.categoryName]),
      title: item.title,
      subtitle: item.location ?? item.categoryName,
      description: item.description,
      url: `/comunidade/agenda/${item.slug}`,
      coverUrl: item.coverUrl,
      source: 'fulltext' as const,
    })),
    ...classifieds.map((item) => ({
      entityType: 'classified' as const,
      entityId: item.id,
      score: score(normalized, [item.title, item.description, item.categoryLabel, item.type]),
      title: item.title,
      subtitle: item.categoryLabel ?? item.type,
      description: item.description,
      url: classifiedUrl(item.type, item.slug),
      coverUrl: item.coverUrl,
      source: 'fulltext' as const,
    })),
    ...properties.map((item) => ({
      entityType: 'property' as const,
      entityId: item.id,
      score: score(normalized, [item.title, item.description, item.districtName, item.propertyType]),
      title: item.title,
      subtitle: item.districtName ?? item.propertyType,
      description: item.description,
      url: `/imoveis/${item.slug}`,
      coverUrl: item.coverUrl,
      source: 'fulltext' as const,
    })),
    ...attractions
      .filter((item) =>
        matchesFields(normalized, [item.name, item.description, item.address, item.type]),
      )
      .map((item) => ({
        entityType: 'attraction' as const,
        entityId: item.id,
        score: score(normalized, [item.name, item.description, item.address, item.type]),
        title: item.name,
        subtitle: item.address ?? item.type,
        description: item.description,
        url: `/turismo/o-que-fazer/${item.slug}`,
        coverUrl: item.coverUrl,
        source: 'fulltext' as const,
      })),
    ...tourPackages
      .filter((item) =>
        matchesFields(normalized, [item.title, item.description, ...item.includes]),
      )
      .map((item) => ({
        entityType: 'tour_package' as const,
        entityId: item.id,
        score: score(normalized, [item.title, item.description, ...item.includes]),
        title: item.title,
        subtitle: 'Pacote turístico',
        description: item.description,
        url: '/turismo/pacotes',
        coverUrl: item.coverUrl,
        source: 'fulltext' as const,
      })),
    ...emergencyContacts
      .filter((item) =>
        matchesFields(normalized, [
          item.name,
          item.category,
          item.description,
          item.whenToUse,
          item.address,
          item.email,
          item.phone,
          item.shortDial,
          item.sourceType,
          ...item.tags,
        ]),
      )
      .map((item) => ({
        entityType: 'emergency_contact' as const,
        entityId: item.id,
        score: score(normalized, [
          item.name,
          item.category,
          item.description,
          item.whenToUse,
          item.address,
          item.email,
          item.phone,
          item.shortDial,
          ...item.tags,
        ]),
        title: item.name,
        subtitle: item.phone,
        description: item.whenToUse ?? item.description,
        url: '/servicos/telefones',
        coverUrl: null,
        phone: item.phone,
        whatsapp: item.whatsapp,
        source: 'fulltext' as const,
      })),
    ...healthFacilities
      .filter((item) =>
        matchesFields(normalized, [
          item.name,
          item.type,
          item.neighborhood,
          item.address,
          item.phone,
          item.secondaryPhone,
          item.hoursLegacyText,
          ...item.services,
          ...item.requirements,
          ...item.tags,
        ]),
      )
      .map((item) => ({
        entityType: 'health_facility' as const,
        entityId: item.id,
        score: score(normalized, [
          item.name,
          item.type,
          item.neighborhood,
          item.address,
          item.phone,
          item.secondaryPhone,
          item.hoursLegacyText,
          ...item.services,
          ...item.requirements,
          ...item.tags,
        ]),
        title: item.name,
        subtitle: item.phone ?? item.secondaryPhone ?? item.neighborhood,
        description: item.hoursLegacyText ?? item.services.slice(0, 3).join(', '),
        url: '/servicos/saude',
        coverUrl: null,
        phone: item.phone ?? item.secondaryPhone,
        whatsapp: item.whatsapp,
        source: 'fulltext' as const,
      })),
    ...sitePages,
  ];

  return hits
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function mergeUniqueSitePages(hits: SearchHit[], limit: number): SearchHit[] {
  const seen = new Set<string>();
  return hits
    .filter((hit) => {
      const key = hit.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

const defaultTypes: SearchEntityType[] = [
  'business',
  'accommodation',
  'restaurant',
  'tourism_guide',
  'fishing_guide',
  'event',
  'classified',
  'property',
  'attraction',
  'tour_package',
  'emergency_contact',
  'health_facility',
  'site_page',
];

function classifiedUrl(type: string, slug: string): string {
  if (type === 'vehicle') return `/classificados/veiculos/${slug}`;
  if (type === 'job') return `/classificados/vagas/${slug}`;
  if (type === 'service') return `/classificados/servicos/${slug}`;
  if (type === 'item') return `/classificados/itens/${slug}`;
  return '/classificados';
}

function matchesFields(normalizedQuery: string, values: Array<string | null | undefined>): boolean {
  const haystack = normalizeForSearch(values.filter(Boolean).join(' '));
  return haystackMatchesSearchQuery(haystack, normalizedQuery);
}

function score(normalizedQuery: string, values: Array<string | null | undefined>): number {
  const haystack = normalizeForSearch(values.filter(Boolean).join(' '));
  return scoreSearchMatch(normalizedQuery, haystack);
}

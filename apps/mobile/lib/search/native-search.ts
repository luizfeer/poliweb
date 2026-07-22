import type { SearchEntityType } from '@/lib/chat/types';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { mobileDebug } from '@/lib/debug';

import {
  haystackMatchesSearchQuery,
  normalizeForSearch,
  sanitizeIlikeTerm,
  scoreSearchMatch,
  searchTermsForBroadIlike,
} from './query-tokens';
import { fetchSemanticHits } from './semantic-api';
import { searchSitePages, type LocalSearchHit } from './site-pages';

export type { LocalSearchHit as SearchHitResult };

export type SearchSuggestion = {
  title: string;
  subtitle: string | null;
  href: string;
  entityType: SearchEntityType;
  coverUrl: string | null;
};

export type SearchPayload = {
  hits: LocalSearchHit[];
  latencyMs: number;
  usedSemantic: boolean;
  city: { id: string; slug: string; name: string } | null;
};

const DEFAULT_TYPES: SearchEntityType[] = [
  'business',
  'accommodation',
  'restaurant',
  'event',
  'classified',
  'property',
  'attraction',
  'site_page',
];

function matchesAndScore(
  query: string,
  values: Array<string | null | undefined>,
): number {
  const normalized = normalizeForSearch(query);
  const haystack = normalizeForSearch(values.filter(Boolean).join(' '));
  if (!haystackMatchesSearchQuery(haystack, normalized)) return 0;
  return scoreSearchMatch(normalized, haystack);
}

function applyBroadIlike<T extends { or: (filters: string) => T }>(
  query: T,
  fields: string[],
  q: string,
): T {
  const terms = searchTermsForBroadIlike(q).map(sanitizeIlikeTerm).filter((t) => t.length >= 2);
  if (terms.length === 0) return query;

  if (terms.length === 1) {
    const t = terms[0];
    return query.or(fields.map((f) => `${f}.ilike.%${t}%`).join(','));
  }

  const ors = terms.flatMap((t) => fields.map((f) => `${f}.ilike.%${t}%`));
  return query.or(ors.join(','));
}

async function resolveCity(citySlug: string) {
  const { data } = await supabase
    .from('cities')
    .select('id, slug, name')
    .eq('slug', citySlug)
    .maybeSingle<{ id: string; slug: string; name: string }>();
  return data;
}

function firstImage(values: (string | null | undefined)[]): string | null {
  return values.find((v): v is string => typeof v === 'string' && v.length > 0) ?? null;
}

function asRows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

function districtName(value: { name: string | null } | { name: string | null }[] | null): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value.name;
}

async function searchBusinesses(cityId: string, q: string, limit: number): Promise<LocalSearchHit[]> {
  let query = supabase
    .from('businesses')
    .select(
      'id, slug, name, short_description, description, cover_url, logo_url, phone, whatsapp, districts(name)',
    )
    .eq('city_id', cityId)
    .eq('status', 'published')
    .limit(limit);

  query = applyBroadIlike(query, ['name', 'short_description', 'description'], q);

  const { data, error } = await query;
  if (error || !data) return [];

  return asRows<{
    id: string;
    slug: string;
    name: string;
    short_description: string | null;
    description: string | null;
    cover_url: string | null;
    logo_url: string | null;
    phone: string | null;
    whatsapp: string | null;
    districts: { name: string | null } | { name: string | null }[] | null;
  }>(data).flatMap((row) => {
    const district = districtName(row.districts);
    const score = matchesAndScore(q, [row.name, row.short_description, row.description, district]);
    if (score <= 0) return [];
    return [
      {
        entityType: 'business' as const,
        entityId: row.id,
        score,
        title: row.name,
        subtitle: row.short_description ?? district,
        description: row.description ?? row.short_description,
        url: `/comercio/negocio/${row.slug}`,
        coverUrl: firstImage([row.cover_url, row.logo_url]),
        phone: row.phone,
        whatsapp: row.whatsapp,
        source: 'fulltext' as const,
      },
    ];
  });
}

async function searchAccommodations(cityId: string, q: string, limit: number): Promise<LocalSearchHit[]> {
  let query = supabase
    .from('accommodations')
    .select('id, slug, name, short_description, description, address, cover_url, type')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .limit(limit);

  query = applyBroadIlike(query, ['name', 'short_description', 'description', 'address'], q);

  const { data, error } = await query;
  if (error || !data) return [];

  return asRows<{
    id: string;
    slug: string;
    name: string;
    short_description: string | null;
    description: string | null;
    address: string | null;
    cover_url: string | null;
    type: string | null;
  }>(data).flatMap((row) => {
    const score = matchesAndScore(q, [
      row.name,
      row.short_description,
      row.description,
      row.address,
      row.type,
    ]);
    if (score <= 0) return [];
    return [
      {
        entityType: 'accommodation' as const,
        entityId: row.id,
        score,
        title: row.name,
        subtitle: row.short_description ?? row.type,
        description: row.description,
        url: `/turismo/onde-ficar/${row.slug}`,
        coverUrl: row.cover_url,
        source: 'fulltext' as const,
      },
    ];
  });
}

async function searchRestaurants(cityId: string, q: string, limit: number): Promise<LocalSearchHit[]> {
  let query = supabase
    .from('restaurants')
    .select('id, name, description, address, cover_url, cuisine')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .limit(limit);

  query = applyBroadIlike(query, ['name', 'description', 'address'], q);

  const { data, error } = await query;
  if (error || !data) return [];

  return asRows<{
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    cover_url: string | null;
    cuisine: string[] | null;
  }>(data).flatMap((row) => {
    const score = matchesAndScore(q, [
      row.name,
      row.description,
      row.address,
      ...(row.cuisine ?? []),
    ]);
    if (score <= 0) return [];
    return [
      {
        entityType: 'restaurant' as const,
        entityId: row.id,
        score,
        title: row.name,
        subtitle: row.address,
        description: row.description,
        url: '/turismo/onde-comer',
        coverUrl: row.cover_url,
        source: 'fulltext' as const,
      },
    ];
  });
}

async function searchAttractions(cityId: string, q: string, limit: number): Promise<LocalSearchHit[]> {
  let query = supabase
    .from('attractions')
    .select('id, slug, name, description, address, type, cover_url')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .limit(limit);

  query = applyBroadIlike(query, ['name', 'description', 'address', 'type'], q);

  const { data, error } = await query;
  if (error || !data) return [];

  return asRows<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    address: string | null;
    type: string | null;
    cover_url: string | null;
  }>(data).flatMap((row) => {
    const score = matchesAndScore(q, [row.name, row.description, row.address, row.type]);
    if (score <= 0) return [];
    return [
      {
        entityType: 'attraction' as const,
        entityId: row.id,
        score,
        title: row.name,
        subtitle: row.address ?? row.type,
        description: row.description,
        url: `/turismo/o-que-fazer/${row.slug}`,
        coverUrl: row.cover_url,
        source: 'fulltext' as const,
      },
    ];
  });
}

async function searchEvents(cityId: string, q: string, limit: number): Promise<LocalSearchHit[]> {
  const now = new Date().toISOString();
  let query = supabase
    .from('events')
    .select(
      'id, slug, title, description, location, address, cover_url, event_categories(name)',
    )
    .eq('city_id', cityId)
    .eq('status', 'published')
    .gte('start_at', now)
    .order('start_at', { ascending: true })
    .limit(limit);

  query = applyBroadIlike(query, ['title', 'description', 'location', 'address'], q);

  const { data, error } = await query;
  if (error || !data) return [];

  return asRows<{
    id: string;
    slug: string;
    title: string;
    description: string | null;
    location: string | null;
    address: string | null;
    cover_url: string | null;
    event_categories: { name: string | null } | { name: string | null }[] | null;
  }>(data).flatMap((row) => {
    const categoryName = districtName(row.event_categories);
    const score = matchesAndScore(q, [
      row.title,
      row.description,
      row.location,
      row.address,
      categoryName,
    ]);
    if (score <= 0) return [];
    return [
      {
        entityType: 'event' as const,
        entityId: row.id,
        score,
        title: row.title,
        subtitle: row.location ?? categoryName,
        description: row.description,
        url: `/comunidade/agenda/${row.slug}`,
        coverUrl: row.cover_url,
        source: 'fulltext' as const,
      },
    ];
  });
}

async function searchClassifieds(cityId: string, q: string, limit: number): Promise<LocalSearchHit[]> {
  let query = supabase
    .from('classifieds')
    .select('id, type, slug, title, description, category_label, cover_url')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  query = applyBroadIlike(query, ['title', 'description', 'category_label'], q);

  const { data, error } = await query;
  if (error || !data) return [];

  return asRows<{
    id: string;
    type: string;
    slug: string;
    title: string;
    description: string | null;
    category_label: string | null;
    cover_url: string | null;
  }>(data).flatMap((row) => {
    const score = matchesAndScore(q, [row.title, row.description, row.category_label, row.type]);
    if (score <= 0) return [];
    return [
      {
        entityType: 'classified' as const,
        entityId: row.id,
        score,
        title: row.title,
        subtitle: row.category_label ?? row.type,
        description: row.description,
        url: classifiedUrl(row.type, row.slug),
        coverUrl: row.cover_url,
        source: 'fulltext' as const,
      },
    ];
  });
}

async function searchProperties(cityId: string, q: string, limit: number): Promise<LocalSearchHit[]> {
  let query = supabase
    .from('properties')
    .select('id, slug, title, description, property_type, cover_url, districts(name)')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .or('expires_at.is.null,expires_at.gt.now()')
    .limit(limit);

  query = applyBroadIlike(query, ['title', 'description', 'property_type'], q);

  const { data, error } = await query;
  if (error || !data) return [];

  return asRows<{
    id: string;
    slug: string;
    title: string;
    description: string | null;
    property_type: string | null;
    cover_url: string | null;
    districts: { name: string | null } | { name: string | null }[] | null;
  }>(data).flatMap((row) => {
    const district = districtName(row.districts);
    const score = matchesAndScore(q, [row.title, row.description, row.property_type, district]);
    if (score <= 0) return [];
    return [
      {
        entityType: 'property' as const,
        entityId: row.id,
        score,
        title: row.title,
        subtitle: district ?? row.property_type,
        description: row.description,
        url: `/imoveis/${row.slug}`,
        coverUrl: row.cover_url,
        source: 'fulltext' as const,
      },
    ];
  });
}

function classifiedUrl(type: string, slug: string): string {
  if (type === 'vehicle') return `/classificados/veiculos/${slug}`;
  if (type === 'job') return `/classificados/vagas/${slug}`;
  if (type === 'service') return `/classificados/servicos/${slug}`;
  if (type === 'item') return `/classificados/itens/${slug}`;
  return '/classificados';
}

function uniqueHits(hits: LocalSearchHit[]): LocalSearchHit[] {
  const seen = new Set<string>();
  return hits.filter((hit) => {
    const key = `${hit.entityType}:${hit.entityId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function nativeFulltextSearch(
  cityId: string,
  trimmed: string,
  enabled: Set<SearchEntityType>,
  limit: number,
): Promise<LocalSearchHit[]> {
  const perTypeLimit = Math.max(8, Math.ceil(limit / 4));

  const [businesses, accommodations, restaurants, attractions, events, classifieds, properties] =
    await Promise.all([
      enabled.has('business') ? searchBusinesses(cityId, trimmed, perTypeLimit) : [],
      enabled.has('accommodation') ? searchAccommodations(cityId, trimmed, perTypeLimit) : [],
      enabled.has('restaurant') ? searchRestaurants(cityId, trimmed, perTypeLimit) : [],
      enabled.has('attraction') ? searchAttractions(cityId, trimmed, perTypeLimit) : [],
      enabled.has('event') ? searchEvents(cityId, trimmed, perTypeLimit) : [],
      enabled.has('classified') ? searchClassifieds(cityId, trimmed, perTypeLimit) : [],
      enabled.has('property') ? searchProperties(cityId, trimmed, perTypeLimit) : [],
    ]);

  const sitePages = enabled.has('site_page') ? searchSitePages(trimmed, 8) : [];

  return uniqueHits([
    ...sitePages,
    ...businesses,
    ...accommodations,
    ...restaurants,
    ...attractions,
    ...events,
    ...classifieds,
    ...properties,
  ]);
}

/**
 * Busca híbrida: semântica no Next (embeddings) + fulltext nativo (Supabase).
 */
export async function nativeSearch(
  q: string,
  options: { citySlug?: string; types?: SearchEntityType[]; limit?: number } = {},
): Promise<SearchPayload> {
  const trimmed = q.trim();
  const citySlug = options.citySlug ?? env.defaultCitySlug;
  const limit = options.limit ?? 24;
  const types = options.types?.length ? options.types : undefined;
  const enabled = new Set(types ?? DEFAULT_TYPES);

  if (trimmed.length < 2) {
    return { hits: [], latencyMs: 0, usedSemantic: false, city: null };
  }

  const start = Date.now();
  const city = await resolveCity(citySlug);
  if (!city) {
    return { hits: [], latencyMs: Date.now() - start, usedSemantic: false, city: null };
  }

  try {
    const [semanticHits, fulltextHits] = await Promise.all([
      fetchSemanticHits(trimmed, { citySlug, types, limit }),
      nativeFulltextSearch(city.id, trimmed, enabled, limit),
    ]);

    const usedSemantic = semanticHits.length > 0;
    const hits = uniqueHits([...semanticHits, ...fulltextHits])
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      hits,
      latencyMs: Date.now() - start,
      usedSemantic,
      city,
    };
  } catch (error) {
    mobileDebug('search', 'nativeSearch failed', error);
    return { hits: [], latencyMs: Date.now() - start, usedSemantic: false, city };
  }
}

export async function nativeSearchSuggest(
  q: string,
  citySlug = env.defaultCitySlug,
): Promise<SearchSuggestion[]> {
  const result = await nativeSearch(q, { citySlug, limit: 6 });
  return result.hits.map((hit) => ({
    title: hit.title,
    subtitle: hit.subtitle,
    href: hit.url,
    entityType: hit.entityType,
    coverUrl: hit.coverUrl,
  }));
}

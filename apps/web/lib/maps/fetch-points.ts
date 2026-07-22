import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { MapCategoryId, MapPoint } from './categories';

type PointRow = {
  id: string;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
  cover_url: string | null;
  description?: string | null;
  rating?: number | null;
};

type AttractionRow = PointRow & {
  type: string | null;
};

type AccommodationRow = PointRow & {
  type: string | null;
};

type RestaurantRow = PointRow & {
  cuisine: unknown;
};

type FishingSpotRow = PointRow & {
  species: unknown;
};

type TourismGuideRow = PointRow & {
  kind: string | null;
  tagline: string | null;
};

type BusinessRow = PointRow & {
  logo_url: string | null;
  short_description: string | null;
};

type EventRow = {
  id: string;
  slug: string;
  title: string;
  lat: number | null;
  lng: number | null;
  cover_url: string | null;
  start_at: string;
};

export type MapPointFetcher = (cityId: string) => Promise<MapPoint[]>;

const pointSelect = 'id, slug, name, lat, lng, cover_url, description, rating';
const pointSelectWithoutRating = 'id, slug, name, lat, lng, cover_url, description';

function hasCoordinates(row: { lat: number | null; lng: number | null }): row is {
  lat: number;
  lng: number;
} {
  return typeof row.lat === 'number' && Number.isFinite(row.lat) && typeof row.lng === 'number' && Number.isFinite(row.lng);
}

function firstString(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.find((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function titleCase(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toTourismPoint(
  row: PointRow,
  category: MapCategoryId,
  hrefBase: string,
  badge: string | undefined,
): MapPoint | null {
  if (!hasCoordinates(row)) return null;
  return {
    id: row.id,
    category,
    name: row.name,
    slug: row.slug,
    href: `${hrefBase}/${row.slug}`,
    lat: row.lat,
    lng: row.lng,
    thumb: row.cover_url ?? undefined,
    badge,
    description: row.description ?? undefined,
    meta: typeof row.rating === 'number' ? `Nota ${row.rating.toFixed(1).replace('.', ',')}` : undefined,
  };
}

export async function fetchAttractions(cityId: string): Promise<MapPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attractions')
    .select(`${pointSelect}, type`)
    .eq('city_id', cityId)
    .eq('status', 'published')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .neq('type', 'igreja')
    .order('featured', { ascending: false })
    .order('name');

  if (error) return [];

  return ((data ?? []) as AttractionRow[])
    .map((row) =>
      toTourismPoint(row, 'atracao', '/turismo/o-que-fazer', titleCase(row.type, 'Atração')),
    )
    .filter((point): point is MapPoint => Boolean(point));
}

export async function fetchChurchAttractions(cityId: string): Promise<MapPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attractions')
    .select(`${pointSelect}, type`)
    .eq('city_id', cityId)
    .eq('status', 'published')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .ilike('type', 'igreja%')
    .order('featured', { ascending: false })
    .order('name');

  if (error) return [];

  return ((data ?? []) as AttractionRow[])
    .map((row) => toTourismPoint(row, 'igreja', '/turismo/o-que-fazer', 'Igreja'))
    .filter((point): point is MapPoint => Boolean(point));
}

export async function fetchAccommodations(cityId: string): Promise<MapPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('accommodations')
    .select(`${pointSelect}, type`)
    .eq('city_id', cityId)
    .eq('status', 'published')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('featured', { ascending: false })
    .order('name');

  if (error) return [];

  return ((data ?? []) as AccommodationRow[])
    .map((row) =>
      toTourismPoint(row, 'pousada', '/turismo/onde-ficar', titleCase(row.type, 'Hospedagem')),
    )
    .filter((point): point is MapPoint => Boolean(point));
}

export async function fetchRestaurants(cityId: string): Promise<MapPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('restaurants')
    .select(`${pointSelect}, cuisine`)
    .eq('city_id', cityId)
    .eq('status', 'published')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('featured', { ascending: false })
    .order('name');

  if (error) return [];

  return ((data ?? []) as RestaurantRow[])
    .map((row) =>
      toTourismPoint(row, 'restaurante', '/turismo/onde-comer', firstString(row.cuisine) ?? 'Restaurante'),
    )
    .filter((point): point is MapPoint => Boolean(point));
}

export async function fetchFishingSpots(cityId: string): Promise<MapPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fishing_spots')
    .select(`${pointSelectWithoutRating}, species`)
    .eq('city_id', cityId)
    .eq('status', 'published')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('name');

  if (error) return [];

  return ((data ?? []) as FishingSpotRow[])
    .map((row) =>
      toTourismPoint(row, 'pesca', '/turismo/pesca/pontos', firstString(row.species) ?? 'Pesca'),
    )
    .filter((point): point is MapPoint => Boolean(point));
}

export async function fetchTourismGuides(cityId: string): Promise<MapPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tourism_guides')
    .select('id, slug, name, lat, lng, cover_url, description, kind, tagline')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('featured', { ascending: false })
    .order('name');

  if (error) return [];

  return ((data ?? []) as TourismGuideRow[])
    .map((row): MapPoint | null => {
      if (!hasCoordinates(row)) return null;
      return {
        id: row.id,
        category: 'guia',
        name: row.name,
        slug: row.slug,
        href: `/turismo/guias/${row.slug}`,
        lat: row.lat,
        lng: row.lng,
        thumb: row.cover_url ?? undefined,
        badge: titleCase(row.kind, 'Guia'),
        description: row.tagline ?? row.description ?? undefined,
      };
    })
    .filter((point): point is MapPoint => Boolean(point));
}

export async function fetchBusinesses(cityId: string): Promise<MapPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('businesses')
    .select('id, slug, name, lat, lng, cover_url, logo_url, short_description')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('featured', { ascending: false })
    .order('name')
    .limit(500);

  if (error) return [];

  return ((data ?? []) as BusinessRow[])
    .map((row): MapPoint | null => {
      if (!hasCoordinates(row)) return null;
      return {
        id: row.id,
        category: 'comercio',
        name: row.name,
        slug: row.slug,
        href: `/comercio/negocio/${row.slug}`,
        lat: row.lat,
        lng: row.lng,
        thumb: row.cover_url ?? row.logo_url ?? undefined,
        badge: 'Comércio local',
        description: row.short_description ?? undefined,
      };
    })
    .filter((point): point is MapPoint => Boolean(point));
}

export async function fetchEvents(cityId: string): Promise<MapPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('id, slug, title, lat, lng, cover_url, start_at')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .gte('start_at', new Date().toISOString())
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('start_at', { ascending: true });

  if (error) return [];

  const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
  });

  return ((data ?? []) as EventRow[])
    .map((row): MapPoint | null => {
      if (!hasCoordinates(row)) return null;
      return {
        id: row.id,
        category: 'evento',
        name: row.title,
        slug: row.slug,
        href: `/comunidade/agenda/${row.slug}`,
        lat: row.lat,
        lng: row.lng,
        thumb: row.cover_url ?? undefined,
        badge: dateFormatter.format(new Date(row.start_at)),
      };
    })
    .filter((point): point is MapPoint => Boolean(point));
}

export const MAP_POINT_FETCHERS: Record<MapCategoryId, MapPointFetcher> = {
  atracao: fetchAttractions,
  igreja: fetchChurchAttractions,
  pousada: fetchAccommodations,
  restaurante: fetchRestaurants,
  pesca: fetchFishingSpots,
  guia: fetchTourismGuides,
  comercio: fetchBusinesses,
  evento: fetchEvents,
};

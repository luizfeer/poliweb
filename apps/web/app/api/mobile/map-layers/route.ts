import { NextResponse, type NextRequest } from 'next/server';

import { listBusinesses } from '@/lib/businesses/queries';
import { listAttractions } from '@/lib/tourism/queries';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const revalidate = 60;

const DEFAULT_CENTER = { lat: -20.9719, lng: -46.1189 };
const ALL_LAYERS = ['pousadas', 'comercios', 'atracoes'] as const;
type Layer = (typeof ALL_LAYERS)[number];

type CityRow = {
  id: string;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
};

export type MapPin = {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  coverUrl: string | null;
  subtitle: string | null;
  kind: 'pousada' | 'comercio' | 'atracao';
};

function parseLayers(value: string | null): Set<Layer> {
  if (!value) return new Set(ALL_LAYERS);
  const requested = value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Layer => (ALL_LAYERS as readonly string[]).includes(s));
  return new Set(requested.length ? requested : ALL_LAYERS);
}

function hasCoords<T extends { lat?: number | null; lng?: number | null }>(
  item: T,
): item is T & { lat: number; lng: number } {
  return (
    typeof item.lat === 'number' &&
    typeof item.lng === 'number' &&
    Number.isFinite(item.lat) &&
    Number.isFinite(item.lng)
  );
}

export async function GET(request: NextRequest) {
  const citySlug = request.nextUrl.searchParams.get('city') ?? 'carmo-do-rio-claro';
  const layers = parseLayers(request.nextUrl.searchParams.get('layers'));
  const limitPer = Number(request.nextUrl.searchParams.get('limit') ?? '120');

  const supabase = await createClient();
  const { data: city } = await supabase
    .from('cities')
    .select('id, slug, name, lat, lng')
    .eq('slug', citySlug)
    .maybeSingle<CityRow>();

  if (!city) {
    return NextResponse.json({
      city: null,
      pins: [],
    });
  }

  const pins: MapPin[] = [];

  if (layers.has('pousadas')) {
    const items = await listBusinesses({
      city_id: city.id,
      category: 'pousadas',
      limit: limitPer,
      sort: 'featured',
    }).catch(() => []);
    for (const b of items) {
      if (!hasCoords(b)) continue;
      pins.push({
        id: `pousada:${b.id}`,
        slug: b.slug,
        name: b.name,
        lat: b.lat,
        lng: b.lng,
        coverUrl: b.coverUrl ?? b.logoUrl ?? null,
        subtitle: b.district ?? null,
        kind: 'pousada',
      });
    }
  }

  if (layers.has('comercios')) {
    const items = await listBusinesses({
      city_id: city.id,
      limit: limitPer,
      sort: 'featured',
    }).catch(() => []);
    for (const b of items) {
      if (!hasCoords(b)) continue;
      if (b.categories?.includes('pousadas')) continue;
      pins.push({
        id: `comercio:${b.id}`,
        slug: b.slug,
        name: b.name,
        lat: b.lat,
        lng: b.lng,
        coverUrl: b.coverUrl ?? b.logoUrl ?? null,
        subtitle: b.district ?? null,
        kind: 'comercio',
      });
    }
  }

  if (layers.has('atracoes')) {
    const items = await listAttractions({ city_id: city.id, limit: limitPer }).catch(() => []);
    for (const a of items) {
      if (!hasCoords(a)) continue;
      pins.push({
        id: `atracao:${a.id}`,
        slug: a.slug,
        name: a.name,
        lat: a.lat,
        lng: a.lng,
        coverUrl: a.coverUrl ?? null,
        subtitle: a.description ?? null,
        kind: 'atracao',
      });
    }
  }

  return NextResponse.json({
    city: {
      id: city.id,
      slug: city.slug,
      name: city.name,
      lat: city.lat ?? DEFAULT_CENTER.lat,
      lng: city.lng ?? DEFAULT_CENTER.lng,
    },
    pins,
  });
}

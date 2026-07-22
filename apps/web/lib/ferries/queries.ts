import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { publicCached } from '@/lib/cache/public-query';
import type {
  FerryAlert,
  FerryDisplay,
  FerryFare,
  FerryRouteCard,
  FerryRouteDetail,
  FerrySchedule,
  FerrySource,
} from './types';

type RouteRow = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  region: string | null;
  district: string | null;
  status: FerryRouteCard['status'];
  confidence: FerryRouteCard['confidence'];
  description: string | null;
  important_info: unknown;
  fare_summary: string | null;
  fare_warning: string | null;
  fare: unknown;
  display: unknown;
  seo: unknown;
  keywords: string[] | null;
  endpoint_a_label: string | null;
  endpoint_b_label: string | null;
  related_cities: string[] | null;
  operating_days: string[] | null;
  source: unknown;
  featured: boolean;
  display_order: number;
  active: boolean;
  og_image_url: string | null;
  og_square_image_url: string | null;
};

type ScheduleRow = {
  id: string;
  direction: string;
  origin: string | null;
  destination: string | null;
  departs_at: string;
  notes: string | null;
  display_order: number;
  active: boolean;
};

type AlertRow = {
  id: string;
  type: FerryAlert['type'];
  title: string;
  message: string;
  active: boolean;
};

function asObject<T extends object>(value: unknown, fallback: T): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as T;
  return fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function toCard(row: RouteRow): FerryRouteCard {
  const display = asObject<FerryDisplay>(row.display, {});
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    region: row.region,
    district: row.district,
    status: row.status,
    confidence: row.confidence,
    description: row.description,
    fareSummary: row.fare_summary,
    display,
    endpointA: row.endpoint_a_label,
    endpointB: row.endpoint_b_label,
    relatedCities: row.related_cities ?? [],
    operatingDays: row.operating_days ?? [],
    featured: row.featured,
    ogImageUrl: row.og_image_url ?? undefined,
    ogSquareImageUrl: row.og_square_image_url ?? undefined,
  };
}

function toSchedule(row: ScheduleRow): FerrySchedule {
  return {
    id: row.id,
    direction: row.direction,
    origin: row.origin,
    destination: row.destination,
    departsAt: row.departs_at.slice(0, 5),
    notes: row.notes,
    displayOrder: row.display_order,
  };
}

function toAlert(row: AlertRow): FerryAlert {
  return { id: row.id, type: row.type, title: row.title, message: row.message };
}

export function listFerryRoutes(cityId: string): Promise<FerryRouteCard[]> {
  return publicCached(
    { key: 'ferries:list', tags: ['ferries', `ferries:${cityId}`], parts: [cityId] },
    async (supabase) => {
      const { data, error } = await supabase
        .from('ferry_routes')
        .select(
          'id, slug, name, short_name, region, district, status, confidence, description, important_info, fare_summary, fare_warning, fare, display, seo, keywords, endpoint_a_label, endpoint_b_label, related_cities, operating_days, source, featured, display_order, active, og_image_url, og_square_image_url',
        )
        .eq('city_id', cityId)
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) => toCard(row as unknown as RouteRow));
    },
  );
}

export function getFerryRouteBySlug(
  cityId: string,
  slug: string,
): Promise<FerryRouteDetail | null> {
  return publicCached(
    {
      key: 'ferries:detail',
      tags: ['ferries', `ferries:${cityId}`, `ferries:${cityId}:${slug}`],
      parts: [cityId, slug],
    },
    async (supabase) => {
      const { data: routeData, error: routeError } = await supabase
        .from('ferry_routes')
        .select(
          'id, slug, name, short_name, region, district, status, confidence, description, important_info, fare_summary, fare_warning, fare, display, seo, keywords, endpoint_a_label, endpoint_b_label, related_cities, operating_days, source, featured, display_order, active, og_image_url, og_square_image_url',
        )
        .eq('city_id', cityId)
        .eq('slug', slug)
        .maybeSingle();

      if (routeError || !routeData) return null;
      const row = routeData as unknown as RouteRow;

      const [{ data: scheduleData }, { data: alertData }] = await Promise.all([
        supabase
          .from('ferry_schedule_items')
          .select('id, direction, origin, destination, departs_at, notes, display_order, active')
          .eq('route_id', row.id)
          .eq('active', true)
          .order('direction', { ascending: true })
          .order('departs_at', { ascending: true }),
        supabase
          .from('ferry_alerts')
          .select('id, type, title, message, active')
          .eq('route_id', row.id)
          .eq('active', true)
          .order('display_order', { ascending: true }),
      ]);

      const card = toCard(row);
      return {
        ...card,
        fareWarning: row.fare_warning,
        fare: asObject<FerryFare>(row.fare, {}),
        importantInfo: asStringArray(row.important_info),
        keywords: row.keywords ?? [],
        source: asObject<FerrySource>(row.source, {}),
        schedules: (scheduleData ?? []).map((r) => toSchedule(r as ScheduleRow)),
        alerts: (alertData ?? []).map((r) => toAlert(r as AlertRow)),
        seo: asObject<{ title?: string; description?: string }>(row.seo, {}),
      };
    },
  );
}

export function listFerryRouteSlugs(cityId: string): Promise<string[]> {
  return publicCached(
    { key: 'ferries:slugs', tags: ['ferries', `ferries:${cityId}`], parts: [cityId] },
    async (supabase) => {
      const { data } = await supabase
        .from('ferry_routes')
        .select('slug')
        .eq('city_id', cityId)
        .eq('active', true);
      return (data ?? []).map((r) => (r as { slug: string }).slug);
    },
  );
}

export async function listFerriesAdmin(cityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ferry_routes')
    .select(
      'id, slug, name, short_name, region, district, status, confidence, featured, active, display_order',
    )
    .eq('city_id', cityId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    short_name: string | null;
    region: string | null;
    district: string | null;
    status: FerryRouteCard['status'];
    confidence: FerryRouteCard['confidence'];
    featured: boolean;
    active: boolean;
    display_order: number;
  }>;
}

export function groupSchedulesByDirection(schedules: FerrySchedule[]) {
  const groups = new Map<string, FerrySchedule[]>();
  for (const s of schedules) {
    if (!groups.has(s.direction)) groups.set(s.direction, []);
    groups.get(s.direction)!.push(s);
  }
  return Array.from(groups.entries()).map(([direction, items]) => ({ direction, items }));
}

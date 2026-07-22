import { notFound } from 'next/navigation';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import {
  getEnabledMapCategories,
  MAP_CATEGORY_IDS,
  type MapCategoryId,
  type MapPoint,
} from '@/lib/maps/categories';
import { MAP_POINT_FETCHERS } from '@/lib/maps/fetch-points';
import { MapExplorer } from './_components/map-explorer';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const paramsSchema = z.object({
  cats: z.string().optional(),
  q: z.string().max(80).optional(),
  z: z.coerce.number().min(3).max(18).optional(),
  c: z
    .string()
    .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
    .optional(),
  id: z.string().uuid().optional(),
});

export const metadata = {
  title: 'Mapa - Portal Carmelitano',
  description: 'Guia interativo da cidade com turismo, comércio e agenda em um mapa público.',
};

function getSingle(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseCenter(value: string | undefined): { lat: number; lng: number } | null {
  if (!value) return null;
  const [lat, lng] = value.split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function parseCategories(
  rawCats: string | undefined,
  enabledIds: MapCategoryId[],
): MapCategoryId[] {
  if (!rawCats) return enabledIds;
  if (rawCats === 'none') return [];
  const enabled = new Set(enabledIds);
  const selected = rawCats
    .split(',')
    .filter((id): id is MapCategoryId => {
      return MAP_CATEGORY_IDS.includes(id as MapCategoryId) && enabled.has(id as MapCategoryId);
    });

  return selected.length > 0 ? Array.from(new Set(selected)) : [];
}

async function fetchSelectedPoints(
  cityId: string,
  selectedCategories: MapCategoryId[],
): Promise<MapPoint[]> {
  const results = await Promise.all(
    selectedCategories.map((category) => MAP_POINT_FETCHERS[category](cityId)),
  );

  return results.flat();
}

export default async function MapaPage({ searchParams }: PageProps) {
  const city = await getCurrentCity();
  if (!city) notFound();

  const enabledCategories = getEnabledMapCategories(city.modules);
  const enabledIds = enabledCategories.map((category) => category.id);
  const rawParams = await searchParams;
  const parsed = paramsSchema.safeParse({
    cats: getSingle(rawParams?.cats),
    q: getSingle(rawParams?.q),
    z: getSingle(rawParams?.z),
    c: getSingle(rawParams?.c),
    id: getSingle(rawParams?.id),
  });
  const params = parsed.success ? parsed.data : {};
  const selectedCategories = parseCategories(params.cats, enabledIds);
  const points = await fetchSelectedPoints(city.id, selectedCategories);

  return (
    <MapExplorer
      city={{
        name: city.name,
        lat: city.lat,
        lng: city.lng,
      }}
      categories={enabledCategories.map(({ id, label, shortLabel, color }) => ({
        id,
        label,
        shortLabel,
        color,
      }))}
      points={points}
      selectedCategories={selectedCategories}
      initialQuery={params.q ?? ''}
      initialZoom={params.z}
      initialCenter={parseCenter(params.c)}
      initialPointId={params.id}
    />
  );
}

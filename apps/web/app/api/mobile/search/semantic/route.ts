import { NextResponse, type NextRequest } from 'next/server';

import { getCityBySlug } from '@/lib/cities';
import { semanticSearch } from '@/lib/search/semantic';
import type { SearchEntityType, SearchHit } from '@/lib/search/types';

export const runtime = 'nodejs';

const allowedTypes: SearchEntityType[] = [
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
  'site_page',
];

function parseTypes(value: string | null): SearchEntityType[] {
  if (!value) return [];
  return value
    .split(',')
    .filter((type): type is SearchEntityType => allowedTypes.includes(type as SearchEntityType));
}

function serializeHits(hits: SearchHit[]) {
  return hits.map((hit) => ({
    entityType: hit.entityType,
    entityId: hit.entityId,
    score: hit.score,
    title: hit.title,
    subtitle: hit.subtitle,
    description: hit.description,
    url: hit.url,
    coverUrl: hit.coverUrl,
    phone: hit.phone ?? null,
    whatsapp: hit.whatsapp ?? null,
    source: hit.source,
  }));
}

/**
 * Busca semântica (embeddings) para o app mobile.
 * Fulltext, sugestões e UI ficam no cliente via Supabase.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const citySlug = searchParams.get('city') ?? 'carmo-do-rio-claro';
  const q = searchParams.get('q')?.trim() ?? '';
  const selectedTypes = parseTypes(searchParams.get('tipo'));
  const limit = Math.min(Number(searchParams.get('limit') ?? '24'), 40);

  if (q.length < 2) {
    return NextResponse.json({ hits: [], latencyMs: 0 });
  }

  const city = await getCityBySlug(citySlug);
  if (!city) {
    return NextResponse.json({ error: 'city not found' }, { status: 404 });
  }

  const start = Date.now();

  try {
    const hits = await semanticSearch(q, city.id, {
      types: selectedTypes.length ? selectedTypes : undefined,
      limit,
    });

    return NextResponse.json({
      hits: serializeHits(hits),
      latencyMs: Date.now() - start,
    });
  } catch {
    return NextResponse.json({ hits: [], latencyMs: Date.now() - start });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentCity } from '@/lib/cities';
import { fulltextSearch } from '@/lib/search/fulltext';
import { normalizeForSearch } from '@/lib/search/query-tokens';
import { databaseSitePageSearch, sitePageSearch } from '@/lib/search/site-pages';
import type { SearchEntityType, SearchHit } from '@/lib/search/types';

const contentTypes: SearchEntityType[] = [
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
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const city = await getCurrentCity();

  if (!city || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const pageHits = uniqueHits([...(await databaseSitePageSearch(q, city.id, 4)), ...sitePageSearch(q, 4)]).slice(0, 4);
  const directPageHits = pageHits.filter((hit) =>
    normalizeForSearch(hit.title).includes(normalizeForSearch(q)),
  );
  if (directPageHits.length > 0) {
    return NextResponse.json({ suggestions: serializeSuggestions(directPageHits) });
  }

  const contentHits = await fulltextSearch(q, city.id, { types: contentTypes, limit: 4 });
  const hits = uniqueHits([...pageHits, ...contentHits]).slice(0, 6);

  return NextResponse.json({ suggestions: serializeSuggestions(hits) });
}

function serializeSuggestions(hits: SearchHit[]) {
  return hits.map((hit) => ({
    title: hit.title,
    subtitle: hit.subtitle,
    href: hit.url,
    entityType: hit.entityType,
  }));
}

function uniqueHits(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  return hits.filter((hit) => {
    const key = `${hit.entityType}:${hit.entityId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

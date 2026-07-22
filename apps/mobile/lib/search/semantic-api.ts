import { env } from '@/lib/env';
import type { SearchEntityType } from '@/lib/chat/types';
import { mobileDebug } from '@/lib/debug';

import type { LocalSearchHit } from './site-pages';

type SemanticResponse = {
  hits?: Array<{
    entityType: SearchEntityType;
    entityId: string;
    score: number;
    title: string;
    subtitle: string | null;
    description: string | null;
    url: string;
    coverUrl: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    source: 'semantic' | 'fulltext';
  }>;
  latencyMs?: number;
};

/**
 * Busca semântica via Next (embeddings + match_embeddings).
 * Falha silenciosa — o caller usa fulltext nativo como fallback.
 */
export async function fetchSemanticHits(
  q: string,
  options: { citySlug?: string; types?: SearchEntityType[]; limit?: number } = {},
): Promise<LocalSearchHit[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];

  const citySlug = options.citySlug ?? env.defaultCitySlug;
  const params = new URLSearchParams({
    city: citySlug,
    q: trimmed,
    limit: String(options.limit ?? 24),
  });
  if (options.types?.length) {
    params.set('tipo', options.types.join(','));
  }

  const url = `${env.webBaseUrl}/api/mobile/search/semantic?${params.toString()}`;

  try {
    const startedAt = Date.now();
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    mobileDebug('search', 'semantic GET', {
      status: res.status,
      latencyMs: Date.now() - startedAt,
    });

    if (!res.ok) return [];

    const data = (await res.json()) as SemanticResponse;
    return (data.hits ?? []).map(
      (hit): LocalSearchHit => ({
        entityType: hit.entityType,
        entityId: hit.entityId,
        score: hit.score,
        title: hit.title,
        subtitle: hit.subtitle,
        description: hit.description,
        url: hit.url,
        coverUrl: hit.coverUrl,
        phone: hit.phone,
        whatsapp: hit.whatsapp,
        source: hit.source === 'semantic' ? 'semantic' : 'fulltext',
      }),
    );
  } catch (error) {
    mobileDebug('search', 'semantic fetch failed', error);
    return [];
  }
}

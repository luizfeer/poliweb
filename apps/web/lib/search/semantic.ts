import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { embedQuery } from './embed-query';
import { fulltextSearch } from './fulltext';
import { hydrateHits } from './hydrate';
import { sitePageSearch } from './site-pages';
import type { ChatResult, MatchEmbeddingRow, SearchEntityType, SearchHit, SearchResult } from './types';

type UntypedRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

type UntypedQueryClient = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => {
      select: (columns: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
    select: (columns: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };
};

const FAQ_SCORE_THRESHOLD = 0.82;

export async function chatSearch(
  query: string,
  cityId: string,
): Promise<ChatResult> {
  const start = Date.now();
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { queryId: null, answer: null, hits: [], latencyMs: 0 };
  }

  try {
    const vector = await embedQuery(trimmed);
    const supabase = await createClient();
    const rpcClient = supabase as unknown as UntypedRpcClient;
    const { data, error } = await rpcClient.rpc('match_embeddings', {
      p_city_id: cityId,
      p_query_vector: vector,
      p_limit: 8,
      p_entity_types: null,
    });
    if (error) throw new Error(error.message);

    const rows = Array.isArray(data) ? (data as MatchEmbeddingRow[]) : [];
    const topRow = rows[0];

    let answer: string | null = null;
    if (topRow?.entity_type === 'faq' && topRow.score >= FAQ_SCORE_THRESHOLD) {
      answer = await fetchFaqAnswer(topRow.entity_id);
    }

    const entityRows = rows
      .filter((r) => r.entity_type !== 'faq')
      .slice(0, 5) as Array<MatchEmbeddingRow & { entity_type: SearchEntityType }>;
    let hits = await hydrateHits(entityRows, cityId, 'semantic');
    if (hits.length === 0) {
      hits = await fulltextSearch(trimmed, cityId, { limit: 8 });
    }
    const latencyMs = Date.now() - start;
    const queryId = await logSearchQuery({ cityId, query: trimmed, resultCount: hits.length + (answer ? 1 : 0), latencyMs });

    return { queryId, answer, hits, latencyMs };
  } catch {
    return { queryId: null, answer: null, hits: [], latencyMs: Date.now() - start };
  }
}

async function fetchFaqAnswer(faqId: string): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient() as unknown as UntypedQueryClient;
    const { data } = await supabase.from('city_faqs').select('answer').eq('id', faqId).maybeSingle();
    if (data && typeof data === 'object' && 'answer' in data && typeof data.answer === 'string') {
      return data.answer;
    }
    return null;
  } catch {
    return null;
  }
}

export async function unifiedSearch(
  query: string,
  cityId: string,
  options: { limit?: number; types?: SearchEntityType[] } = {},
): Promise<SearchResult> {
  const start = Date.now();
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { queryId: null, hits: [], latencyMs: 0, usedFallback: false };
  }

  let usedFallback = false;
  let hits: SearchHit[] = [];

  try {
    hits = await semanticSearch(trimmed, cityId, options);
  } catch {
    usedFallback = true;
  }

  if (hits.length === 0) {
    usedFallback = true;
    hits = await fulltextSearch(trimmed, cityId, options);
  }

  hits = mergeSitePageHits(trimmed, hits, options);

  const latencyMs = Date.now() - start;
  const queryId = await logSearchQuery({
    cityId,
    query: trimmed,
    resultCount: hits.length,
    latencyMs,
  });

  return { queryId, hits, latencyMs, usedFallback };
}

export async function semanticSearch(
  query: string,
  cityId: string,
  options: { limit?: number; types?: SearchEntityType[] } = {},
) {
  const supabase = await createClient();
  const vector = await embedQuery(query);
  const rpcClient = supabase as unknown as UntypedRpcClient;
  const { data, error } = await rpcClient.rpc('match_embeddings', {
    p_city_id: cityId,
    p_query_vector: vector,
    p_limit: options.limit ?? 20,
    p_entity_types: options.types?.length ? options.types : null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = Array.isArray(data) ? (data as MatchEmbeddingRow[]) : [];
  return hydrateHits(rows, cityId, 'semantic');
}

function mergeSitePageHits(
  query: string,
  hits: SearchHit[],
  options: { limit?: number; types?: SearchEntityType[] },
): SearchHit[] {
  if (options.types?.length && !options.types.includes('site_page')) {
    return hits;
  }

  const limit = options.limit ?? 20;
  const existing = new Set(hits.map((hit) => `${hit.entityType}:${hit.entityId}`));
  const pageHits = sitePageSearch(query, 8).filter(
    (hit) => !existing.has(`${hit.entityType}:${hit.entityId}`),
  );

  return [...pageHits, ...hits]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function logSearchQuery(input: {
  cityId: string;
  query: string;
  resultCount: number;
  latencyMs: number;
}): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient() as unknown as UntypedQueryClient;
    const { data, error } = await supabase
      .from('search_queries')
      .insert({
        city_id: input.cityId,
        query: input.query,
        result_count: input.resultCount,
        latency_ms: input.latencyMs,
      })
      .select('id')
      .maybeSingle();

    if (error || !data || typeof data !== 'object' || !('id' in data)) {
      return null;
    }

    return typeof data.id === 'string' ? data.id : null;
  } catch {
    return null;
  }
}

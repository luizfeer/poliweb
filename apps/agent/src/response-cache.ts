import type { AgentResponse } from './response-types.js';

type CacheEntry = {
  response: AgentResponse;
  expiresAt: number;
};

type InflightEntry = {
  promise: Promise<AgentResponse>;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 500;

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, InflightEntry>();

function normalize(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

const REFERENCE_TOKENS =
  /\b(ela|ele|esse|essa|isso|aquele|aquela|aquilo|l[áa]|a[íi]|esse lugar|esse local)\b/i;

export function isCacheable(input: {
  query: string;
  isFirstMessage: boolean;
  hasConversation: boolean;
}): boolean {
  if (!input.isFirstMessage) return false;
  if (input.hasConversation) return false;
  if (REFERENCE_TOKENS.test(input.query)) return false;
  return true;
}

export function cacheKey(citySlug: string, query: string): string {
  return `${citySlug}::${normalize(query)}`;
}

export function getCached(key: string): AgentResponse | null {
  const now = Date.now();
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    cache.delete(key);
    return null;
  }
  return entry.response;
}

export function setCached(key: string, response: AgentResponse): void {
  if (response.fallback) return;
  if (cache.size >= MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { response, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Coalesce concorrentes: se 2 requests com mesma chave chegarem em paralelo,
 * só uma roda o pipeline e a outra aguarda o mesmo resultado.
 */
export async function dedupeInflight(
  key: string,
  loader: () => Promise<AgentResponse>,
): Promise<AgentResponse> {
  const existing = inflight.get(key);
  if (existing) {
    return existing.promise;
  }

  const promise = loader().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, { promise });
  return promise;
}

import type { AgentEnv } from './config.js';

type EmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
};

type CacheEntry = {
  vector: number[];
  expiresAt: number;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 1000;
const cache = new Map<string, CacheEntry>();

function cacheKey(query: string): string {
  return query.trim().toLowerCase().slice(0, 8000);
}

function evictExpired(now: number): void {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}

export async function embedQuery(query: string, env: AgentEnv): Promise<number[]> {
  const key = cacheKey(query);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.vector;
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.openAiApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: key,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embeddings failed: ${response.status}`);
  }

  const payload = (await response.json()) as EmbeddingResponse;
  const embedding = payload.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error('OpenAI returned empty embedding');
  }

  if (cache.size >= MAX_CACHE_ENTRIES) {
    evictExpired(now);
    if (cache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
  }
  cache.set(key, { vector: embedding, expiresAt: now + CACHE_TTL_MS });

  return embedding;
}

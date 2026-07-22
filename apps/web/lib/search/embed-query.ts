import 'server-only';

type EmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
};

type CacheEntry = {
  vector: number[];
  expiresAt: number;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const queryVectorCache = new Map<string, CacheEntry>();

export async function embedQuery(query: string): Promise<number[]> {
  const normalized = query.trim().toLowerCase();
  const cached = queryVectorCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.vector;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY é obrigatório para a busca semântica.');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
      input: normalized.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embeddings falhou: HTTP ${response.status}`);
  }

  const json = (await response.json()) as EmbeddingResponse;
  const vector = json.data?.[0]?.embedding;
  if (!vector) {
    throw new Error('OpenAI retornou embedding vazio.');
  }

  queryVectorCache.set(normalized, {
    vector,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return vector;
}

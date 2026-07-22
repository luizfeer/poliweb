import type { WorkerEnv } from "../runtime/env.js"
import { fetchJson } from "../runtime/http.js"

type EmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>
  usage?: {
    total_tokens?: number
  }
}

export async function embedText(input: { text: string; env: WorkerEnv }): Promise<{ embedding: number[]; tokens: number | null }> {
  if (!input.env.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is required for embed:pending")
  }

  const response = await fetchJson<EmbeddingResponse>("https://api.openai.com/v1/embeddings", {
    timeoutMs: input.env.httpTimeoutMs,
    maxRetries: input.env.maxRetries,
    method: "POST",
    headers: {
      authorization: `Bearer ${input.env.openAiApiKey}`,
    },
    body: {
      model: input.env.openAiEmbeddingModel,
      input: input.text.slice(0, 8000),
    },
  })

  const embedding = response.data?.[0]?.embedding
  if (!embedding) {
    throw new Error("OpenAI returned empty embedding")
  }

  return {
    embedding,
    tokens: response.usage?.total_tokens ?? null,
  }
}

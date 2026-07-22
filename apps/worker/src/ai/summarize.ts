import type { WorkerEnv } from "../runtime/env.js"
import { fetchJson } from "../runtime/http.js"
import type { JsonValue } from "../types.js"
import { assertWithinBudget } from "./budget.js"

type OpenAiResponse = {
  output_text?: string
  output?: Array<{
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
}

export type SummaryResult = {
  text: string
  tokensInput: number | null
  tokensOutput: number | null
  costUsd: number | null
}

export async function summarizeOfficialText(input: {
  cityId: string
  title: string
  rawText: string
  sourceUrl: string
  env: WorkerEnv
}): Promise<SummaryResult> {
  assertWithinBudget(input.cityId, input.env)

  if (!input.env.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is required for summarize:pending")
  }

  const model = input.env.openAiSummaryModel
  const payload: JsonValue = {
    model,
    instructions: buildInstructions(),
    input: buildInput(input.title, input.rawText, input.sourceUrl),
    max_output_tokens: 650,
  }

  const response = await fetchJson<OpenAiResponse>("https://api.openai.com/v1/responses", {
    timeoutMs: input.env.httpTimeoutMs,
    maxRetries: input.env.maxRetries,
    method: "POST",
    headers: {
      authorization: `Bearer ${input.env.openAiApiKey}`,
    },
    body: payload,
  })

  const text = extractText(response)
  if (!text) {
    throw new Error("OpenAI returned empty summary")
  }

  const tokensInput = response.usage?.input_tokens ?? null
  const tokensOutput = response.usage?.output_tokens ?? null

  return {
    text,
    tokensInput,
    tokensOutput,
    costUsd: estimateOpenAiSummaryCost(model, tokensInput, tokensOutput),
  }
}

function buildInstructions(): string {
  return [
    "Você resume documentos oficiais municipais para cidadãos de Carmo do Rio Claro/MG.",
    "Escreva em PT-BR simples, neutro e factual.",
    "Não invente informações ausentes.",
    "Não tome partido político.",
    "Se houver CPF, laudo médico, prontuário, menor de idade ou endereço residencial, anonimizar.",
    "Retorne 3 a 6 bullets objetivos.",
    "Feche com uma frase curta lembrando que a fonte oficial deve ser conferida.",
  ].join("\n")
}

function buildInput(title: string, rawText: string, sourceUrl: string): string {
  return [
    `Título: ${title}`,
    `Fonte: ${sourceUrl}`,
    `Texto: ${rawText.slice(0, 12000)}`,
  ].join("\n\n")
}

function extractText(response: OpenAiResponse): string | null {
  if (response.output_text?.trim()) {
    return response.output_text.trim()
  }

  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text" || content.type === "text")
    ?.text
    ?.trim()

  return text || null
}

export function estimateOpenAiSummaryCost(
  model: string,
  inputTokens: number | null,
  outputTokens: number | null,
): number | null {
  if (inputTokens === null && outputTokens === null) {
    return null
  }

  const pricing = pricingForModel(model)
  const inputCost = ((inputTokens ?? 0) / 1_000_000) * pricing.input
  const outputCost = ((outputTokens ?? 0) / 1_000_000) * pricing.output
  return Number((inputCost + outputCost).toFixed(6))
}

function pricingForModel(model: string): { input: number; output: number } {
  if (model.startsWith("gpt-5.4-mini")) {
    return { input: 0.75, output: 4.5 }
  }
  if (model.startsWith("gpt-5.4-nano")) {
    return { input: 0.2, output: 1.25 }
  }
  if (model.startsWith("gpt-4.1-mini")) {
    return { input: 0.4, output: 1.6 }
  }
  if (model.startsWith("gpt-4.1-nano")) {
    return { input: 0.1, output: 0.4 }
  }
  return { input: 0.2, output: 1.25 }
}

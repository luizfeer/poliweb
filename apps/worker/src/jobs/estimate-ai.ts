import type { WorkerEnv } from "../runtime/env.js"
import { logger } from "../runtime/logger.js"
import { scrapeCouncilSource, scrapeDiarySource, scrapeTenderSource } from "../sources/official-sources.js"
import type { ScrapedItem } from "../types.js"
import { estimateOpenAiSummaryCost } from "../ai/summarize.js"

type SourceEstimate = {
  source: string
  items: number
  rawChars: number
  estimatedSummaryInputTokens: number
  estimatedSummaryOutputTokens: number
  estimatedEmbeddingTokens: number
  flaggedSuspected: number
  lowConfidence: number
}

export async function runAiEstimate(env: WorkerEnv) {
  const options = {
    timeoutMs: env.httpTimeoutMs,
    maxRetries: env.maxRetries,
  }

  const sources = await Promise.allSettled([
    scrapeDiarySource(options),
    scrapeCouncilSource(options),
    scrapeTenderSource(options),
  ])

  const estimates: SourceEstimate[] = []
  const errors: string[] = []

  collectEstimate("diario-oficial", sources[0], estimates, errors)
  collectEstimate("atas-camara", sources[1], estimates, errors)
  collectEstimate("licitacoes", sources[2], estimates, errors)

  const totalSummaryInputTokens = estimates.reduce((sum, estimate) => sum + estimate.estimatedSummaryInputTokens, 0)
  const totalSummaryOutputTokens = estimates.reduce((sum, estimate) => sum + estimate.estimatedSummaryOutputTokens, 0)
  const totalEmbeddingTokens = estimates.reduce((sum, estimate) => sum + estimate.estimatedEmbeddingTokens, 0)
  const totalItems = estimates.reduce((sum, estimate) => sum + estimate.items, 0)

  const output = {
    ok: errors.length === 0,
    summaryModel: env.openAiSummaryModel,
    totalItems,
    totalSummaryInputTokens,
    totalSummaryOutputTokens,
    totalEmbeddingTokens,
    estimatedOpenAiSummaryCostUsd: estimateOpenAiSummaryCost(
      env.openAiSummaryModel,
      totalSummaryInputTokens,
      totalSummaryOutputTokens,
    ),
    estimatedOpenAiEmbeddingCostUsd: estimateOpenAiEmbeddingCost(totalEmbeddingTokens),
    sources: estimates,
    errors,
    notes: [
      "Estimativa usa chars/4 como aproximação conservadora.",
      "Resumo usa OpenAI Responses API e o modelo configurado em OPENAI_SUMMARY_MODEL.",
      "Output estimado em 220 tokens por item.",
      "Itens skipped por checksum não gastariam IA no fluxo real.",
    ],
  }

  logger.info("ai estimate finished", output)
  return output
}

function collectEstimate(
  source: string,
  result: PromiseSettledResult<ScrapedItem[]>,
  estimates: SourceEstimate[],
  errors: string[],
): void {
  if (result.status === "rejected") {
    errors.push(`${source}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`)
    return
  }

  const items = result.value
  const rawChars = items.reduce((sum, item) => sum + item.rawText.length, 0)
  estimates.push({
    source,
    items: items.length,
    rawChars,
    estimatedSummaryInputTokens: estimateTokens(rawChars + items.length * 900),
    estimatedSummaryOutputTokens: items.length * 220,
    estimatedEmbeddingTokens: estimateTokens(rawChars),
    flaggedSuspected: items.filter((item) => item.kind === "diary-edition" && item.flaggedSuspected).length,
    lowConfidence: items.filter((item) => item.parseConfidence < 0.65).length,
  })
}

function estimateTokens(chars: number): number {
  return Math.ceil(chars / 4)
}

function estimateOpenAiEmbeddingCost(tokens: number): number {
  return Number(((tokens / 1_000_000) * 0.02).toFixed(6))
}

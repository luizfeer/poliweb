import type { WorkerEnv } from "../runtime/env.js"
import { logger } from "../runtime/logger.js"
import { createCounters, toJobResult } from "../runtime/result.js"
import { summarizeOfficialText } from "../ai/summarize.js"
import { PostgrestClient } from "../persistence/postgrest.js"

type CivicNewsPending = {
  id: string
  source: string
  title: string
  excerpt: string | null
  raw_text: string | null
  source_url: string
}

type CouncilPropositionPending = {
  id: string
  proposition_type: string | null
  number: string | null
  title: string
  author: string | null
  situation: string | null
  raw_text: string | null
  source_url: string
}

export async function runSummarizePending(env: WorkerEnv) {
  const db = new PostgrestClient({
    supabaseUrl: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  })
  const city = await db.findCityBySlug(env.citySlug)
  const aiJob = await db.createAiJob({
    cityId: city.id,
    jobType: "summarize:pending",
    inputRef: { city_slug: city.slug, scope: "news_and_propositions" },
    model: env.openAiSummaryModel,
  })
  const counters = createCounters()
  let tokensInput = 0
  let tokensOutput = 0
  let costUsd = 0

  try {
    const news = await db.selectRows<CivicNewsPending>(
      "civic_news",
      { city_id: city.id, summary_ai: "is.null" },
      "id,source,title,excerpt,raw_text,source_url",
    )
    for (const item of news.slice(0, 80)) {
      counters.processed += 1
      const rawText = [item.excerpt, item.raw_text].filter(Boolean).join("\n")
      if (!rawText) {
        counters.skipped += 1
        continue
      }

      try {
        const summary = await summarizeOfficialText({
          cityId: city.id,
          title: item.title,
          rawText,
          sourceUrl: item.source_url,
          env,
        })
        await db.updateRows("civic_news", { id: item.id }, { summary_ai: summary.text })
        tokensInput += summary.tokensInput ?? 0
        tokensOutput += summary.tokensOutput ?? 0
        costUsd += summary.costUsd ?? 0
        counters.updated += 1
      } catch (error) {
        counters.errors.push(error instanceof Error ? error.message : String(error))
      }
    }

    const propositions = await db.selectRows<CouncilPropositionPending>(
      "council_propositions",
      { city_id: city.id, summary_ai: "is.null" },
      "id,proposition_type,number,title,author,situation,raw_text,source_url",
    )
    for (const item of propositions.slice(0, 50)) {
      counters.processed += 1
      if (!item.raw_text) {
        counters.skipped += 1
        continue
      }

      try {
        const rawText = [
          `Tipo: ${item.proposition_type ?? "proposição"}`,
          `Número: ${item.number ?? "não informado"}`,
          `Situação: ${item.situation ?? "não informada"}`,
          `Autor: ${item.author ?? "não informado"}`,
          item.raw_text,
        ].join("\n")
        const summary = await summarizeOfficialText({
          cityId: city.id,
          title: item.title,
          rawText,
          sourceUrl: item.source_url,
          env,
        })
        await db.updateRows("council_propositions", { id: item.id }, { summary_ai: summary.text })
        tokensInput += summary.tokensInput ?? 0
        tokensOutput += summary.tokensOutput ?? 0
        costUsd += summary.costUsd ?? 0
        counters.updated += 1
      } catch (error) {
        counters.errors.push(error instanceof Error ? error.message : String(error))
      }
    }

    const result = toJobResult(counters)
    await db.finishAiJob(aiJob.id, {
      status: result.ok ? "completed" : "failed",
      outputRef: result,
      error: result.errors.length > 0 ? result.errors.join("\n") : null,
      tokensInput,
      tokensOutput,
      costUsd: Number(costUsd.toFixed(6)),
    })
    logger.info("summary job finished", { ...result, tokensInput, tokensOutput, costUsd })
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    counters.errors.push(message)
    const result = toJobResult(counters)
    await db.finishAiJob(aiJob.id, { status: "failed", outputRef: result, error: message })
    return result
  }
}

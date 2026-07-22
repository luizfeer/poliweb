import type { JobName, ScrapedItem } from "../types.js"
import type { WorkerEnv } from "../runtime/env.js"
import { createCounters, toJobResult } from "../runtime/result.js"
import { logger } from "../runtime/logger.js"
import { PostgrestClient } from "../persistence/postgrest.js"
import { TransparencyRepository } from "../persistence/transparency-repository.js"
import {
  scrapeCityHallNewsSource,
  scrapeCouncilNewsSource,
  scrapeCouncilPropositionsSource,
  scrapeCouncilSource,
  scrapeDiarySource,
  scrapeTenderSource,
} from "../sources/official-sources.js"

export async function runScrapeJob(
  jobName: Extract<
    JobName,
    | "scrape:diario"
    | "scrape:atas"
    | "scrape:licitacoes"
    | "scrape:noticias-camara"
    | "scrape:noticias-prefeitura"
    | "scrape:proposicoes"
    | "scrape:all"
  >,
  env: WorkerEnv,
) {
  const db = new PostgrestClient({
    supabaseUrl: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  })
  const city = await db.findCityBySlug(env.citySlug)
  const aiJob = await db.createAiJob({
    cityId: city.id,
    jobType: jobName,
    inputRef: { city_slug: city.slug },
  })
  const counters = createCounters()

  try {
    const items = await collectItems(jobName, env)
    const repository = new TransparencyRepository(db)
    await repository.saveItems(city, items, counters)
    const result = toJobResult(counters)
    await db.finishAiJob(aiJob.id, {
      status: result.ok ? "completed" : "failed",
      outputRef: result,
      error: result.errors.length > 0 ? result.errors.join("\n") : null,
    })
    logger.info("scrape job finished", { job: jobName, ...result })
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    counters.errors.push(message)
    const result = toJobResult(counters)
    await db.finishAiJob(aiJob.id, {
      status: "failed",
      outputRef: result,
      error: message,
    })
    logger.error("scrape job failed", { job: jobName, error: message })
    return result
  }
}

async function collectItems(jobName: JobName, env: WorkerEnv): Promise<ScrapedItem[]> {
  const options = {
    timeoutMs: env.httpTimeoutMs,
    maxRetries: env.maxRetries,
  }

  if (jobName === "scrape:diario") {
    return scrapeDiarySource(options)
  }
  if (jobName === "scrape:atas") {
    return scrapeCouncilSource(options)
  }
  if (jobName === "scrape:licitacoes") {
    return scrapeTenderSource(options)
  }
  if (jobName === "scrape:noticias-camara") {
    return scrapeCouncilNewsSource(options)
  }
  if (jobName === "scrape:noticias-prefeitura") {
    return scrapeCityHallNewsSource(options)
  }
  if (jobName === "scrape:proposicoes") {
    return scrapeCouncilPropositionsSource(options)
  }

  const [diaries, meetings, tenders, councilNews, cityHallNews, propositions] = await Promise.all([
    scrapeDiarySource(options),
    scrapeCouncilSource(options),
    scrapeTenderSource(options),
    scrapeCouncilNewsSource(options),
    scrapeCityHallNewsSource(options),
    scrapeCouncilPropositionsSource(options),
  ])
  return [...diaries, ...meetings, ...tenders, ...councilNews, ...cityHallNews, ...propositions]
}

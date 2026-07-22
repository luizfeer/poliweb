import type { WorkerEnv } from "../runtime/env.js"
import { embedText } from "../ai/embeddings.js"
import { PostgrestClient } from "../persistence/postgrest.js"
import { logger } from "../runtime/logger.js"
import { createCounters, toJobResult } from "../runtime/result.js"

type DiaryActForEmbedding = {
  id: string
  title: string | null
  summary_ai: string | null
  raw_text: string | null
}

type DiaryRow = {
  id: string
}

type ExistingEmbedding = {
  id: string
}

export async function runEmbedPending(env: WorkerEnv) {
  const db = new PostgrestClient({
    supabaseUrl: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  })
  const city = await db.findCityBySlug(env.citySlug)
  const aiJob = await db.createAiJob({
    cityId: city.id,
    jobType: "embed:pending",
    inputRef: { city_slug: city.slug },
    model: "text-embedding-3-small",
  })
  const counters = createCounters()

  try {
    const diaries = await db.selectRows<DiaryRow>("official_diaries", { city_id: city.id }, "id")
    for (const diary of diaries) {
      const acts = await db.selectRows<DiaryActForEmbedding>(
        "diary_acts",
        { diary_id: diary.id },
        "id,title,summary_ai,raw_text",
      )
      for (const act of acts.slice(0, 50)) {
        counters.processed += 1
        const existing = await db.selectRows<ExistingEmbedding>(
          "embeddings",
          { entity_type: "diary_act", entity_id: act.id },
          "id",
        )
        if (existing[0]) {
          counters.skipped += 1
          continue
        }

        const content = [act.title, act.summary_ai, act.raw_text?.slice(0, 2000)].filter(Boolean).join("\n")
        if (!content) {
          counters.skipped += 1
          continue
        }

        try {
          const result = await embedText({ text: content, env })
          await db.insertRows("embeddings", [
            {
              city_id: city.id,
              entity_type: "diary_act",
              entity_id: act.id,
              content,
              embedding: result.embedding,
            },
          ])
          counters.inserted += 1
        } catch (error) {
          counters.errors.push(error instanceof Error ? error.message : String(error))
        }
      }
    }

    const result = toJobResult(counters)
    await db.finishAiJob(aiJob.id, {
      status: result.ok ? "completed" : "failed",
      outputRef: result,
      error: result.errors.length > 0 ? result.errors.join("\n") : null,
    })
    logger.info("embedding job finished", result)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    counters.errors.push(message)
    const result = toJobResult(counters)
    await db.finishAiJob(aiJob.id, { status: "failed", outputRef: result, error: message })
    return result
  }
}

import type { WorkerEnv } from "../runtime/env.js"
import { PostgrestClient } from "../persistence/postgrest.js"
import { logger } from "../runtime/logger.js"
import { createCounters, toJobResult } from "../runtime/result.js"

export async function runModerateBacklog(env: WorkerEnv) {
  const db = new PostgrestClient({
    supabaseUrl: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  })
  const city = await db.findCityBySlug(env.citySlug)
  const aiJob = await db.createAiJob({
    cityId: city.id,
    jobType: "moderate:backlog",
    inputRef: { city_slug: city.slug, mode: "placeholder" },
  })
  const counters = createCounters()

  const result = toJobResult(counters)
  await db.finishAiJob(aiJob.id, {
    status: "completed",
    outputRef: {
      ...result,
      note: "Backlog moderation runner scaffolded. Wire table-specific classifiers after UGC schema stabilizes.",
    },
  })
  logger.info("moderation backlog scaffold finished", result)
  return result
}

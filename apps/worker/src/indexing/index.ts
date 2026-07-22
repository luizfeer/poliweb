import type { WorkerEnv } from "../runtime/env.js"
import { embedText } from "../ai/embeddings.js"
import { PostgrestClient } from "../persistence/postgrest.js"
import { logger } from "../runtime/logger.js"
import { createCounters, toJobResult } from "../runtime/result.js"
import { buildDocument } from "./build-document.js"
import { fetchContent } from "./fetch-content.js"
import { deleteEmbedding, upsertEmbedding } from "./upsert.js"
import type { IndexingQueueItem } from "./types.js"

const BATCH_SIZE = 20
const MAX_ATTEMPTS = 3

export async function runSemanticIndexing(env: WorkerEnv) {
  const db = new PostgrestClient({
    supabaseUrl: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  })
  const city = await db.findCityBySlug(env.citySlug)
  const aiJob = await db.createAiJob({
    cityId: city.id,
    jobType: "indexing:semantic",
    inputRef: { city_slug: city.slug, batch_size: BATCH_SIZE },
    model: env.openAiEmbeddingModel,
  })
  const counters = createCounters()

  try {
    const items = await db.selectWithParams<IndexingQueueItem>("indexing_queue", {
      select: "id,entity_type,entity_id,city_id,operation,attempts",
      city_id: `eq.${city.id}`,
      processed_at: "is.null",
      attempts: `lt.${MAX_ATTEMPTS}`,
      order: "enqueued_at.asc",
      limit: BATCH_SIZE,
    })

    for (const item of items) {
      counters.processed += 1
      try {
        if (item.operation === "delete") {
          await deleteEmbedding(db, {
            entityType: item.entity_type,
            entityId: item.entity_id,
            cityId: item.city_id,
          })
          counters.updated += 1
        } else {
          const content = await fetchContent(db, item.entity_type, item.entity_id)
          if (!content) {
            await deleteEmbedding(db, {
              entityType: item.entity_type,
              entityId: item.entity_id,
              cityId: item.city_id,
            })
            counters.skipped += 1
          } else {
            const document = buildDocument(item.entity_type, content)
            if (!document) {
              counters.skipped += 1
            } else {
              const contentHash = await sha256(document)
              const embedding = await embedText({ text: document, env })
              const result = await upsertEmbedding(db, {
                entityType: item.entity_type,
                entityId: item.entity_id,
                cityId: item.city_id,
                content: document,
                contentHash,
                embedding: embedding.embedding,
              })

              if (result === "inserted") counters.inserted += 1
              if (result === "updated") counters.updated += 1
              if (result === "skipped") counters.skipped += 1
            }
          }
        }

        await db.updateRows("indexing_queue", { id: item.id }, { processed_at: new Date().toISOString() })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        counters.errors.push(message)
        await db.updateRows("indexing_queue", { id: item.id }, {
          attempts: item.attempts + 1,
          last_error: message,
        })
      }
    }

    const result = toJobResult(counters)
    await db.finishAiJob(aiJob.id, {
      status: result.ok ? "completed" : "failed",
      outputRef: result,
      error: result.errors.length > 0 ? result.errors.join("\n") : null,
    })
    logger.info("semantic indexing finished", result)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    counters.errors.push(message)
    const result = toJobResult(counters)
    await db.finishAiJob(aiJob.id, { status: "failed", outputRef: result, error: message })
    return result
  }
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

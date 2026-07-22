import type { WorkerEnv } from "../runtime/env.js"
import { logger } from "../runtime/logger.js"

const TOURISM_TYPES = [
  { type: "attraction", table: "attractions" },
  { type: "tour_package", table: "tour_packages" },
  { type: "accommodation", table: "accommodations" },
  { type: "restaurant", table: "restaurants" },
  { type: "fishing_guide", table: "fishing_guides" },
] as const

type EntityRow = { id: string; city_id: string }

export async function runReindexTourism(env: WorkerEnv): Promise<void> {
  const restUrl = env.supabaseUrl.replace(/\/$/, "") + "/rest/v1"
  const headers = {
    apikey: env.supabaseServiceRoleKey,
    authorization: `Bearer ${env.supabaseServiceRoleKey}`,
    "content-type": "application/json",
  }

  const cityRes = await fetch(`${restUrl}/cities?slug=eq.${env.citySlug}&select=id,slug`, { headers })
  if (!cityRes.ok) throw new Error(`cities fetch failed: HTTP ${cityRes.status}`)
  const cities = (await cityRes.json()) as Array<{ id: string; slug: string }>
  const city = cities[0]
  if (!city) throw new Error(`city not found: ${env.citySlug}`)

  let enqueued = 0
  const errors: string[] = []

  for (const { type, table } of TOURISM_TYPES) {
    try {
      const entitiesRes = await fetch(
        `${restUrl}/${table}?city_id=eq.${city.id}&status=eq.published&select=id,city_id`,
        { headers },
      )
      if (!entitiesRes.ok) throw new Error(`${table} fetch failed: HTTP ${entitiesRes.status}`)
      const entities = (await entitiesRes.json()) as EntityRow[]

      if (entities.length === 0) {
        logger.info("tourism reindex: no entities", { type })
        continue
      }

      // Remove todas as linhas do tipo para poder re-inserir (constraint é entity_type,entity_id)
      const delRes = await fetch(
        `${restUrl}/indexing_queue?entity_type=eq.${type}&city_id=eq.${city.id}`,
        { method: "DELETE", headers },
      )
      if (!delRes.ok) {
        throw new Error(`indexing_queue delete failed: HTTP ${delRes.status} ${await delRes.text()}`)
      }

      const now = new Date().toISOString()
      const rows = entities.map((e) => ({
        entity_type: type,
        entity_id: e.id,
        city_id: e.city_id,
        operation: "upsert",
        attempts: 0,
        enqueued_at: now,
      }))

      const insertRes = await fetch(`${restUrl}/indexing_queue`, {
        method: "POST",
        headers: { ...headers, prefer: "return=minimal" },
        body: JSON.stringify(rows),
      })
      if (!insertRes.ok) {
        throw new Error(`indexing_queue insert failed: HTTP ${insertRes.status} ${await insertRes.text()}`)
      }

      enqueued += entities.length
      logger.info("tourism reindex enqueued", { type, count: entities.length })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      errors.push(`${type}: ${msg}`)
      logger.error("tourism reindex failed", { type, error: msg })
    }
  }

  logger.info("reindex:tourism finished", { enqueued, errors })
  if (errors.length > 0) throw new Error(errors.join("; "))
}

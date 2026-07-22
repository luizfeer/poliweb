import type { WorkerEnv } from "../runtime/env.js"
import { logger } from "../runtime/logger.js"

export async function runAnalyticsAggregate(env: WorkerEnv): Promise<void> {
  const rpcUrl = env.supabaseUrl.replace(/\/$/, "") + "/rest/v1/rpc"
  const headers = {
    apikey: env.supabaseServiceRoleKey,
    authorization: `Bearer ${env.supabaseServiceRoleKey}`,
    "content-type": "application/json",
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const date = yesterday.toISOString().split("T")[0]!

  const aggregateRes = await fetch(`${rpcUrl}/aggregate_business_daily_stats`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_date: date }),
  })
  if (!aggregateRes.ok) {
    throw new Error(
      `aggregate_business_daily_stats failed: HTTP ${aggregateRes.status} ${await aggregateRes.text()}`,
    )
  }
  logger.info("analytics: daily stats aggregated", { date })

  const purgeRes = await fetch(`${rpcUrl}/purge_old_business_events`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  })
  if (!purgeRes.ok) {
    throw new Error(
      `purge_old_business_events failed: HTTP ${purgeRes.status} ${await purgeRes.text()}`,
    )
  }
  const deleted = (await purgeRes.json()) as number
  logger.info("analytics: old events purged", { deleted })

  logger.info("analytics:aggregate finished", { date, deleted })
}

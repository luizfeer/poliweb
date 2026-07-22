import type { WorkerEnv } from "../runtime/env.js"
import { logger } from "../runtime/logger.js"
import { deleteFromR2 } from "../media/r2.js"

type OrphanAssetRow = {
  id: string
  storage_path: string
  cdn_url: string
  city_id: string
  content_type: string
  metadata: Record<string, unknown> | null
  created_at: string
}

type ThumbnailMetadata = {
  thumbnailStoragePath?: unknown
  thumbnail?: { storagePath?: unknown }
}

const DEFAULT_GRACE_DAYS = 14
const MAX_PER_RUN = 1000

/**
 * Varre media_assets sem media_links há mais de N dias e deleta do R2 + marca como deleted.
 *
 * Padrão 14 dias — dá folga pro admin que fez upload mas voltou pra terminar o form depois.
 * Override via env MEDIA_SWEEP_GRACE_DAYS.
 *
 * Roda no máximo MAX_PER_RUN órfãos por execução. Se sobrar, a próxima execução pega.
 */
export async function runMediaSweepOrphans(env: WorkerEnv): Promise<void> {
  const restUrl = env.supabaseUrl.replace(/\/$/, "") + "/rest/v1"
  const headers = {
    apikey: env.supabaseServiceRoleKey,
    authorization: `Bearer ${env.supabaseServiceRoleKey}`,
    "content-type": "application/json",
  }

  const graceDays = readGraceDays()
  const cutoffIso = new Date(Date.now() - graceDays * 86400 * 1000).toISOString()

  logger.info("media sweep started", { graceDays, cutoffIso, maxPerRun: MAX_PER_RUN })

  if (!env.r2Endpoint || !env.r2Bucket || !env.r2AccessKeyId || !env.r2SecretAccessKey) {
    logger.error("media sweep aborted — R2 not configured")
    return
  }

  // 1. Pega candidatos: assets ativos com idade > grace.
  const params = new URLSearchParams({
    select: "id,storage_path,cdn_url,city_id,content_type,metadata,created_at",
    status: "eq.active",
    created_at: `lt.${cutoffIso}`,
    limit: String(MAX_PER_RUN),
    order: "created_at.asc",
  })

  const candRes = await fetch(`${restUrl}/media_assets?${params.toString()}`, { headers })
  if (!candRes.ok) {
    const text = await candRes.text()
    logger.error("media sweep candidates query failed", {
      status: candRes.status,
      body: text.slice(0, 200),
    })
    return
  }

  const candidates = (await candRes.json()) as OrphanAssetRow[]
  if (candidates.length === 0) {
    logger.info("media sweep finished — no candidates")
    return
  }

  // 2. Filtra os que ainda têm link.
  const idsParam = candidates.map((c) => c.id).join(",")
  const linksRes = await fetch(
    `${restUrl}/media_links?select=asset_id&asset_id=in.(${idsParam})`,
    { headers },
  )
  if (!linksRes.ok) {
    const text = await linksRes.text()
    logger.error("media sweep links query failed", {
      status: linksRes.status,
      body: text.slice(0, 200),
    })
    return
  }
  const linkedIds = new Set(
    ((await linksRes.json()) as Array<{ asset_id: string }>).map((r) => r.asset_id),
  )

  const orphans = candidates.filter((c) => !linkedIds.has(c.id))

  logger.info("media sweep candidates filtered", {
    candidates: candidates.length,
    linked: linkedIds.size,
    orphans: orphans.length,
  })

  let deleted = 0
  let errors = 0

  for (const orphan of orphans) {
    try {
      await deleteFromR2(orphan.storage_path)

      const thumbPath = extractThumbnailPath(orphan.metadata, orphan.storage_path, orphan.content_type)
      if (thumbPath) {
        await deleteFromR2(thumbPath).catch(() => undefined)
      }

      const updateRes = await fetch(`${restUrl}/media_assets?id=eq.${orphan.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "deleted" }),
      })
      if (!updateRes.ok) {
        const text = await updateRes.text()
        logger.error("media sweep mark-deleted failed", {
          assetId: orphan.id,
          status: updateRes.status,
          body: text.slice(0, 200),
        })
        errors += 1
        continue
      }

      deleted += 1
      logger.info("media sweep deleted orphan", {
        assetId: orphan.id,
        cdnUrl: orphan.cdn_url,
        createdAt: orphan.created_at,
      })
    } catch (error) {
      errors += 1
      logger.error("media sweep error", {
        assetId: orphan.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  logger.info("media sweep finished", {
    graceDays,
    candidates: candidates.length,
    orphans: orphans.length,
    deleted,
    errors,
  })
}

function readGraceDays(): number {
  const raw = process.env["MEDIA_SWEEP_GRACE_DAYS"]
  if (!raw) return DEFAULT_GRACE_DAYS
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_GRACE_DAYS
  return Math.floor(parsed)
}

function extractThumbnailPath(
  metadata: Record<string, unknown> | null,
  storagePath: string,
  contentType: string,
): string | null {
  if (!metadata || typeof metadata !== "object") return null
  const m = metadata as ThumbnailMetadata
  if (typeof m.thumbnailStoragePath === "string" && m.thumbnailStoragePath) {
    return m.thumbnailStoragePath
  }
  if (m.thumbnail && typeof m.thumbnail === "object") {
    const sp = m.thumbnail.storagePath
    if (typeof sp === "string" && sp) return sp
  }
  if (contentType.startsWith("video/")) {
    return storagePath.replace(/\.[^./]+$/, ".thumb.jpg")
  }
  return null
}

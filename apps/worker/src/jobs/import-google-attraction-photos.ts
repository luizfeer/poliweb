import crypto from "node:crypto"
import type { WorkerEnv } from "../runtime/env.js"
import { logger } from "../runtime/logger.js"
import { PostgrestClient } from "../persistence/postgrest.js"
import type { City, JsonValue } from "../types.js"
import { assertPublicMedia, processAndUpload, type ProcessedUpload } from "../media/processor.js"

type Options = {
  attractionId: string | null
  dryRun: boolean
  limit: number
}

type AttractionRow = {
  id: string
  city_id: string
  slug: string
  name: string
  cover_url: string | null
  photos: JsonValue | null
  google_photos: JsonValue | null
}

type MediaAssetRow = {
  id: string
  cdn_url: string
}

type MediaLinkRow = {
  id: string
}

type PendingPhoto = {
  name: string
  role: "cover" | "gallery"
  attribution: string | null
}

type ImportedPhoto = PendingPhoto & {
  asset_id: string
  cdn_url: string
  imported_at: string
}

const PLACES_BASE_URL = "https://places.googleapis.com/v1"

export async function runGoogleAttractionPhotoImport(env: WorkerEnv, argv: string[]): Promise<void> {
  const options = parseOptions(argv)
  assertEnv(env)

  const db = new PostgrestClient({
    supabaseUrl: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  })
  const city = await db.findCityBySlug(env.citySlug)
  const attractions = await loadAttractionsWithPendingPhotos(db, city, options)
  let processed = 0
  let uploaded = 0
  const errors: string[] = []

  logger.info("google attraction photo import loaded", {
    city_slug: city.slug,
    attraction_id: options.attractionId,
    dry_run: options.dryRun,
    attractions: attractions.length,
  })

  for (const attraction of attractions) {
    const allPendingPhotos = readPendingPhotos(attraction.google_photos)
    const pendingPhotos = allPendingPhotos.slice(0, options.limit)
    const importedPhotos = readImportedPhotos(attraction.google_photos)
    const remainingPhotos = allPendingPhotos.slice(options.limit)

    for (const [index, photo] of pendingPhotos.entries()) {
      processed += 1
      try {
        if (importedPhotos.some((item) => item.name === photo.name)) continue
        if (options.dryRun) {
          logger.info("google attraction photo dry run", { attraction_id: attraction.id, photo: photo.name, role: photo.role })
          continue
        }

        const downloaded = await downloadGooglePhoto(photo.name, env.googlePlacesApiKey)
        const filename = `google-${attraction.id}-${index + 1}.jpg`
        const fallbackStoragePath = buildMediaPath({
          citySlug: city.slug,
          attractionId: attraction.id,
          role: photo.role,
          filename,
          unique: photo.role === "gallery",
        })
        const uploadedFile = await processAndUpload(env, {
          bytes: downloaded.bytes,
          originalContentType: downloaded.contentType,
          filename,
          citySlug: city.slug,
          entityType: "attraction",
          entityId: attraction.id,
          role: photo.role,
          unique: photo.role === "gallery",
          fallbackStoragePath,
        })
        await assertPublicMedia(uploadedFile.cdnUrl)
        const asset = await upsertMediaAsset(db, city.id, uploadedFile, photo)
        await upsertMediaLink(db, city.id, attraction.id, asset.id, photo.role)
        await syncAttractionMedia(db, attraction, photo.role, asset.cdn_url)
        importedPhotos.push({ ...photo, asset_id: asset.id, cdn_url: asset.cdn_url, imported_at: new Date().toISOString() })
        uploaded += 1
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        errors.push(`${attraction.slug}:${photo.name}: ${message}`)
        remainingPhotos.push(photo)
      }
    }

    if (!options.dryRun) {
      await updateGooglePhotos(db, attraction, importedPhotos, remainingPhotos, errors.slice(-10))
    }
  }

  logger.info("google attraction photo import finished", { processed, uploaded, errors: errors.slice(0, 20) })
}

function parseOptions(argv: string[]): Options {
  let attractionId: string | null = null
  let dryRun = false
  let limit = 10
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--dry-run") dryRun = true
    if (arg === "--attraction-id") {
      const next = argv[index + 1]
      if (!next) throw new Error("--attraction-id requires an id")
      attractionId = next
      index += 1
    }
    if (arg === "--limit") {
      const next = argv[index + 1]
      if (!next) throw new Error("--limit requires a number")
      const parsed = Number(next)
      if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("--limit must be a positive integer")
      limit = parsed
      index += 1
    }
  }
  return { attractionId, dryRun, limit }
}

function assertEnv(env: WorkerEnv): asserts env is WorkerEnv & {
  googlePlacesApiKey: string
  r2Endpoint: string
  r2Bucket: string
  r2AccessKeyId: string
  r2SecretAccessKey: string
  r2PublicBaseUrl: string
} {
  const missing = [
    ["GOOGLE_PLACES_API_KEY", env.googlePlacesApiKey],
    ["R2_ENDPOINT", env.r2Endpoint],
    ["R2_BUCKET", env.r2Bucket],
    ["R2_ACCESS_KEY_ID", env.r2AccessKeyId],
    ["R2_SECRET_ACCESS_KEY", env.r2SecretAccessKey],
    ["R2_PUBLIC_BASE_URL", env.r2PublicBaseUrl],
  ].filter(([, value]) => !value)
  if (missing.length > 0) throw new Error(`Missing env for Google photo import: ${missing.map(([key]) => key).join(", ")}`)
}

async function loadAttractionsWithPendingPhotos(db: PostgrestClient, city: City, options: Options): Promise<AttractionRow[]> {
  const filters: Record<string, string> = {
    select: "id,city_id,slug,name,cover_url,photos,google_photos",
    city_id: `eq.${city.id}`,
    google_photos: "not.is.null",
  }
  if (options.attractionId) filters.id = `eq.${options.attractionId}`
  const rows = await db.selectWithParams<AttractionRow>("attractions", filters)
  return rows.filter((row) => readPendingPhotos(row.google_photos).length > 0)
}

async function downloadGooglePhoto(photoName: string, apiKey: string): Promise<{ bytes: Buffer; contentType: string }> {
  const url = new URL(`${PLACES_BASE_URL}/${photoName}/media`)
  url.searchParams.set("maxWidthPx", "1600")
  url.searchParams.set("key", apiKey)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Google photo download failed HTTP ${response.status}: ${await response.text().catch(() => "")}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length === 0) throw new Error("Google photo download returned an empty file")
  return { bytes, contentType: response.headers.get("content-type") ?? "image/jpeg" }
}

async function upsertMediaAsset(db: PostgrestClient, cityId: string, uploaded: ProcessedUpload, photo: PendingPhoto): Promise<MediaAssetRow> {
  const rows = await db.upsertRows<MediaAssetRow>("media_assets", [{
    city_id: cityId,
    uploaded_by_profile_id: null,
    provider: "r2",
    bucket: uploaded.bucket,
    storage_path: uploaded.storagePath,
    cdn_url: uploaded.cdnUrl,
    original_filename: uploaded.originalFilename,
    content_type: uploaded.contentType,
    size_bytes: uploaded.sizeBytes,
    checksum_sha256: uploaded.checksumSha256,
    alt_text: photo.attribution ? `Foto do Google. Credito: ${photo.attribution}` : "Foto importada do Google.",
    metadata: { source: "google_places", google_photo_name: photo.name, attribution: photo.attribution },
  }], "bucket,storage_path")
  const asset = rows[0]
  if (!asset) throw new Error("media_assets upsert returned no row")
  return asset
}

async function upsertMediaLink(db: PostgrestClient, cityId: string, attractionId: string, assetId: string, role: "cover" | "gallery"): Promise<void> {
  if (role === "cover") {
    await db.updateRows("media_links", { city_id: cityId, entity_type: "attraction", entity_id: attractionId, role }, { is_primary: false })
  }
  const existingLinks = await db.selectRows<MediaLinkRow>("media_links", { city_id: cityId, entity_type: "attraction", entity_id: attractionId, role }, "id")
  await db.upsertRows<MediaLinkRow>("media_links", [{
    city_id: cityId,
    asset_id: assetId,
    entity_type: "attraction",
    entity_id: attractionId,
    role,
    position: existingLinks.length,
    is_primary: role === "cover",
  }], "asset_id,entity_type,entity_id,role")
}

async function syncAttractionMedia(db: PostgrestClient, attraction: AttractionRow, role: "cover" | "gallery", url: string): Promise<void> {
  if (role === "cover") {
    await db.updateRows("attractions", { id: attraction.id, city_id: attraction.city_id }, { cover_url: url })
    return
  }
  const photos = Array.isArray(attraction.photos) ? attraction.photos.filter((item): item is string => typeof item === "string") : []
  if (!photos.includes(url)) {
    attraction.photos = [...photos, url]
    await db.updateRows("attractions", { id: attraction.id, city_id: attraction.city_id }, { photos: attraction.photos })
  }
}

async function updateGooglePhotos(db: PostgrestClient, attraction: AttractionRow, importedPhotos: ImportedPhoto[], remainingPhotos: PendingPhoto[], recentErrors: string[]): Promise<void> {
  const source = isRecord(attraction.google_photos) ? attraction.google_photos : {}
  const updated = { ...source, pending_photos: remainingPhotos, imported_photos: importedPhotos, photo_imported_at: new Date().toISOString(), photo_import_errors: recentErrors }
  attraction.google_photos = updated
  await db.updateRows("attractions", { id: attraction.id, city_id: attraction.city_id }, { google_photos: updated })
}

function readPendingPhotos(source: JsonValue | null): PendingPhoto[] {
  if (!isRecord(source) || !Array.isArray(source.pending_photos)) return []
  return source.pending_photos.map(normalizePendingPhoto).filter((item): item is PendingPhoto => Boolean(item))
}

function readImportedPhotos(source: JsonValue | null): ImportedPhoto[] {
  if (!isRecord(source) || !Array.isArray(source.imported_photos)) return []
  return source.imported_photos.filter(isRecord).map((item): ImportedPhoto => ({
    name: typeof item.name === "string" ? item.name : "",
    role: item.role === "cover" ? "cover" : "gallery",
    attribution: typeof item.attribution === "string" ? item.attribution : null,
    asset_id: typeof item.asset_id === "string" ? item.asset_id : "",
    cdn_url: typeof item.cdn_url === "string" ? item.cdn_url : "",
    imported_at: typeof item.imported_at === "string" ? item.imported_at : "",
  })).filter((item) => item.name && item.asset_id && item.cdn_url)
}

function normalizePendingPhoto(item: JsonValue): PendingPhoto | null {
  if (typeof item === "string") return { name: item, role: "gallery", attribution: null }
  if (!isRecord(item) || typeof item.name !== "string") return null
  return { name: item.name, role: item.role === "cover" ? "cover" : "gallery", attribution: typeof item.attribution === "string" ? item.attribution : null }
}

function buildMediaPath(input: { citySlug: string; attractionId: string; role: "cover" | "gallery"; filename: string; unique: boolean }): string {
  const extension = extensionFromFilename(input.filename)
  const basename = input.unique ? crypto.randomUUID() : input.role
  return `${input.citySlug}/attraction/${input.attractionId}/${input.role}/${basename}.${extension}`
}

function extensionFromFilename(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "")
  return extension && extension.length <= 5 ? extension : "bin"
}

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

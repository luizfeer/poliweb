import crypto from "node:crypto"
import type { WorkerEnv } from "../runtime/env.js"
import { logger } from "../runtime/logger.js"
import { PostgrestClient } from "../persistence/postgrest.js"
import type { City, JsonValue } from "../types.js"
import { assertPublicMedia, processAndUpload, type ProcessedUpload } from "../media/processor.js"

type Options = {
  businessId: string | null
  dryRun: boolean
  limit: number
}

type BusinessRow = {
  id: string
  city_id: string
  slug: string
  name: string
  cover_url: string | null
  photos: JsonValue | null
  import_source: JsonValue | null
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

export async function runGoogleBusinessPhotoImport(env: WorkerEnv, argv: string[]): Promise<void> {
  const options = parseOptions(argv)
  assertEnv(env)

  const db = new PostgrestClient({
    supabaseUrl: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  })
  const city = await db.findCityBySlug(env.citySlug)
  const businesses = await loadBusinessesWithPendingPhotos(db, city, options)

  let processed = 0
  let uploaded = 0
  let skipped = 0
  const errors: string[] = []

  logger.info("google business photo import loaded", {
    city_slug: city.slug,
    business_id: options.businessId,
    dry_run: options.dryRun,
    businesses: businesses.length,
  })

  for (const business of businesses) {
    const allPendingPhotos = readPendingPhotos(business.import_source)
    const pendingPhotos = allPendingPhotos.slice(0, options.limit)
    if (pendingPhotos.length === 0) {
      skipped += 1
      continue
    }

    const importedPhotos: ImportedPhoto[] = readImportedPhotos(business.import_source)
    const remainingPhotos: PendingPhoto[] = allPendingPhotos.slice(options.limit)

    for (const [index, photo] of pendingPhotos.entries()) {
      processed += 1
      try {
        const alreadyImported = importedPhotos.some((item) => item.name === photo.name)
        if (alreadyImported) {
          continue
        }

        if (options.dryRun) {
          logger.info("google business photo dry run", {
            business_id: business.id,
            photo: photo.name,
            role: photo.role,
          })
          continue
        }

        const downloaded = await downloadGooglePhoto(photo.name, env.googlePlacesApiKey)
        const filename = `google-${business.id}-${index + 1}.jpg`
        const fallbackStoragePath = buildMediaPath({
          citySlug: city.slug,
          businessId: business.id,
          role: photo.role,
          filename,
          unique: photo.role === "gallery",
        })
        const uploadedFile = await processAndUpload(env, {
          bytes: downloaded.bytes,
          originalContentType: downloaded.contentType,
          filename,
          citySlug: city.slug,
          entityType: "business",
          entityId: business.id,
          role: photo.role,
          unique: photo.role === "gallery",
          fallbackStoragePath,
        })
        await assertPublicMedia(uploadedFile.cdnUrl)
        const asset = await upsertMediaAsset(db, city.id, uploadedFile, photo)
        await upsertMediaLink(db, city.id, business.id, asset.id, photo.role)
        await syncBusinessMedia(db, business, photo.role, asset.cdn_url)
        importedPhotos.push({
          ...photo,
          asset_id: asset.id,
          cdn_url: asset.cdn_url,
          imported_at: new Date().toISOString(),
        })
        uploaded += 1
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        errors.push(`${business.slug}:${photo.name}: ${message}`)
        remainingPhotos.push(photo)
      }
    }

    if (!options.dryRun) {
      await updateImportSource(db, business, importedPhotos, remainingPhotos, errors.slice(-10))
    }
  }

  logger.info("google business photo import finished", {
    processed,
    uploaded,
    skipped,
    errors: errors.slice(0, 20),
  })
}

function parseOptions(argv: string[]): Options {
  let businessId: string | null = null
  let dryRun = false
  let limit = 10

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--dry-run") dryRun = true
    if (arg === "--business-id") {
      const next = argv[index + 1]
      if (!next) throw new Error("--business-id requires an id")
      businessId = next
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

  return { businessId, dryRun, limit }
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

  if (missing.length > 0) {
    throw new Error(`Missing env for Google photo import: ${missing.map(([key]) => key).join(", ")}`)
  }
}

async function loadBusinessesWithPendingPhotos(
  db: PostgrestClient,
  city: City,
  options: Options,
): Promise<BusinessRow[]> {
  const filters: Record<string, string> = {
    select: "id,city_id,slug,name,cover_url,photos,import_source",
    city_id: `eq.${city.id}`,
    import_source: "not.is.null",
  }
  if (options.businessId) {
    filters.id = `eq.${options.businessId}`
  }

  const rows = await db.selectWithParams<BusinessRow>("businesses", filters)
  return rows.filter((row) => readPendingPhotos(row.import_source).length > 0)
}

async function downloadGooglePhoto(
  photoName: string,
  apiKey: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  const url = new URL(`${PLACES_BASE_URL}/${photoName}/media`)
  url.searchParams.set("maxWidthPx", "1600")
  url.searchParams.set("key", apiKey)

  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`Google photo download failed HTTP ${response.status}: ${body}`)
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg"
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length === 0) {
    throw new Error("Google photo download returned an empty file")
  }
  return { bytes, contentType }
}

async function upsertMediaAsset(
  db: PostgrestClient,
  cityId: string,
  uploaded: ProcessedUpload,
  photo: PendingPhoto,
): Promise<MediaAssetRow> {
  const rows = await db.upsertRows<MediaAssetRow>(
    "media_assets",
    [
      {
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
        metadata: {
          source: "google_places",
          google_photo_name: photo.name,
          attribution: photo.attribution,
        },
      },
    ],
    "bucket,storage_path",
  )
  const asset = rows[0]
  if (!asset) {
    throw new Error("media_assets upsert returned no row")
  }
  return asset
}

async function upsertMediaLink(
  db: PostgrestClient,
  cityId: string,
  businessId: string,
  assetId: string,
  role: "cover" | "gallery",
): Promise<void> {
  if (role === "cover") {
    await db.updateRows("media_links", {
      city_id: cityId,
      entity_type: "business",
      entity_id: businessId,
      role,
    }, { is_primary: false })
  }

  const existingLinks = await db.selectRows<MediaLinkRow>("media_links", {
    city_id: cityId,
    entity_type: "business",
    entity_id: businessId,
    role,
  }, "id")

  await db.upsertRows<MediaLinkRow>(
    "media_links",
    [
      {
        city_id: cityId,
        asset_id: assetId,
        entity_type: "business",
        entity_id: businessId,
        role,
        position: existingLinks.length,
        is_primary: role === "cover",
      },
    ],
    "asset_id,entity_type,entity_id,role",
  )
}

async function syncBusinessMedia(
  db: PostgrestClient,
  business: BusinessRow,
  role: "cover" | "gallery",
  url: string,
): Promise<void> {
  if (role === "cover") {
    await db.updateRows("businesses", { id: business.id, city_id: business.city_id }, { cover_url: url })
    return
  }

  const photos = Array.isArray(business.photos)
    ? business.photos.filter((item): item is string => typeof item === "string")
    : []
  if (!photos.includes(url)) {
    business.photos = [...photos, url]
    await db.updateRows("businesses", { id: business.id, city_id: business.city_id }, { photos: business.photos })
  }
}

async function updateImportSource(
  db: PostgrestClient,
  business: BusinessRow,
  importedPhotos: ImportedPhoto[],
  remainingPhotos: PendingPhoto[],
  recentErrors: string[],
): Promise<void> {
  const source = isRecord(business.import_source) ? business.import_source : {}
  const googlePlaces = isRecord(source.google_places) ? source.google_places : {}
  const updated = {
    ...source,
    google_places: {
      ...googlePlaces,
      pending_photos: remainingPhotos,
      imported_photos: importedPhotos,
      photo_imported_at: new Date().toISOString(),
      photo_import_errors: recentErrors,
    },
  }

  business.import_source = updated
  await db.updateRows("businesses", { id: business.id, city_id: business.city_id }, { import_source: updated })
}

function readPendingPhotos(source: JsonValue | null): PendingPhoto[] {
  if (!isRecord(source) || !isRecord(source.google_places) || !Array.isArray(source.google_places.pending_photos)) {
    return []
  }

  return source.google_places.pending_photos
    .map((item) => normalizePendingPhoto(item))
    .filter((item): item is PendingPhoto => Boolean(item))
}

function readImportedPhotos(source: JsonValue | null): ImportedPhoto[] {
  if (!isRecord(source) || !isRecord(source.google_places) || !Array.isArray(source.google_places.imported_photos)) {
    return []
  }

  return source.google_places.imported_photos
    .filter(isRecord)
    .map((item): ImportedPhoto => {
      const role: "cover" | "gallery" = item.role === "cover" ? "cover" : "gallery"
      return {
        name: typeof item.name === "string" ? item.name : "",
        role,
        attribution: typeof item.attribution === "string" ? item.attribution : null,
        asset_id: typeof item.asset_id === "string" ? item.asset_id : "",
        cdn_url: typeof item.cdn_url === "string" ? item.cdn_url : "",
        imported_at: typeof item.imported_at === "string" ? item.imported_at : "",
      }
    })
    .filter((item) => item.name && item.asset_id && item.cdn_url)
}

function normalizePendingPhoto(item: JsonValue): PendingPhoto | null {
  if (typeof item === "string") {
    return { name: item, role: "gallery", attribution: null }
  }
  if (!isRecord(item) || typeof item.name !== "string") {
    return null
  }
  return {
    name: item.name,
    role: item.role === "cover" ? "cover" : "gallery",
    attribution: typeof item.attribution === "string" ? item.attribution : null,
  }
}

function buildMediaPath(input: {
  citySlug: string
  businessId: string
  role: "cover" | "gallery"
  filename: string
  unique: boolean
}): string {
  const extension = extensionFromFilename(input.filename)
  const basename = input.unique ? crypto.randomUUID() : input.role
  return `${input.citySlug}/business/${input.businessId}/${input.role}/${basename}.${extension}`
}

function extensionFromFilename(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "")
  return extension && extension.length <= 5 ? extension : "bin"
}

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

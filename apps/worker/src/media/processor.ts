import sharp from "sharp"
import type { WorkerEnv } from "../runtime/env.js"
import { uploadToR2 } from "./r2.js"

export type ProcessedUpload = {
  bucket: string
  storagePath: string
  cdnUrl: string
  contentType: string
  sizeBytes: number
  checksumSha256: string
  originalFilename: string
  originalContentType?: string
  originalSizeBytes?: number
  width?: number | null
  height?: number | null
}

type ProcessInput = {
  bytes: Buffer
  originalContentType: string
  filename: string
  citySlug: string
  entityType: string
  entityId: string
  role: string
  unique: boolean
  fallbackStoragePath: string
}

export async function processAndUpload(env: WorkerEnv, input: ProcessInput): Promise<ProcessedUpload> {
  if (env.mediaProcessorUrl && env.mediaProcessorSecret) {
    return uploadViaProcessor(env, input)
  }
  return uploadDirect(env, input)
}

async function uploadViaProcessor(env: WorkerEnv, input: ProcessInput): Promise<ProcessedUpload> {
  // fastify-multipart so popula file.fields com campos que aparecem ANTES do arquivo
  const form = new FormData()
  form.append("citySlug", input.citySlug)
  form.append("entityType", input.entityType)
  form.append("entityId", input.entityId)
  form.append("role", input.role)
  form.append("unique", String(input.unique))
  const blob = new Blob([new Uint8Array(input.bytes)], { type: input.originalContentType })
  form.append("file", blob, input.filename)

  const url = `${env.mediaProcessorUrl!.replace(/\/$/, "")}/v1/process`
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.mediaProcessorSecret!}` },
    body: form,
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`Media processor failed HTTP ${response.status}: ${body}`)
  }

  const json = (await response.json()) as ProcessedUpload
  return json
}

async function uploadDirect(env: WorkerEnv, input: ProcessInput): Promise<ProcessedUpload> {
  if (!env.r2Endpoint || !env.r2AccessKeyId || !env.r2SecretAccessKey || !env.r2Bucket || !env.r2PublicBaseUrl) {
    throw new Error("Missing R2 configuration for direct upload")
  }

  let bytes = input.bytes
  let contentType = input.originalContentType
  let storagePath = input.fallbackStoragePath
  let width: number | null = null
  let height: number | null = null

  if (input.originalContentType.startsWith("image/")) {
    const image = sharp(input.bytes, { limitInputPixels: 50_000_000 }).rotate()
    const metadata = await image.metadata()
    const resized = metadata.width && metadata.width > 1920 ? image.resize({ width: 1920 }) : image
    bytes = await resized.webp({ quality: 78, effort: 5 }).toBuffer()
    contentType = "image/webp"
    storagePath = storagePath.replace(/\.[^/.]+$/, ".webp")
    const out = await sharp(bytes).metadata()
    width = out.width ?? null
    height = out.height ?? null
  }

  const uploaded = await uploadToR2({ buffer: bytes, storagePath, contentType })

  return {
    bucket: uploaded.bucket,
    storagePath: uploaded.storagePath,
    cdnUrl: uploaded.cdnUrl,
    contentType: uploaded.contentType,
    sizeBytes: uploaded.sizeBytes,
    checksumSha256: uploaded.checksumSha256,
    originalFilename: input.filename,
    originalContentType: input.originalContentType,
    originalSizeBytes: input.bytes.length,
    width,
    height,
  }
}

export async function assertPublicMedia(url: string): Promise<void> {
  let lastError = ""
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 700 * attempt))
    try {
      const response = await fetch(url, { method: "HEAD" })
      const contentType = response.headers.get("content-type") ?? ""
      if (response.ok && (contentType.toLowerCase().startsWith("image/") || contentType.toLowerCase().startsWith("video/"))) {
        return
      }
      lastError = `HTTP ${response.status} content-type ${contentType || "empty"}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  throw new Error(`R2 CDN URL is not publicly readable as media: ${lastError}`)
}

import 'server-only';

import crypto from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { z } from 'zod';

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif']);
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska']);

type R2Config = {
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
};

type UploadInput = {
  file: File;
  path: string;
  processor?: {
    citySlug: string;
    entityType: string;
    entityId: string;
    role: string;
    unique: boolean;
  };
};

export type R2UploadResult = {
  bucket: string;
  storagePath: string;
  cdnUrl: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  originalFilename: string;
  originalContentType?: string;
  originalSizeBytes?: number;
  width?: number | null;
  height?: number | null;
  thumbnail?: {
    storagePath: string;
    cdnUrl: string;
    contentType: string;
    sizeBytes: number;
    width?: number | null;
    height?: number | null;
  } | null;
};

let cachedClient: { key: string; client: S3Client } | null = null;

function getClient(config: R2Config) {
  const cacheKey = `${config.endpoint}|${config.accessKeyId}`;
  if (!cachedClient || cachedClient.key !== cacheKey) {
    cachedClient = {
      key: cacheKey,
      client: new S3Client({
        region: 'auto',
        endpoint: config.endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      }),
    };
  }
  return cachedClient.client;
}

export function assertImageFile(file: File) {
  if (!IMAGE_MIME_TYPES.has(file.type) && !VIDEO_MIME_TYPES.has(file.type)) {
    throw new Error('Envie uma imagem JPG, PNG, WebP, GIF, AVIF, HEIC ou um video comum.');
  }

  const maxBytes = Number(process.env.R2_MEDIA_MAX_BYTES ?? 100 * 1024 * 1024);
  if (file.size > maxBytes) {
    throw new Error('Arquivo maior que o limite permitido.');
  }
}

export async function uploadImageToR2(input: UploadInput): Promise<R2UploadResult> {
  const processed = await uploadViaProcessor(input);
  if (processed) return processed;

  assertImageFile(input.file);
  if (VIDEO_MIME_TYPES.has(input.file.type)) {
    throw new Error('Uploads de video precisam do MEDIA_PROCESSOR_URL configurado.');
  }

  const config = getR2Config();
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const checksumSha256 = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
  const client = getClient(config);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: input.path,
      Body: bytes,
      ContentType: input.file.type || 'application/octet-stream',
      ChecksumSHA256: Buffer.from(checksumSha256, 'hex').toString('base64'),
    }),
  );

  return {
    bucket: config.bucket,
    storagePath: input.path,
    cdnUrl: `${config.publicBaseUrl.replace(/\/$/, '')}/${input.path}`,
    contentType: input.file.type,
    sizeBytes: input.file.size,
    checksumSha256,
    originalFilename: input.file.name,
  };
}

export async function deleteImageFromR2(storagePath: string) {
  const config = getR2Config();
  const client = getClient(config);
  try {
    await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: storagePath }));
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (status === 404) return;
    throw new Error(`Falha ao remover arquivo do R2: ${(error as Error).message}`);
  }
}

export function buildMediaPath(input: {
  citySlug: string;
  entityType: string;
  entityId: string;
  role: string;
  filename: string;
  unique?: boolean;
}) {
  const extension = extensionFromFilename(input.filename);
  const basename = input.unique ? crypto.randomUUID() : input.role;
  return `${input.citySlug}/${input.entityType}/${input.entityId}/${input.role}/${basename}.${extension}`;
}

function extensionFromFilename(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  return extension && extension.length <= 5 ? extension : 'bin';
}

function getR2Config(): R2Config {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    throw new Error('Configure R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_PUBLIC_BASE_URL.');
  }

  return { endpoint, bucket, accessKeyId, secretAccessKey, publicBaseUrl };
}

async function uploadViaProcessor(input: UploadInput): Promise<R2UploadResult | null> {
  const processorUrl = process.env.MEDIA_PROCESSOR_URL;
  const processorSecret = process.env.MEDIA_PROCESSOR_SECRET;
  if (!processorUrl || !processorSecret || !input.processor) return null;

  const formData = new FormData();
  formData.set('citySlug', input.processor.citySlug);
  formData.set('entityType', input.processor.entityType);
  formData.set('entityId', input.processor.entityId);
  formData.set('role', input.processor.role);
  formData.set('unique', String(input.processor.unique));
  formData.set('file', input.file);

  const response = await fetch(`${processorUrl.replace(/\/$/, '')}/v1/process`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${processorSecret}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Falha no processamento de mídia (${response.status}): ${body}`);
  }

  const parsed = processorUploadSchema.parse(await response.json());
  return {
    bucket: parsed.bucket,
    storagePath: parsed.storagePath,
    cdnUrl: parsed.cdnUrl,
    contentType: parsed.contentType,
    sizeBytes: parsed.sizeBytes,
    checksumSha256: parsed.checksumSha256,
    originalFilename: parsed.originalFilename,
    originalContentType: parsed.originalContentType,
    originalSizeBytes: parsed.originalSizeBytes,
    width: parsed.width,
    height: parsed.height,
    thumbnail: parsed.thumbnail ?? null,
  };
}

const processorUploadSchema = z.object({
  bucket: z.string(),
  storagePath: z.string(),
  cdnUrl: z.string(),
  contentType: z.string(),
  sizeBytes: z.number(),
  checksumSha256: z.string(),
  originalFilename: z.string(),
  originalContentType: z.string().optional(),
  originalSizeBytes: z.number().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  thumbnail: z
    .object({
      storagePath: z.string(),
      cdnUrl: z.string(),
      contentType: z.string(),
      sizeBytes: z.number(),
      width: z.number().nullable().optional(),
      height: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
});

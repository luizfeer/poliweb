import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import Fastify from 'fastify';
import { z } from 'zod';
import { authorize, HttpError } from './auth.js';
import { uploadProcessedToR2 } from './r2.js';
import { env } from './env.js';
import { buildProcessedPath } from './paths.js';
import { processImage } from './processors/image.js';
import { processVideo } from './processors/video.js';
import { renderReel } from './processors/reel.js';

const fieldSchema = z.object({
  citySlug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  entityType: z.string().min(2).max(80).regex(/^[a-z_]+$/),
  entityId: z.string().uuid(),
  role: z.string().min(2).max(40).regex(/^[a-z_]+$/),
  unique: z
    .union([z.boolean(), z.string()])
    .default(false)
    .transform((value) => (typeof value === 'boolean' ? value : value === 'true' || value === '1')),
});

// Anti-SSRF: a foto vira `background: url()` num Chromium headless durante o
// render. Só aceitamos data:image/... ou https do host do R2 — nunca URL
// arbitrária (metadata da cloud, serviços internos). Espelha o slideSchema do web.
const R2_PUBLIC_HOST = (() => {
  try {
    return new URL(env.R2_PUBLIC_BASE_URL).host;
  } catch {
    return null;
  }
})();

function isAllowedPhotoSource(value: string): boolean {
  if (value.startsWith('data:image/')) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && R2_PUBLIC_HOST != null && u.host === R2_PUBLIC_HOST;
  } catch {
    return false;
  }
}

const reelSlideSchema = z.object({
  id: z.string().min(1).max(64),
  kind: z.string().min(1).max(40),
  theme: z.string().min(1).max(40),
  format: z.string().min(1).max(40),
  photo: z.string().refine(isAllowedPhotoSource, 'foto inválida').nullable(),
});

const reelFieldsSchema = z.object({
  citySlug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  entityType: z.string().min(2).max(80).regex(/^[a-z_]+$/),
  entityId: z.string().uuid(),
  role: z.string().min(2).max(40).regex(/^[a-z_]+$/),
  ramo: z.string().min(2).max(40),
  document: z.object({ slides: z.array(reelSlideSchema).min(1).max(12) }),
});

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.ALLOWED_ORIGINS.length > 0 ? env.ALLOWED_ORIGINS : true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400,
});

await app.register(multipart, {
  limits: {
    fileSize: env.MAX_UPLOAD_BYTES,
    files: 1,
  },
});

app.get('/health', async () => ({ ok: true }));

app.post('/v1/process', async (request, reply) => {
  let auth;
  try {
    auth = authorize(request.headers.authorization);
  } catch (error) {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }

  const rawFields: Record<string, string> = {};
  let fileBuffer: Buffer | undefined;
  let fileMimetype = '';
  let fileFilename = '';

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      if (fileBuffer) continue;
      fileBuffer = await part.toBuffer();
      fileMimetype = part.mimetype;
      fileFilename = part.filename;
    } else if (typeof part.value === 'string') {
      rawFields[part.fieldname] = part.value;
    }
  }

  if (!fileBuffer) {
    return reply.code(400).send({ error: 'file is required' });
  }

  const fields = fieldSchema.parse({
    citySlug: rawFields.citySlug,
    entityType: rawFields.entityType,
    entityId: rawFields.entityId,
    role: rawFields.role,
    unique: rawFields.unique ?? false,
  });

  if (auth.kind === 'token') {
    const { payload } = auth;
    if (
      payload.citySlug !== fields.citySlug
      || payload.entityType !== fields.entityType
      || payload.entityId !== fields.entityId
      || payload.role !== fields.role
      || payload.unique !== fields.unique
    ) {
      return reply.code(403).send({ error: 'token does not match upload fields' });
    }
  }

  const media = await processByMime(fileBuffer, fileMimetype, fileFilename);
  const storagePath = buildProcessedPath({
    ...fields,
    outputExtension: media.extension,
  });
  const uploaded = await uploadProcessedToR2({
    buffer: media.buffer,
    storagePath,
    contentType: media.contentType,
  });

  let thumbnail: {
    storagePath: string;
    cdnUrl: string;
    contentType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
  } | null = null;

  if (media.kind === 'video' && media.thumbnail) {
    const thumbnailPath = storagePath.replace(/\.mp4$/i, '.poster.webp');
    const uploadedThumb = await uploadProcessedToR2({
      buffer: media.thumbnail.buffer,
      storagePath: thumbnailPath,
      contentType: media.thumbnail.contentType,
    });
    thumbnail = {
      storagePath: uploadedThumb.storagePath,
      cdnUrl: uploadedThumb.cdnUrl,
      contentType: uploadedThumb.contentType,
      sizeBytes: uploadedThumb.sizeBytes,
      width: media.thumbnail.width,
      height: media.thumbnail.height,
    };
  }

  return {
    ...uploaded,
    originalFilename: fileFilename,
    originalContentType: fileMimetype,
    originalSizeBytes: fileBuffer.byteLength,
    width: media.width,
    height: media.height,
    thumbnail,
  };
});

app.post('/v1/render-reel', { bodyLimit: 32 * 1024 * 1024 }, async (request, reply) => {
  let auth;
  try {
    auth = authorize(request.headers.authorization);
  } catch (error) {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }

  const fields = reelFieldsSchema.parse(request.body);

  if (auth.kind === 'token') {
    const { payload } = auth;
    if (
      payload.citySlug !== fields.citySlug
      || payload.entityType !== fields.entityType
      || payload.entityId !== fields.entityId
      || payload.role !== fields.role
    ) {
      return reply.code(403).send({ error: 'token does not match render fields' });
    }
  }

  const rendered = await renderReel({ document: fields.document, ramo: fields.ramo });
  const storagePath = buildProcessedPath({
    citySlug: fields.citySlug,
    entityType: fields.entityType,
    entityId: fields.entityId,
    role: fields.role,
    outputExtension: rendered.extension,
    unique: true,
  });
  const uploaded = await uploadProcessedToR2({
    buffer: rendered.buffer,
    storagePath,
    contentType: rendered.contentType,
  });

  return {
    ...uploaded,
    width: rendered.width,
    height: rendered.height,
  };
});

await app.listen({ host: env.HOST, port: env.PORT });

async function processByMime(buffer: Buffer, mimetype: string, filename: string) {
  if (mimetype.startsWith('image/') || /\.(heic|heif)$/i.test(filename)) {
    const image = await processImage(buffer);
    return { ...image, kind: 'image' as const };
  }

  if (mimetype.startsWith('video/')) {
    const video = await processVideo(buffer, filename);
    return { ...video, kind: 'video' as const };
  }

  throw new Error(`Unsupported media type: ${mimetype}`);
}

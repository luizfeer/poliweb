import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4010),
  HOST: z.string().default('127.0.0.1'),
  MEDIA_PROCESSOR_SECRET: z.string().min(24),
  R2_ENDPOINT: z.string().url(),
  R2_BUCKET: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_PUBLIC_BASE_URL: z.string().url(),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(100 * 1024 * 1024),
  IMAGE_MAX_WIDTH: z.coerce.number().int().positive().default(1920),
  IMAGE_WEBP_QUALITY: z.coerce.number().int().min(1).max(100).default(78),
  VIDEO_MAX_WIDTH: z.coerce.number().int().positive().default(1280),
  VIDEO_CRF: z.coerce.number().int().min(18).max(36).default(28),
  FFMPEG_BIN: z.string().default('ffmpeg'),
  // Render de Reels (Remotion). Opcionais: por padrão resolve apps/web a partir
  // do cwd do worker (apps/media-processor). Configurar em deploys com layout diferente.
  REMOTION_ENTRY_POINT: z.string().optional(),
  REMOTION_WEB_DIR: z.string().optional(),
  ALLOWED_ORIGINS: z
    .string()
    .default('')
    .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean)),
});

export const env = envSchema.parse(process.env);

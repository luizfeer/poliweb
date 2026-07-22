import crypto from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

type UploadProcessedInput = {
  buffer: Buffer;
  storagePath: string;
  contentType: string;
};

export type R2Upload = {
  bucket: string;
  storagePath: string;
  cdnUrl: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
};

const client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadProcessedToR2(input: UploadProcessedInput): Promise<R2Upload> {
  const checksumSha256 = crypto.createHash('sha256').update(input.buffer).digest('hex').toUpperCase();
  const cdnBaseUrl = env.R2_PUBLIC_BASE_URL.replace(/\/$/, '');

  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: input.storagePath,
      Body: input.buffer,
      ContentType: input.contentType,
      ChecksumSHA256: Buffer.from(checksumSha256, 'hex').toString('base64'),
    }),
  );

  return {
    bucket: env.R2_BUCKET,
    storagePath: input.storagePath,
    cdnUrl: `${cdnBaseUrl}/${input.storagePath}`,
    contentType: input.contentType,
    sizeBytes: input.buffer.byteLength,
    checksumSha256,
  };
}

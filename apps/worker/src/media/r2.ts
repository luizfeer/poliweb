import crypto from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { readEnv } from '../runtime/env.js';

type UploadInput = {
  buffer: Buffer;
  storagePath: string;
  contentType: string;
};

export type R2UploadResult = {
  bucket: string;
  storagePath: string;
  cdnUrl: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
};

let cachedClient: { key: string; client: S3Client } | null = null;

function getClient(): { client: S3Client; bucket: string; publicBaseUrl: string } {
  const env = readEnv();
  if (!env.r2Endpoint || !env.r2AccessKeyId || !env.r2SecretAccessKey || !env.r2Bucket || !env.r2PublicBaseUrl) {
    throw new Error('Missing R2 configuration');
  }

  const cacheKey = `${env.r2Endpoint}|${env.r2AccessKeyId}`;
  if (!cachedClient || cachedClient.key !== cacheKey) {
    cachedClient = {
      key: cacheKey,
      client: new S3Client({
        region: 'auto',
        endpoint: env.r2Endpoint,
        credentials: {
          accessKeyId: env.r2AccessKeyId,
          secretAccessKey: env.r2SecretAccessKey,
        },
      }),
    };
  }

  return { client: cachedClient.client, bucket: env.r2Bucket, publicBaseUrl: env.r2PublicBaseUrl };
}

export async function deleteFromR2(storagePath: string): Promise<void> {
  const { client, bucket } = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storagePath }));
}

export async function uploadToR2(input: UploadInput): Promise<R2UploadResult> {
  const { client, bucket, publicBaseUrl } = getClient();
  const checksumSha256 = crypto
    .createHash('sha256')
    .update(input.buffer)
    .digest('hex')
    .toUpperCase();
  const cdnBaseUrl = publicBaseUrl.replace(/\/$/, '');

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.storagePath,
      Body: input.buffer,
      ContentType: input.contentType,
      ChecksumSHA256: Buffer.from(checksumSha256, 'hex').toString('base64'),
    }),
  );

  return {
    bucket,
    storagePath: input.storagePath,
    cdnUrl: `${cdnBaseUrl}/${input.storagePath}`,
    contentType: input.contentType,
    sizeBytes: input.buffer.byteLength,
    checksumSha256,
  };
}

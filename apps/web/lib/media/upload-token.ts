import 'server-only';

import { createHmac, randomUUID } from 'node:crypto';

const DEFAULT_TTL_SECONDS = 15 * 60;

type SignInput = {
  citySlug: string;
  entityType: string;
  entityId: string;
  role: string;
  unique: boolean;
  ttlSeconds?: number;
};

export type SignedUploadToken = {
  token: string;
  expiresAt: number;
};

export function signUploadToken(input: SignInput): SignedUploadToken {
  const secret = process.env.MEDIA_PROCESSOR_SECRET;
  if (!secret) {
    throw new Error('MEDIA_PROCESSOR_SECRET is not configured.');
  }

  const exp = Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? DEFAULT_TTL_SECONDS);
  const payload = {
    citySlug: input.citySlug,
    entityType: input.entityType,
    entityId: input.entityId,
    role: input.role,
    unique: input.unique,
    exp,
    nonce: randomUUID(),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', secret).update(payloadB64).digest('base64url');

  return {
    token: `${payloadB64}.${sig}`,
    expiresAt: exp,
  };
}

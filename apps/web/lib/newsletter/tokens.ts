import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';

export function createToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashText(value: string | null): string | null {
  if (!value) return null;
  return createHash('sha256').update(value).digest('hex');
}

export function getSiteUrl(): string {
  return resolvePublicSiteOrigin();
}

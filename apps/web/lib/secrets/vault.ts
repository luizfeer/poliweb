import 'server-only';

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { createServiceRoleClient } from '@/lib/supabase/service';

const ALGO = 'aes-256-gcm';
const KEY_BYTES = 32;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

// Cache pelo tempo de vida do processo (sem TTL). Em serverless isso = ate cold
// start; em servidor longevo = ate restart. Se uma chave vazar, voce rotaciona
// na origem (Anthropic/Resend/etc) e o valor velho deixa de funcionar la, entao
// cache stale nao causa dano.
const cache = new Map<string, string>();

function getMasterKey(): Buffer {
  const raw = process.env.APP_SECRETS_MASTER_KEY;
  if (!raw) throw new Error('APP_SECRETS_MASTER_KEY ausente no env.');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(`APP_SECRETS_MASTER_KEY precisa ter ${KEY_BYTES} bytes em base64 (${key.length} recebidos).`);
  }
  return key;
}

export function encryptSecret(plaintext: string): { ciphertext: string; nonce: string } {
  const key = getMasterKey();
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(ALGO, key, nonce);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([enc, tag]).toString('base64'),
    nonce: nonce.toString('base64'),
  };
}

export function decryptSecret(ciphertextB64: string, nonceB64: string): string {
  const key = getMasterKey();
  const nonce = Buffer.from(nonceB64, 'base64');
  const buf = Buffer.from(ciphertextB64, 'base64');
  const enc = buf.subarray(0, buf.length - TAG_BYTES);
  const tag = buf.subarray(buf.length - TAG_BYTES);
  const decipher = createDecipheriv(ALGO, key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

function cacheKey(key: string, cityId: string | null): string {
  return `${cityId ?? 'global'}:${key}`;
}

export async function getSecret(
  key: string,
  options: { cityId?: string | null; bypassCache?: boolean } = {},
): Promise<string | null> {
  const cityId = options.cityId ?? null;
  const ck = cacheKey(key, cityId);
  if (!options.bypassCache) {
    const hit = cache.get(ck);
    if (hit !== undefined) return hit;
  }

  const supabase = createServiceRoleClient();
  const query = supabase
    .from('app_secrets')
    .select('ciphertext, nonce')
    .eq('key', key)
    .eq('scope', cityId ? 'city' : 'global');
  const { data, error } = cityId
    ? await query.eq('city_id', cityId).maybeSingle()
    : await query.is('city_id', null).maybeSingle();

  if (error || !data) {
    cache.delete(ck);
    return null;
  }

  const value = decryptSecret(data.ciphertext, data.nonce);
  cache.set(ck, value);
  return value;
}

export function invalidateSecret(key: string, cityId: string | null = null): void {
  cache.delete(cacheKey(key, cityId));
}

export function invalidateAllSecrets(): void {
  cache.clear();
}

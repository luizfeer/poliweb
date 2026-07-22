import AsyncStorage from '@react-native-async-storage/async-storage';

import { mobileDebug } from '@/lib/debug';

const PREFIX = '__cache_v1__:';
const DEFAULT_TTL_MS = 2 * 60 * 1000;

type Entry<T> = {
  value: T;
  storedAt: number;
};

type Options = {
  ttlMs?: number;
  /** Retorna cache stale enquanto refetcha em background. */
  staleWhileRevalidate?: boolean;
};

/**
 * GET-style cache: chama `fetcher` e armazena o resultado por `ttlMs`.
 * Dentro do TTL retorna o cache direto. Fora do TTL (ou se `staleWhileRevalidate`
 * estiver ligado e falhar a rede), refetcha mas devolve o stale enquanto isso.
 */
export async function cachedJson<T>(
  key: string,
  fetcher: () => Promise<T | null>,
  opts: Options = {},
): Promise<T | null> {
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
  const swr = opts.staleWhileRevalidate ?? true;
  const storageKey = PREFIX + key;
  const now = Date.now();

  const cached = await readEntry<T>(storageKey);
  const isFresh = cached && now - cached.storedAt < ttlMs;

  if (isFresh) {
    mobileDebug('cache', 'hit fresh', { key, ageMs: now - cached.storedAt, ttlMs });
    return cached.value;
  }

  if (cached && swr) {
    mobileDebug('cache', 'stale, refetching in background', { key, ageMs: now - cached.storedAt });
    void refetchAndStore(storageKey, fetcher);
    return cached.value;
  }

  return refetchAndStore(storageKey, fetcher);
}

export async function invalidate(key: string): Promise<void> {
  await AsyncStorage.removeItem(PREFIX + key);
}

async function readEntry<T>(storageKey: string): Promise<Entry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as Entry<T>;
  } catch {
    return null;
  }
}

async function refetchAndStore<T>(
  storageKey: string,
  fetcher: () => Promise<T | null>,
): Promise<T | null> {
  try {
    const value = await fetcher();
    if (value === null) return null;
    const entry: Entry<T> = { value, storedAt: Date.now() };
    await AsyncStorage.setItem(storageKey, JSON.stringify(entry));
    mobileDebug('cache', 'stored', { key: storageKey.replace(PREFIX, '') });
    return value;
  } catch (err) {
    mobileDebug('cache', 'fetcher threw', { key: storageKey.replace(PREFIX, ''), error: String(err) });
    return null;
  }
}

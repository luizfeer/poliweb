import AsyncStorage from '@react-native-async-storage/async-storage';

/** Mesmo TTL do `revalidate: 60` da home web. */
export const HOME_CACHE_TTL_MS = 60_000;

type CacheEnvelope<T> = {
  expiresAt: number;
  data: T;
};

/** Cache em memória — evita MMKV (exige New Architecture no v3). */
const memory = new Map<string, string>();

export function homeCacheGet<T>(key: string): T | null {
  const raw = memory.get(key);
  if (!raw) return null;
  try {
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    if (Date.now() > envelope.expiresAt) {
      memory.delete(key);
      return null;
    }
    return envelope.data;
  } catch {
    memory.delete(key);
    return null;
  }
}

export function homeCacheSet<T>(key: string, data: T, ttlMs = HOME_CACHE_TTL_MS): void {
  const envelope: CacheEnvelope<T> = {
    expiresAt: Date.now() + ttlMs,
    data,
  };
  memory.set(key, JSON.stringify(envelope));
}

export function homeCacheInvalidate(prefix: string): void {
  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
}

const PERSIST_PREFIX = '@carmo/home-cache/';

export async function homeCachePersistGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PERSIST_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function homeCachePersistSet<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PERSIST_PREFIX + key, JSON.stringify(data));
  } catch {
    // disco cheio / quota — ignora; em-memória ainda funciona
  }
}

export async function homeCachePersistClear(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(PERSIST_PREFIX));
    if (ours.length > 0) await AsyncStorage.multiRemove(ours);
  } catch {
    // noop
  }
}

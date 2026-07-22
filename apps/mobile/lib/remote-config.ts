import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

/**
 * Config publica do app, lida da tabela `mobile_config` no Supabase.
 *
 * Fluxo:
 * - No boot: tenta carregar do cache (AsyncStorage), depois revalida do banco em background
 * - Cada chave tem um default baked-in pra primeiro launch / offline
 * - Trocar valor no painel super_admin -> usuario abre o app -> pega novo valor
 *
 * Nao usar pra segredos (qualquer um le via anon).
 */

const CACHE_KEY = '@portal/mobile_config_v1';

export type RemoteConfigKey =
  | 'WEB_BASE_URL'
  | 'DEFAULT_CITY_SLUG'
  | 'SUPPORT_WHATSAPP'
  | 'FEATURE_ASSISTANT_ENABLED'
  | 'FEATURE_PUSH_PROMPT_ENABLED';

const DEFAULTS: Record<RemoteConfigKey, string> = {
  WEB_BASE_URL: 'https://portalcarmelitano.com.br',
  DEFAULT_CITY_SLUG: 'carmo-do-rio-claro',
  SUPPORT_WHATSAPP: '',
  FEATURE_ASSISTANT_ENABLED: 'true',
  FEATURE_PUSH_PROMPT_ENABLED: 'true',
};

type Snapshot = Record<string, string>;

let snapshot: Snapshot = { ...DEFAULTS };
let hydrated = false;
let inflight: Promise<void> | null = null;

async function loadCache(): Promise<Snapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
}

async function saveCache(value: Snapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // ignora — cache best-effort
  }
}

async function fetchRemote(): Promise<Snapshot | null> {
  const { data, error } = await supabase.from('mobile_config').select('key, value');
  if (error || !data) return null;
  const next: Snapshot = { ...DEFAULTS };
  for (const row of data) next[row.key] = row.value;
  return next;
}

export async function loadRemoteConfig(): Promise<void> {
  if (hydrated) return;
  if (inflight) return inflight;

  inflight = (async () => {
    const cached = await loadCache();
    if (cached) snapshot = { ...DEFAULTS, ...cached };

    const fresh = await fetchRemote();
    if (fresh) {
      snapshot = fresh;
      await saveCache(fresh);
    }
    hydrated = true;
  })();

  try {
    await inflight;
  } finally {
    inflight = null;
  }
}

export async function refreshRemoteConfig(): Promise<void> {
  const fresh = await fetchRemote();
  if (fresh) {
    snapshot = fresh;
    await saveCache(fresh);
  }
}

export function getRemoteConfig(key: RemoteConfigKey): string {
  return snapshot[key] ?? DEFAULTS[key];
}

export function getRemoteConfigBool(key: RemoteConfigKey): boolean {
  return getRemoteConfig(key).trim().toLowerCase() === 'true';
}

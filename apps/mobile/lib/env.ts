import { mobileRuntimeEnv } from './env.runtime';

type WebEnvMode = 'local' | 'production';

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[env] Variável ${name} não definida. Cheque .env e EXPO_PUBLIC_* no app.config.ts.`,
    );
  }
  return value;
}

const SUPABASE_URL = required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON_KEY = required(
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);
const BAKED_DEFAULT_CITY_SLUG =
  process.env.EXPO_PUBLIC_DEFAULT_CITY_SLUG?.trim() || 'carmo-do-rio-claro';
const BAKED_WEB_BASE_URL = mobileRuntimeEnv.webBaseUrl;

// Lazy require pra evitar ciclo: remote-config -> supabase -> env -> remote-config.
function readRemote(key: 'WEB_BASE_URL' | 'DEFAULT_CITY_SLUG'): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./remote-config') as typeof import('./remote-config');
    return mod.getRemoteConfig(key);
  } catch {
    return '';
  }
}

export const env = {
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
  get webBaseUrl(): string {
    // Em dev local com IP da maquina, respeita o env de build (remote nao saberia o IP).
    if (mobileRuntimeEnv.forceLocalDev) return BAKED_WEB_BASE_URL;
    return readRemote('WEB_BASE_URL') || BAKED_WEB_BASE_URL;
  },
  get defaultCitySlug(): string {
    return readRemote('DEFAULT_CITY_SLUG') || BAKED_DEFAULT_CITY_SLUG;
  },
  webEnv: mobileRuntimeEnv.webEnv as WebEnvMode,
  webEnvLabel: mobileRuntimeEnv.webEnvLabel,
  forceLocalDev: mobileRuntimeEnv.forceLocalDev,
};

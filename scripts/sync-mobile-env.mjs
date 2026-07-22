/**
 * Copia do apps/web/.env.local as variáveis que o app mobile usa (prefixo EXPO_PUBLIC_*).
 * Preserva EAS_PROJECT_ID e EAS_UPDATE_URL já definidos no .env do mobile.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const webEnvPath = path.join(root, 'apps/web/.env.local');
const mobileEnvPath = path.join(root, 'apps/mobile/.env');

function parseEnv(content) {
  /** @type {Record<string, string>} */
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

if (!fs.existsSync(webEnvPath)) {
  console.error(`Arquivo não encontrado: ${webEnvPath}`);
  console.error('Crie apps/web/.env.local a partir de .env.example na raiz do repo.');
  process.exit(1);
}

const web = parseEnv(fs.readFileSync(webEnvPath, 'utf8'));
const mobileExisting = fs.existsSync(mobileEnvPath)
  ? parseEnv(fs.readFileSync(mobileEnvPath, 'utf8'))
  : {};

function isLocalDevUrl(value) {
  if (!value) return false;
  try {
    const { hostname } = new URL(value);
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
    if (/^10\./.test(hostname)) return true;
    if (/^192\.168\./.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

function isLoopbackUrl(value) {
  if (!value) return false;
  try {
    const { hostname } = new URL(value);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function pickWebUrl(forceLocalDev) {
  const webUrl = web.NEXT_PUBLIC_APP_URL;
  const mobileUrl = mobileExisting.EXPO_PUBLIC_WEB_URL;

  if (forceLocalDev) {
    if (isLocalDevUrl(mobileUrl)) return mobileUrl;
    if (isLocalDevUrl(webUrl)) return webUrl;
    return 'http://localhost:3000';
  }

  if (isLoopbackUrl(webUrl) && mobileUrl && !isLoopbackUrl(mobileUrl)) {
    return mobileUrl;
  }
  return webUrl ?? mobileUrl ?? '';
}

const forceLocalDev = ['1', 'true', 'yes'].includes(
  String(mobileExisting.EXPO_PUBLIC_ALLOW_LOCALHOST_WEB_URL ?? '').trim().toLowerCase(),
);

const mapped = {
  EXPO_PUBLIC_WEB_URL: pickWebUrl(forceLocalDev),
  EXPO_PUBLIC_ALLOW_LOCALHOST_WEB_URL:
    mobileExisting.EXPO_PUBLIC_ALLOW_LOCALHOST_WEB_URL ??
    (isLocalDevUrl(pickWebUrl(forceLocalDev)) ? '1' : '0'),
  EXPO_PUBLIC_SUPABASE_URL:
    web.NEXT_PUBLIC_SUPABASE_URL ?? mobileExisting.EXPO_PUBLIC_SUPABASE_URL ?? '',
  EXPO_PUBLIC_SUPABASE_ANON_KEY:
    web.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? mobileExisting.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  EXPO_PUBLIC_DEFAULT_CITY_SLUG:
    web.NEXT_PUBLIC_DEFAULT_CITY_SLUG ??
    mobileExisting.EXPO_PUBLIC_DEFAULT_CITY_SLUG ??
    'carmo-do-rio-claro',
  EAS_PROJECT_ID: mobileExisting.EAS_PROJECT_ID ?? '',
  EAS_UPDATE_URL: mobileExisting.EAS_UPDATE_URL ?? '',
};

const required = ['EXPO_PUBLIC_WEB_URL', 'EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];
const missing = required.filter((key) => !mapped[key]);
if (missing.length > 0) {
  console.error(`Faltam no web .env.local: ${missing.map((k) => webKeyFor(k)).join(', ')}`);
  process.exit(1);
}

function webKeyFor(expoKey) {
  if (expoKey === 'EXPO_PUBLIC_WEB_URL') return 'NEXT_PUBLIC_APP_URL';
  return expoKey.replace('EXPO_PUBLIC_', 'NEXT_PUBLIC_');
}

const content = `# Sincronizado de apps/web/.env.local — não commitar (pnpm env:sync-mobile)
# Web → Mobile:
#   NEXT_PUBLIC_APP_URL              → EXPO_PUBLIC_WEB_URL
#   NEXT_PUBLIC_SUPABASE_URL         → EXPO_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY    → EXPO_PUBLIC_SUPABASE_ANON_KEY
#   NEXT_PUBLIC_DEFAULT_CITY_SLUG    → EXPO_PUBLIC_DEFAULT_CITY_SLUG
# Em dispositivo físico, troque localhost pelo IP da máquina (ex.: http://192.168.0.10:3000).

EXPO_PUBLIC_WEB_URL=${mapped.EXPO_PUBLIC_WEB_URL}
EXPO_PUBLIC_ALLOW_LOCALHOST_WEB_URL=${mapped.EXPO_PUBLIC_ALLOW_LOCALHOST_WEB_URL}
EXPO_PUBLIC_SUPABASE_URL=${mapped.EXPO_PUBLIC_SUPABASE_URL}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${mapped.EXPO_PUBLIC_SUPABASE_ANON_KEY}
EXPO_PUBLIC_DEFAULT_CITY_SLUG=${mapped.EXPO_PUBLIC_DEFAULT_CITY_SLUG}
EAS_PROJECT_ID=${mapped.EAS_PROJECT_ID}
EAS_UPDATE_URL=${mapped.EAS_UPDATE_URL}
`;

// Sempre LF + newline final (evita colar EXPO_* no export do Expo no Windows).
fs.writeFileSync(mobileEnvPath, content.replace(/\r?\n/g, '\n'), { encoding: 'utf8' });
console.log(`OK: ${mobileEnvPath}`);

const DEFAULT_PRODUCTION_URL = 'https://portalcarmelitano.com.br';
const PRODUCTION_HOSTS = new Set(['portalcarmelitano.com.br', 'www.portalcarmelitano.com.br']);

function normalizeWebUrl(raw) {
  const trimmed = raw.trim().replace(/\/$/, '');
  if (!trimmed) return DEFAULT_PRODUCTION_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

function isLocalDevWebUrl(url) {
  try {
    const { hostname } = new URL(url);
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
    if (/^10\./.test(hostname)) return true;
    if (/^192\.168\./.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
    if (hostname.endsWith('.local')) return true;
    return false;
  } catch {
    return false;
  }
}

function isProductionWebUrl(url) {
  try {
    return PRODUCTION_HOSTS.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function resolveWebBaseUrl(options) {
  const forceLocalDev = options.forceLocalDev ?? false;
  const defaultProduction = normalizeWebUrl(options.defaultProductionUrl ?? DEFAULT_PRODUCTION_URL);

  if (forceLocalDev) {
    const raw = options.envUrl?.trim() || options.extraUrl?.trim() || 'http://localhost:3000';
    const url = normalizeWebUrl(raw);

    if (isProductionWebUrl(url)) {
      throw new Error(
        `[mobile:env] EXPO_PUBLIC_ALLOW_LOCALHOST_WEB_URL=1 bloqueia produção, mas EXPO_PUBLIC_WEB_URL=${url}. ` +
          'Use http://localhost:3000 ou o IP da máquina (ex.: http://192.168.0.10:3000).',
      );
    }

    return {
      url,
      mode: 'local',
      source: options.envUrl?.trim() ? 'env' : options.extraUrl?.trim() ? 'extra' : 'default',
      forcedLocal: true,
    };
  }

  const raw = options.envUrl?.trim() || options.extraUrl?.trim();
  if (!raw) {
    return { url: defaultProduction, mode: 'production', source: 'default', forcedLocal: false };
  }

  const url = normalizeWebUrl(raw);
  if (isLocalDevWebUrl(url)) {
    return {
      url: defaultProduction,
      mode: 'production',
      source: 'default',
      forcedLocal: false,
    };
  }

  return {
    url,
    mode: isProductionWebUrl(url) ? 'production' : 'local',
    source: options.envUrl?.trim() ? 'env' : 'extra',
    forcedLocal: false,
  };
}

function formatWebEnvLabel(resolution) {
  try {
    const { hostname, port } = new URL(resolution.url);
    const host = port ? `${hostname}:${port}` : hostname;
    return resolution.mode === 'local' ? `LOCAL · ${host}` : `PROD · ${host}`;
  } catch {
    return resolution.mode === 'local' ? 'LOCAL' : 'PROD';
  }
}

module.exports = {
  resolveWebBaseUrl,
  formatWebEnvLabel,
};

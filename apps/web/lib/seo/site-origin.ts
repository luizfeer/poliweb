import 'server-only';

/** Remove `https://` repetido no começo (ex.: colar URL inteira depois de `https://` no Vercel). */
function normalizeOriginCandidate(raw: string): string {
  let t = raw.trim();
  while (true) {
    const m = t.match(/^(https?:\/\/)(.+)$/i);
    if (!m) break;
    const rest = m[2];
    if (/^https?:\/\//i.test(rest)) {
      t = rest;
      continue;
    }
    break;
  }
  if (!/^https?:\/\//i.test(t)) {
    const host = t.replace(/^\/+/, '');
    if (host) t = `https://${host}`;
  }
  try {
    const u = new URL(t);
    if (!u.hostname) return '';
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

/**
 * Origem canônica do site para URLs absolutas (metadataBase, OG, etc.).
 * Sem NEXT_PUBLIC_SITE_URL no Vercel, o default do layout virava localhost e
 * `og:image` ficava inatingível para crawlers.
 */
export function resolvePublicSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const normalized = normalizeOriginCandidate(explicit);
    if (normalized) return normalized.replace(/\/$/, '');
  }

  const app = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (app) {
    const normalized = normalizeOriginCandidate(app);
    if (normalized) return normalized.replace(/\/$/, '');
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '');
    return `https://${host}`;
  }

  return 'http://localhost:3000';
}

export function resolveMetadataBase(): URL {
  return new URL(resolvePublicSiteOrigin());
}

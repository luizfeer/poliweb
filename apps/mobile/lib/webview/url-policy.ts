/**
 * Política de navegação do WebView: o portal fica dentro; embeds (mapa OSM, YouTube)
 * carregam inline; links de intenção do usuário (Google Maps, Waze, WhatsApp) abrem fora.
 */

function portalHostname(webBaseUrl: string): string {
  try {
    return new URL(webBaseUrl).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isSamePortalHost(hostname: string, portalHost: string): boolean {
  const host = hostname.toLowerCase();
  return host === portalHost || host.endsWith(`.${portalHost}`);
}

/** Recursos de iframe/subframe que devem carregar dentro do WebView. */
function isInlineEmbedUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();

  if (host === 'tile.openstreetmap.org') return true;

  if (host === 'openstreetmap.org' || host === 'www.openstreetmap.org') {
    return path.startsWith('/export/embed');
  }

  if (host === 'www.youtube-nocookie.com' || host === 'youtube-nocookie.com') {
    return path.startsWith('/embed/');
  }

  if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
    return path.startsWith('/embed/');
  }

  return false;
}

export type WebViewUrlDecision = 'allow' | 'open-external' | 'block';

export function resolveWebViewUrl(url: string, webBaseUrl: string): WebViewUrlDecision {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'allow';
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'open-external';
  }

  const portalHost = portalHostname(webBaseUrl);
  if (portalHost && isSamePortalHost(parsed.hostname, portalHost)) {
    return 'allow';
  }

  if (isInlineEmbedUrl(parsed)) {
    return 'allow';
  }

  return 'open-external';
}

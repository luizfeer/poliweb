export type TabId = "home" | "categories" | "cities" | "search" | "profile";

export type NavigationDecision = "allow" | "system" | "browser";

const SPECIAL_SCHEME = /^(tel|mailto|sms|whatsapp|intent|geo|maps):/i;

export function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return "/";
  }
}

export function tabForPath(pathname: string): TabId | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || path === "/home") return "home";
  if (
    path === "/encontre" ||
    path.startsWith("/encontre/") ||
    path === "/categorias" ||
    path.startsWith("/categorias/")
  ) {
    return "categories";
  }
  if (
    path === "/cidades" ||
    path.startsWith("/cidades/") ||
    path.startsWith("/cidade/")
  ) {
    return "cities";
  }
  if (path === "/buscar" || path.startsWith("/buscar/")) return "search";
  if (path === "/perfil" || path.startsWith("/perfil/")) return "profile";
  return null;
}

export function isFirstPartyHost(host: string): boolean {
  const normalized = host.toLowerCase().replace(/\.$/, "");
  return (
    normalized === "poliwebapp.com.br" ||
    normalized.endsWith(".poliwebapp.com.br")
  );
}

export function isWhatsAppHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return (
    normalized === "wa.me" ||
    normalized === "whatsapp.com" ||
    normalized.endsWith(".whatsapp.com")
  );
}

export function isMapUrl(host: string, pathname: string): boolean {
  const normalized = host.toLowerCase();
  const path = pathname.toLowerCase();
  if (
    normalized === "maps.google.com" ||
    normalized === "maps.google.com.br" ||
    normalized === "maps.apple.com" ||
    normalized === "maps.app.goo.gl"
  ) {
    return true;
  }
  if (normalized === "goo.gl" && (path === "/maps" || path.startsWith("/maps/"))) {
    return true;
  }
  const google =
    normalized === "google.com" ||
    normalized === "www.google.com" ||
    normalized === "google.com.br" ||
    normalized === "www.google.com.br" ||
    normalized.endsWith(".google.com") ||
    normalized.endsWith(".google.com.br");
  return google && (path === "/maps" || path.startsWith("/maps/"));
}

/**
 * Decide se a navegação fica no WebView, abre no app do sistema
 * (telefone, e-mail, WhatsApp, mapas) ou num navegador externo.
 * Subframes (anúncios, reCAPTCHA, mapa embutido) continuam na página.
 */
export function classifyNavigation(
  rawUrl: string,
  isTopFrame?: boolean,
): NavigationDecision {
  const url = rawUrl.trim();
  if (
    !url ||
    url === "about:blank" ||
    url.startsWith("about:") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return "allow";
  }

  if (SPECIAL_SCHEME.test(url)) return "system";

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "allow";
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") return "system";

  const host = parsed.hostname;
  if (isWhatsAppHost(host)) return "system";
  if (isMapUrl(host, parsed.pathname)) {
    return isTopFrame === false ? "allow" : "system";
  }
  if (isFirstPartyHost(host)) return "allow";
  if (isTopFrame === false) return "allow";
  return "browser";
}

/**
 * URL https/http do próprio Poliweb, para App Link e deep link.
 * Esquemas do Expo, WhatsApp e outros hosts ficam de fora.
 */
export function firstPartyWebUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }
  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "https:" && protocol !== "http:") return null;
  if (!isFirstPartyHost(parsed.hostname)) return null;
  return parsed.toString();
}

/** Abre no WebView só rotas do próprio Poliweb vindas de uma notificação. */
export function notificationUrl(
  data: Record<string, unknown> | undefined,
): string | null {
  const raw = data?.url ?? data?.path;
  if (typeof raw !== "string" || raw.length === 0) return null;
  const url = raw.startsWith("/") ? `https://www.poliwebapp.com.br${raw}` : raw;
  try {
    const host = new URL(url).hostname;
    return isFirstPartyHost(host) ? url : null;
  } catch {
    return null;
  }
}

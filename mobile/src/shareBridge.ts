export type ShareRequest = {
  id: number;
  title?: string;
  text?: string;
  url?: string;
};

export type ShareOutcome = "shared" | "dismissed" | "error";

export type NativeShareContent =
  | { title?: string; message: string }
  | { title?: string; message?: string; url: string };

function clean(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function httpUrl(value: unknown): string | undefined {
  const raw = clean(value, 2000);
  if (!raw) return undefined;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Valida o pedido que o polyfill de navigator.share manda pelo postMessage.
 * Sem título, texto ou URL válida não há o que compartilhar.
 */
export function parseShareRequest(data: unknown): ShareRequest | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as Record<string, unknown>;
  if (raw.type !== "poliweb-share") return null;
  if (typeof raw.id !== "number" || !Number.isInteger(raw.id) || raw.id <= 0) return null;
  const request: ShareRequest = {
    id: raw.id,
    title: clean(raw.title, 200),
    text: clean(raw.text, 1000),
    url: httpUrl(raw.url),
  };
  if (!request.title && !request.text && !request.url) return null;
  return request;
}

/**
 * O Android ignora `url` em Share.share; o link precisa ir dentro de `message`.
 * O iOS recebe a URL separada para o share sheet gerar a prévia do link.
 */
export function nativeShareContent(
  request: ShareRequest,
  platform: string,
): NativeShareContent {
  const { title, text, url } = request;
  if (platform === "ios" && url) return { title, message: text, url };
  const message = [text, url].filter(Boolean).join("\n") || title || "";
  return { title, message };
}

export function buildShareResultScript(id: number, outcome: ShareOutcome): string {
  return `
(function () {
  try {
    if (typeof window.__poliwebShareResult === "function") {
      window.__poliwebShareResult(${JSON.stringify(id)}, ${JSON.stringify(outcome)});
    }
  } catch (e) {}
})();
true;
`;
}

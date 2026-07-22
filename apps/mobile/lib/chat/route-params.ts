/** Normaliza `q` vindo de `useLocalSearchParams` (string | string[] | undefined). */
export function normalizeRouteParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

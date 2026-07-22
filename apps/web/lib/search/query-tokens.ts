import 'server-only';

/** PT articles/prepositions — stripped so multi-word queries still match indexed text */
const PT_STOP = new Set([
  'a',
  'o',
  'os',
  'as',
  'de',
  'do',
  'da',
  'dos',
  'das',
  'e',
  'em',
  'no',
  'na',
  'nos',
  'nas',
  'um',
  'uma',
  'uns',
  'umas',
  'para',
  'por',
  'que',
  'se',
  'ao',
  'aos',
  'à',
  'às',
]);

export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function significantSearchTokens(normalizedQuery: string): string[] {
  return normalizedQuery
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !PT_STOP.has(t));
}

/** PT — tokens equivalentes para turismo / guias (ex.: "guias turistico" ↔ guia + turismo) */
const TOKEN_EQUIVALENTS: Record<string, readonly string[]> = {
  numero: ['number'],
  number: ['numero'],
  guias: ['guia'],
  guia: ['guias'],
  turistico: ['turismo', 'turistica'],
  turistica: ['turismo', 'turistico'],
  turismo: ['turistico', 'turistica'],
};

function haystackHasToken(haystackNormalized: string, token: string): boolean {
  if (haystackNormalized.includes(token)) return true;
  const equivalents = TOKEN_EQUIVALENTS[token];
  return equivalents?.some((e) => e.length >= 2 && haystackNormalized.includes(e)) ?? false;
}

/** Every significant token must appear somewhere in the normalized haystack */
export function haystackMatchesSearchQuery(haystackNormalized: string, normalizedQuery: string): boolean {
  if (normalizedQuery.length < 2) return true;
  const tokens = significantSearchTokens(normalizedQuery);
  if (tokens.length === 0) {
    return haystackNormalized.includes(normalizedQuery);
  }
  return tokens.every((t) => haystackHasToken(haystackNormalized, t));
}

/**
 * 0 = no usable match; higher = better. Full phrase in haystack wins.
 */
export function scoreSearchMatch(normalizedQuery: string, haystackNormalized: string): number {
  if (!haystackNormalized || normalizedQuery.length < 2) return 0;
  if (haystackNormalized.includes(normalizedQuery)) return 0.95;

  const tokens = significantSearchTokens(normalizedQuery);
  if (tokens.length === 0) {
    return haystackNormalized.includes(normalizedQuery) ? 0.65 : 0;
  }

  const matched = tokens.filter((t) => haystackHasToken(haystackNormalized, t)).length;
  if (matched < tokens.length) return 0;
  return 0.88;
}

/** Terms to widen SQL `ilike` filters; scoring still happens in app code */
export function searchTermsForBroadIlike(q: string): string[] {
  const n = normalizeForSearch(q);
  if (n.length < 2) return [];
  const tokens = significantSearchTokens(n);
  return tokens.length > 0 ? tokens : [n];
}

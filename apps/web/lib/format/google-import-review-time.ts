export type GoogleReviewTimeInput = {
  relativeTime?: string | null;
  publishedAt?: string | null;
};

/** Rótulo fixo para avaliações com mais de um ano (só idade, sem texto em inglês). */
export const GOOGLE_REVIEW_OLD_LABEL = 'Comentário antigo';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function isPublishedOlderThanOneYear(publishedAt: string, now: Date): boolean {
  const d = new Date(publishedAt);
  if (Number.isNaN(d.getTime())) return false;
  return now.getTime() - d.getTime() >= MS_PER_YEAR;
}

function englishRelativeImpliesOneYearOrMore(lower: string): boolean {
  if (/^a\s+year\s+ago$/.test(lower)) return true;
  const years = lower.match(/^(\d+)\s+years?\s+ago$/);
  if (years && parseInt(years[1], 10) >= 1) return true;
  const months = lower.match(/^(\d+)\s+months?\s+ago$/);
  if (months && parseInt(months[1], 10) >= 12) return true;
  return false;
}

function translateEnglishRelative(lower: string, original: string): string {
  if (/^há\s/i.test(original.trim())) return original.trim();

  let m = lower.match(/^(\d+)\s+seconds?\s+ago$/);
  if (m) {
    const n = parseInt(m[1], 10);
    return `há ${n} ${n === 1 ? 'segundo' : 'segundos'}`;
  }
  m = lower.match(/^(\d+)\s+minutes?\s+ago$/);
  if (m) {
    const n = parseInt(m[1], 10);
    return `há ${n} ${n === 1 ? 'minuto' : 'minutos'}`;
  }
  m = lower.match(/^(\d+)\s+hours?\s+ago$/);
  if (m) {
    const n = parseInt(m[1], 10);
    return `há ${n} ${n === 1 ? 'hora' : 'horas'}`;
  }
  if (/^an?\s+hour\s+ago$/.test(lower)) return 'há 1 hora';

  m = lower.match(/^(\d+)\s+days?\s+ago$/);
  if (m) {
    const n = parseInt(m[1], 10);
    return `há ${n} ${n === 1 ? 'dia' : 'dias'}`;
  }
  m = lower.match(/^(\d+)\s+weeks?\s+ago$/);
  if (m) {
    const n = parseInt(m[1], 10);
    return `há ${n} ${n === 1 ? 'semana' : 'semanas'}`;
  }

  m = lower.match(/^(\d+)\s+months?\s+ago$/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 12) return GOOGLE_REVIEW_OLD_LABEL;
    return `há ${n} ${n === 1 ? 'mês' : 'meses'}`;
  }

  m = lower.match(/^a\s+(day|week|month)\s+ago$/);
  if (m) {
    const u = m[1];
    if (u === 'day') return 'há 1 dia';
    if (u === 'week') return 'há 1 semana';
    return 'há 1 mês';
  }

  if (/^yesterday$/i.test(lower)) return 'ontem';
  if (/^today$/i.test(lower)) return 'hoje';

  return original.trim();
}

/**
 * Exibe data relativa de comentário importado do Google em PT-BR.
 * Com mais de um ano (via `publishedAt` ou texto em inglês), retorna só {@link GOOGLE_REVIEW_OLD_LABEL}.
 */
export function formatGoogleImportReviewTime(
  review: GoogleReviewTimeInput,
  now: Date = new Date(),
): string | null {
  const published = review.publishedAt?.trim();
  if (published && isPublishedOlderThanOneYear(published, now)) {
    return GOOGLE_REVIEW_OLD_LABEL;
  }

  const raw = review.relativeTime?.trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (englishRelativeImpliesOneYearOrMore(lower)) {
    return GOOGLE_REVIEW_OLD_LABEL;
  }

  return translateEnglishRelative(lower, raw);
}

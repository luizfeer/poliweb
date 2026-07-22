export function getErrorMessage(caught: unknown, fallback: string): string {
  if (caught instanceof Error) return caught.message || fallback;
  if (!caught) return fallback;
  if (typeof caught === 'string') return caught;
  if (typeof caught === 'object') {
    const maybe = caught as { message?: unknown; error_description?: unknown; details?: unknown; hint?: unknown };
    const msg = typeof maybe.message === 'string' ? maybe.message : null;
    const desc = typeof maybe.error_description === 'string' ? maybe.error_description : null;
    const details = typeof maybe.details === 'string' ? maybe.details : null;
    const hint = typeof maybe.hint === 'string' ? maybe.hint : null;
    return [msg, desc, details, hint].filter(Boolean).join(' — ') || fallback;
  }
  return fallback;
}


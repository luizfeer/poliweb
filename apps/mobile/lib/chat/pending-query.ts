/**
 * Fallback quando a navegação por aba não repassa `params.q` (comum no NativeTabs).
 * Definir antes de `router.push` para a aba Assistente.
 */
let pendingQuery: string | null = null;

export function setPendingAssistantQuery(query: string): void {
  pendingQuery = query.trim();
}

export function consumePendingAssistantQuery(): string | null {
  const q = pendingQuery;
  pendingQuery = null;
  return q && q.length >= 2 ? q : null;
}

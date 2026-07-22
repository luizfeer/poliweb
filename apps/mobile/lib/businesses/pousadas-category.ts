/** Macro e folha do guia /comercio/pousadas (espelha expandCategorySlugs no web). */
const POUSADA_CATEGORY_SLUGS = new Set(['pousadas', 'pousada']);

export function hasPousadaCategory(slugs: Iterable<string>): boolean {
  for (const slug of slugs) {
    if (POUSADA_CATEGORY_SLUGS.has(slug)) return true;
  }
  return false;
}

export function categorySlugsFromAssignments(
  assignments:
    | Array<{ business_categories: { slug: string } | null } | null>
    | null
    | undefined,
): string[] {
  return (assignments ?? [])
    .map((a) => a?.business_categories?.slug)
    .filter((s): s is string => Boolean(s));
}

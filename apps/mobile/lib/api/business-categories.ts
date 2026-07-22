import { cachedJson } from '@/lib/api/cached-json';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export type BusinessCategoryRow = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  parentId: string | null;
  displayOrder: number;
};

const EMPTY: BusinessCategoryRow[] = [];
const TTL_MS = 30 * 60 * 1000;

/**
 * Top-level (parent_id IS NULL) business_categories da cidade, ativas, ordenadas.
 */
export async function fetchTopBusinessCategories(
  citySlug = env.defaultCitySlug,
): Promise<BusinessCategoryRow[]> {
  const cached = await cachedJson<BusinessCategoryRow[]>(
    `biz-categories:${citySlug}`,
    () => fetchRemote(citySlug),
    { ttlMs: TTL_MS },
  );
  return cached ?? EMPTY;
}

async function fetchRemote(citySlug: string): Promise<BusinessCategoryRow[] | null> {
  try {
    const { data: city, error: cityErr } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .maybeSingle<{ id: string }>();
    if (cityErr || !city) return null;

    const { data, error } = await supabase
      .from('business_categories')
      .select('id, slug, name, icon, parent_id, display_order, city_id')
      .or(`city_id.is.null,city_id.eq.${city.id}`)
      .eq('active', true)
      .is('parent_id', null)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (error || !data) return null;

    const bySlug = new Map<string, BusinessCategoryRow>();
    for (const row of data) {
      const slug = row.slug as string;
      const existing = bySlug.get(slug);
      const isCitySpecific = row.city_id != null;
      if (existing && !isCitySpecific) continue;
      bySlug.set(slug, {
        id: row.id as string,
        slug,
        name: row.name as string,
        icon: (row.icon ?? null) as string | null,
        parentId: (row.parent_id ?? null) as string | null,
        displayOrder: (row.display_order ?? 0) as number,
      });
    }
    return Array.from(bySlug.values()).sort(
      (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, 'pt-BR'),
    );
  } catch {
    return null;
  }
}

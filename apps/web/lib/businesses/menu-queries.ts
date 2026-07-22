import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Catalog, CatalogSection } from './catalog-types';

// Tabelas novas (business_menu_sections/items) ainda não estão no
// database.types gerado — cast permissivo até regenerar, como em lib/studio/actions.
async function db() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as unknown as { from: (t: string) => any };
}

type SectionRow = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  position: number;
};

type ItemRow = {
  id: string;
  business_id: string;
  section_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  photo_url: string | null;
  available: boolean;
  position: number;
};

/**
 * Lê o cardápio real do Supabase e monta o tipo `Catalog` que o CatalogShell já
 * renderiza. v1 sem optionGroups (sempre []). Retorna null se não há nenhuma
 * seção cadastrada — o chamador decide o fallback (ex.: mock em dev).
 */
export async function getBusinessMenu(businessId: string): Promise<Catalog | null> {
  const supabase = await db();

  const { data: sectionRows } = await supabase
    .from('business_menu_sections')
    .select('id, business_id, name, description, position')
    .eq('business_id', businessId)
    .order('position', { ascending: true });

  const sections = (sectionRows ?? []) as SectionRow[];
  if (sections.length === 0) return null;

  const { data: itemRows } = await supabase
    .from('business_menu_items')
    .select('id, business_id, section_id, name, description, price_cents, photo_url, available, position')
    .eq('business_id', businessId)
    .order('position', { ascending: true });

  const items = (itemRows ?? []) as ItemRow[];

  const catalogSections: CatalogSection[] = sections.map((section) => ({
    id: section.id,
    catalogId: businessId,
    name: section.name,
    description: section.description ?? undefined,
    displayOrder: section.position,
    items: items
      .filter((item) => item.section_id === section.id)
      .map((item) => ({
        id: item.id,
        sectionId: item.section_id,
        businessId: item.business_id,
        name: item.name,
        description: item.description ?? undefined,
        price: item.price_cents / 100,
        photoUrl: item.photo_url ?? undefined,
        available: item.available,
        displayOrder: item.position,
        optionGroups: [],
      })),
  }));

  return {
    id: businessId,
    businessId,
    name: 'Cardápio',
    catalogType: 'food_menu',
    sections: catalogSections,
  };
}

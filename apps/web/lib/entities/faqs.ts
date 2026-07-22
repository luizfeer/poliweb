import type { EntityFaq, EntityType } from './types';

type QueryBuilder = {
  eq: (column: string, value: string | boolean) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => QueryBuilder;
  };
};

type EntityFaqDbRow = {
  id: string;
  question: string;
  answer: string;
};

export async function getEntityFaqs(
  supabase: SupabaseLike,
  type: EntityType,
  id: string,
  cityId: string,
): Promise<EntityFaq[]> {
  const { data, error } = await supabase
    .from('entity_faqs')
    .select('id, question, answer')
    .eq('city_id', cityId)
    .eq('entity_type', type)
    .eq('entity_id', id)
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);

  return Array.isArray(data) ? (data as EntityFaqDbRow[]) : [];
}

import type { EntityService, EntityType } from './types';

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

type EntityServiceDbRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  duration_min: number | null;
  requirements: string | null;
};

export async function getEntityServices(
  supabase: SupabaseLike,
  type: EntityType,
  id: string,
  cityId: string,
): Promise<EntityService[]> {
  const { data, error } = await supabase
    .from('entity_services')
    .select('id, name, description, price_cents, duration_min, requirements')
    .eq('city_id', cityId)
    .eq('entity_type', type)
    .eq('entity_id', id)
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);

  return Array.isArray(data) ? (data as EntityServiceDbRow[]).map(toEntityService) : [];
}

function toEntityService(row: EntityServiceDbRow): EntityService {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    durationMin: row.duration_min,
    requirements: row.requirements,
  };
}

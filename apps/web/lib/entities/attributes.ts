import type { EntityAttributes, EntityType } from './types';

type QueryBuilder = {
  eq: (column: string, value: string) => QueryBuilder;
  maybeSingle: () => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => QueryBuilder;
  };
};

const TABLE_BY_TYPE: Partial<Record<EntityType, string>> = {
  business: 'businesses',
  restaurant: 'restaurants',
  accommodation: 'accommodations',
  attraction: 'attractions',
  utility: 'utilities',
};

export async function getEntityAttributes(
  supabase: SupabaseLike,
  type: EntityType,
  id: string,
  cityId: string,
): Promise<EntityAttributes> {
  const table = TABLE_BY_TYPE[type];
  if (!table) return {};

  const { data, error } = await supabase
    .from(table)
    .select('attributes')
    .eq('id', id)
    .eq('city_id', cityId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object' || !('attributes' in data)) return {};

  return normalizeAttributes(data.attributes);
}

export function attributesToText(attrs: EntityAttributes): string {
  return Object.entries(attrs)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join(', ');
}

function normalizeAttributes(value: unknown): EntityAttributes {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => ['boolean', 'string', 'number'].includes(typeof item) || item === null),
  ) as EntityAttributes;
}

function formatValue(value: EntityAttributes[string]): string {
  if (value === true) return 'sim';
  if (value === false) return 'nao';
  return String(value);
}

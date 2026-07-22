import type { EntityHoursRow } from './types';

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

type EntityHoursDbRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  city_id: string;
  weekday: number;
  starts_at: string;
  ends_at: string | null;
  kind: 'regular' | 'exception';
  valid_from: string | null;
  valid_until: string | null;
  note: string | null;
  source_status: 'confirmed' | 'needs_verification';
  active: boolean;
};

export async function getEntityHours(
  supabase: SupabaseLike,
  entityType: string,
  entityId: string,
  cityId: string,
): Promise<EntityHoursRow[]> {
  const { data, error } = await supabase
    .from('entity_hours')
    .select('id, entity_type, entity_id, city_id, weekday, starts_at, ends_at, kind, valid_from, valid_until, note, source_status, active')
    .eq('city_id', cityId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('active', true)
    .order('weekday', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return Array.isArray(data) ? (data as EntityHoursDbRow[]).map(toEntityHoursRow) : [];
}

function toEntityHoursRow(row: EntityHoursDbRow): EntityHoursRow {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    cityId: row.city_id,
    weekday: row.weekday,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    kind: row.kind,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    note: row.note,
    sourceStatus: row.source_status,
    active: row.active,
  };
}

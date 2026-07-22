'use server';

import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createServiceRoleClient } from '@/lib/supabase/service';

type EntityTable =
  | 'businesses'
  | 'accommodations'
  | 'restaurants'
  | 'fishing_guides'
  | 'events'
  | 'classifieds'
  | 'properties'
  | 'attractions'
  | 'tour_packages'
  | 'city_faqs';

type EntityRow = {
  id: string;
  city_id: string;
  status?: string | null;
  review_status?: string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
};

type QueueRow = {
  entity_type: string;
  entity_id: string;
  city_id: string;
  operation: 'upsert' | 'delete';
  processed_at: null;
  attempts: 0;
  last_error: null;
  enqueued_at: string;
};

type UntypedClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
    upsert: (
      rows: QueueRow[],
      options: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
  };
};

const reindexSearchSchema = z.instanceof(FormData);

const INDEXED_ENTITIES: Array<{
  entityType: string;
  table: EntityTable;
  select: string;
  isPublic: (row: EntityRow) => boolean;
}> = [
  { entityType: 'business', table: 'businesses', select: 'id,city_id,status', isPublic: hasPublicStatus },
  { entityType: 'accommodation', table: 'accommodations', select: 'id,city_id,status', isPublic: hasPublicStatus },
  { entityType: 'restaurant', table: 'restaurants', select: 'id,city_id,status', isPublic: hasPublicStatus },
  { entityType: 'fishing_guide', table: 'fishing_guides', select: 'id,city_id,status', isPublic: hasPublicStatus },
  { entityType: 'event', table: 'events', select: 'id,city_id,status', isPublic: hasPublicStatus },
  {
    entityType: 'classified',
    table: 'classifieds',
    select: 'id,city_id,status,review_status,expires_at',
    isPublic: (row) => hasPublicStatus(row) && row.review_status === 'approved' && !isExpired(row.expires_at),
  },
  { entityType: 'property', table: 'properties', select: 'id,city_id,status', isPublic: hasPublicStatus },
  { entityType: 'attraction', table: 'attractions', select: 'id,city_id,status', isPublic: hasPublicStatus },
  { entityType: 'tour_package', table: 'tour_packages', select: 'id,city_id,status', isPublic: hasPublicStatus },
  { entityType: 'faq', table: 'city_faqs', select: 'id,city_id,is_active', isPublic: (row) => row.is_active === true },
];

export async function requeueSearchIndexAction(input: FormData): Promise<void> {
  const parsed = reindexSearchSchema.safeParse(input);
  if (!parsed.success) {
    return;
  }

  const city = await getCurrentCity();
  if (!city) notFound();
  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = createServiceRoleClient() as unknown as UntypedClient;
  const now = new Date().toISOString();
  let queued = 0;

  for (const entity of INDEXED_ENTITIES) {
    const { data, error } = await supabase
      .from(entity.table)
      .select(entity.select)
      .eq('city_id', city.id);

    if (error || !Array.isArray(data)) continue;

    const rows = (data as EntityRow[]).map((row) => ({
      entity_type: entity.entityType,
      entity_id: row.id,
      city_id: city.id,
      operation: entity.isPublic(row) ? 'upsert' as const : 'delete' as const,
      processed_at: null,
      attempts: 0 as const,
      last_error: null,
      enqueued_at: now,
    }));

    if (rows.length === 0) continue;
    const { error: upsertError } = await supabase
      .from('indexing_queue')
      .upsert(rows, { onConflict: 'entity_type,entity_id' });

    if (!upsertError) queued += rows.length;
  }

  await createAuditLog(city.id, auth.profile.id, queued);
  revalidatePath('/painel/cidade/jobs');
}

async function createAuditLog(cityId: string, profileId: string, queued: number) {
  const supabase = createServiceRoleClient() as unknown as {
    from: (table: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  };

  await supabase.from('audit_log').insert({
    city_id: cityId,
    actor_id: profileId,
    action: 'search.reindex.queue',
    entity_type: 'indexing_queue',
    diff: { queued },
  });
}

function hasPublicStatus(row: EntityRow): boolean {
  return ['active', 'approved', 'published'].includes(row.status ?? '');
}

function isExpired(value: string | null | undefined): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time < Date.now();
}

'use server';

import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/service';

const trackSearchClickSchema = z.object({
  queryId: z.uuid(),
  entityType: z.string().min(1).max(40),
  entityId: z.string().min(1).max(80),
});

type UntypedUpdateClient = {
  from: (table: string) => {
    update: (patch: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export async function trackSearchClickAction(input: unknown) {
  const parsed = trackSearchClickSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false };
  }

  const supabase = createServiceRoleClient() as unknown as UntypedUpdateClient;
  const patch: Record<string, unknown> = {
    clicked_entity_type: parsed.data.entityType,
  };
  const entityId = z.uuid().safeParse(parsed.data.entityId);
  if (entityId.success) {
    patch.clicked_entity_id = entityId.data;
  }

  const { error } = await supabase
    .from('search_queries')
    .update(patch)
    .eq('id', parsed.data.queryId);

  return { ok: !error };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';

export async function insertUtilityAudit(
  action: string,
  cityId: string,
  entityType: string,
  entityId: string | null,
  diff: Json,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    city_id: cityId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    diff,
  });
}

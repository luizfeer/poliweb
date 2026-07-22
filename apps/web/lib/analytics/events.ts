import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';

export async function trackEvent(input: {
  cityId?: string | null;
  eventName: string;
  path: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Json;
}) {
  const supabase = await createClient();
  await supabase.from('analytics_events').insert({
    city_id: input.cityId ?? null,
    event_name: input.eventName,
    path: input.path,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function listAnalyticsEvents(cityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('analytics_events')
    .select('id, event_name, path, entity_type, entity_id, created_at')
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

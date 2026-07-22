import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { EntityPost, EntityPostType } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPost(row: any): EntityPost {
  return {
    id: row.id,
    cityId: row.city_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    body: row.body ?? null,
    imageUrl: row.image_url ?? null,
    videoUrl: row.video_url ?? null,
    buttonLabel: row.button_label ?? null,
    buttonUrl: row.button_url ?? null,
    pinned: row.pinned ?? false,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export async function listEntityPosts(entityType: EntityPostType, entityId: string): Promise<EntityPost[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('entity_posts' as any) as any)
    .select('id, city_id, entity_type, entity_id, title, body, image_url, video_url, button_label, button_url, pinned, published_at, created_at')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false });

  return (data ?? []).map(mapPost);
}

export async function listRecentEntityPosts(entityType: EntityPostType, entityId: string, limit = 5): Promise<EntityPost[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('entity_posts' as any) as any)
    .select('id, city_id, entity_type, entity_id, title, body, image_url, video_url, button_label, button_url, pinned, published_at, created_at')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapPost);
}

import { supabase } from '@/lib/supabase';

export type NotificationItem = {
  id: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  body: string | null;
  target_url: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
  archived_at: string | null;
  city_id: string | null;
};

export type NotificationsFeedPage = {
  items: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
};

const PAGE_SIZE = 30;

const SELECT_COLS =
  'id, type, priority, title, body, target_url, metadata, created_at, read_at, archived_at, city_id';

/**
 * Busca o feed de notificações do usuário autenticado direto do Supabase.
 * RLS garante que ele só enxergue as próprias linhas.
 */
export async function fetchNotificationsFeed(
  opts: { cursor?: string | null; unreadOnly?: boolean } = {},
): Promise<NotificationsFeedPage | null> {
  let query = supabase
    .from('notifications')
    .select(SELECT_COLS)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (opts.unreadOnly) query = query.is('read_at', null);
  if (opts.cursor) query = query.lt('created_at', opts.cursor);

  const { data, error } = await query;
  if (error) {
    console.warn('[notifications] fetchNotificationsFeed', error.message);
    return null;
  }

  const rows = (data ?? []) as NotificationItem[];
  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.created_at ?? null : null;

  const unreadCount = await fetchUnreadCount();

  return { items, nextCursor, unreadCount };
}

export async function fetchUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null)
    .is('archived_at', null);
  if (error) {
    console.warn('[notifications] fetchUnreadCount', error.message);
    return 0;
  }
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);
  if (error) {
    console.warn('[notifications] markNotificationRead', error.message);
    return false;
  }
  return true;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
    .is('archived_at', null);
  if (error) {
    console.warn('[notifications] markAllNotificationsRead', error.message);
    return false;
  }
  return true;
}

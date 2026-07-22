import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../../runtime/env.js';

export function buildSupabase(env: WorkerEnv): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type PushDelivery = {
  delivery_id: string;
  notification_id: string;
  title: string;
  body: string | null;
  target_url: string;
  push_payload: Record<string, unknown> | null;
  recipient_profile_id: string;
};

export type ExpoToken = { token: string; platform: string };
export type WebPushSub = { endpoint: string; p256dh: string; auth: string };

export async function fetchPendingPushDeliveries(
  supabase: SupabaseClient,
  limit: number,
): Promise<PushDelivery[]> {
  const { data, error } = await supabase
    .from('notification_deliveries')
    .select(
      `
      id,
      notification:notifications!inner (
        id,
        title,
        body,
        target_url,
        push_payload,
        recipient_profile_id
      )
      `,
    )
    .eq('channel', 'push')
    .eq('status', 'pending')
    .limit(limit);

  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    notification: {
      id: string;
      title: string;
      body: string | null;
      target_url: string;
      push_payload: Record<string, unknown> | null;
      recipient_profile_id: string;
    };
  }>;

  return rows.map((row) => ({
    delivery_id: row.id,
    notification_id: row.notification.id,
    title: row.notification.title,
    body: row.notification.body,
    target_url: row.notification.target_url,
    push_payload: row.notification.push_payload,
    recipient_profile_id: row.notification.recipient_profile_id,
  }));
}

export async function fetchExpoTokens(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ExpoToken[]> {
  const { data, error } = await supabase
    .from('device_push_tokens')
    .select('token, platform')
    .eq('profile_id', profileId);

  if (error) {
    console.error('[push] fetchExpoTokens failed', profileId, error.message);
    return [];
  }
  return (data ?? []) as ExpoToken[];
}

export async function fetchWebPushSubs(
  supabase: SupabaseClient,
  profileId: string,
): Promise<WebPushSub[]> {
  const { data, error } = await supabase
    .from('web_push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('profile_id', profileId);

  if (error) {
    console.error('[push] fetchWebPushSubs failed', profileId, error.message);
    return [];
  }
  return (data ?? []) as WebPushSub[];
}

export async function markDelivery(
  supabase: SupabaseClient,
  deliveryId: string,
  outcome: 'sent' | 'failed' | 'skipped',
  options: { errorMessage?: string; provider?: string } = {},
): Promise<void> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: outcome,
    provider: options.provider ?? 'push',
  };
  if (outcome === 'sent') update.sent_at = now;
  if (outcome === 'failed') {
    update.failed_at = now;
    if (options.errorMessage) update.error_message = options.errorMessage.slice(0, 500);
  }
  if (outcome === 'skipped' && options.errorMessage) {
    update.error_message = options.errorMessage.slice(0, 500);
  }

  const { error } = await supabase
    .from('notification_deliveries')
    .update(update)
    .eq('id', deliveryId);

  if (error) {
    console.error('[push] markDelivery failed', deliveryId, error);
  }
}

export async function removeExpiredExpoToken(
  supabase: SupabaseClient,
  token: string,
): Promise<void> {
  await supabase.from('device_push_tokens').delete().eq('token', token);
}

export async function removeExpiredWebSub(
  supabase: SupabaseClient,
  endpoint: string,
): Promise<void> {
  await supabase.from('web_push_subscriptions').delete().eq('endpoint', endpoint);
}

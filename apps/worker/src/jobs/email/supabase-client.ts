import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../../runtime/env.js';

export function buildSupabase(env: WorkerEnv): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type PendingDelivery = {
  delivery_id: string;
  notification_id: string;
  title: string;
  body: string | null;
  target_url: string;
  metadata: Record<string, unknown> | null;
  recipient_profile_id: string;
  recipient_email: string;
};

export async function fetchPendingDeliveries(
  supabase: SupabaseClient,
  limit: number,
): Promise<PendingDelivery[]> {
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
        metadata,
        recipient_profile_id
      )
      `,
    )
    .eq('channel', 'email')
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
      metadata: Record<string, unknown> | null;
      recipient_profile_id: string;
    };
  }>;

  const result: PendingDelivery[] = [];
  for (const row of rows) {
    const explicit = extractMetadataEmail(row.notification.metadata);
    const email = explicit ?? (await resolveProfileEmail(supabase, row.notification.recipient_profile_id));
    if (!email) continue;
    result.push({
      delivery_id: row.id,
      notification_id: row.notification.id,
      title: row.notification.title,
      body: row.notification.body,
      target_url: row.notification.target_url,
      metadata: row.notification.metadata,
      recipient_profile_id: row.notification.recipient_profile_id,
      recipient_email: email,
    });
  }
  return result;
}

const emailByProfileCache = new Map<string, { email: string | null; expiresAt: number }>();
const PROFILE_EMAIL_TTL_MS = 5 * 60 * 1000;

async function resolveProfileEmail(
  supabase: SupabaseClient,
  profileId: string,
): Promise<string | null> {
  const now = Date.now();
  const cached = emailByProfileCache.get(profileId);
  if (cached && cached.expiresAt > now) return cached.email;

  try {
    const { data, error } = await supabase.auth.admin.getUserById(profileId);
    if (error) {
      console.error('[email] auth.admin.getUserById falhou', profileId, error.message);
      emailByProfileCache.set(profileId, { email: null, expiresAt: now + PROFILE_EMAIL_TTL_MS });
      return null;
    }
    const email = data.user?.email ?? null;
    emailByProfileCache.set(profileId, { email, expiresAt: now + PROFILE_EMAIL_TTL_MS });
    return email;
  } catch (err) {
    console.error('[email] resolveProfileEmail crash', profileId, err);
    return null;
  }
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
    provider: options.provider ?? 'brevo',
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
    console.error('[email] markDelivery falhou', deliveryId, error);
  }
}

function extractMetadataEmail(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  const value = metadata.email_to;
  if (typeof value !== 'string') return null;
  return value.includes('@') ? value : null;
}

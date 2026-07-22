import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../runtime/env.js';
import { logger } from '../runtime/logger.js';
import { buildSupabase, markDelivery } from './push/supabase-client.js';

type PendingEmailDelivery = {
  delivery_id: string;
  notification_id: string;
  title: string;
  body: string | null;
  target_url: string;
  metadata: Record<string, unknown> | null;
  recipient_profile_id: string;
  recipient_email: string;
};

let shuttingDown = false;

export async function runEmailDispatchBridge(env: WorkerEnv): Promise<void> {
  if (!env.emailDispatcherUrl || !env.emailDispatcherToken) {
    throw new Error('EMAIL_DISPATCHER_URL / EMAIL_DISPATCHER_TOKEN ausentes.');
  }
  const dispatcherUrl = env.emailDispatcherUrl;
  const dispatcherToken = env.emailDispatcherToken;

  const supabase = buildSupabase(env);

  logger.info('email:dispatch-bridge started', {
    poll_interval_ms: env.emailDispatchPollIntervalMs,
    batch_size: env.emailDispatchBatchSize,
    service: env.emailDispatcherService,
  });

  process.on('SIGINT', () => {
    logger.info('email:dispatch-bridge SIGINT received');
    shuttingDown = true;
  });
  process.on('SIGTERM', () => {
    logger.info('email:dispatch-bridge SIGTERM received');
    shuttingDown = true;
  });

  while (!shuttingDown) {
    try {
      const pending = await fetchPendingEmailDeliveries(supabase, env.emailDispatchBatchSize);
      if (pending.length === 0) {
        await sleep(env.emailDispatchPollIntervalMs);
        continue;
      }
      for (const delivery of pending) {
        if (shuttingDown) break;
        await processOne({ env, dispatcherUrl, dispatcherToken }, supabase, delivery);
      }
    } catch (err) {
      const detail =
        err instanceof Error
          ? { message: err.message, stack: err.stack ?? null }
          : { err: String(err) };
      logger.error('email:dispatch-bridge tick failed', detail);
      await sleep(env.emailDispatchPollIntervalMs);
    }
  }

  logger.info('email:dispatch-bridge stopped');
}

async function fetchPendingEmailDeliveries(
  supabase: SupabaseClient,
  limit: number,
): Promise<PendingEmailDelivery[]> {
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

  const result: PendingEmailDelivery[] = [];
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

async function processOne(
  ctx: { env: WorkerEnv; dispatcherUrl: string; dispatcherToken: string },
  supabase: SupabaseClient,
  delivery: PendingEmailDelivery,
): Promise<void> {
  const { env, dispatcherUrl, dispatcherToken } = ctx;
  const service = metadataString(delivery.metadata, 'email_service') ?? env.emailDispatcherService;
  const targetUrl = delivery.target_url.startsWith('http')
    ? delivery.target_url
    : `${env.appUrl}${delivery.target_url}`;

  try {
    const response = await fetch(`${dispatcherUrl.replace(/\/$/, '')}/emails`, {
      method: 'POST',
      headers: {
        authorization: dispatcherToken,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        service,
        to_email: delivery.recipient_email,
        subject: delivery.title,
        text_body: delivery.body ?? delivery.title,
        target_url: targetUrl,
        cta_label: metadataString(delivery.metadata, 'email_cta_label') ?? 'Abrir no painel',
        brand_name: metadataString(delivery.metadata, 'email_brand_name') ?? 'Portal Carmelitano',
        footnote: metadataString(delivery.metadata, 'email_footnote') ?? 'Este aviso foi gerado automaticamente.',
        tags: metadataStringArray(delivery.metadata, 'email_tags'),
        metadata: {
          source: 'hail_mary.notification_deliveries',
          notification_id: delivery.notification_id,
          delivery_id: delivery.delivery_id,
          recipient_profile_id: delivery.recipient_profile_id,
        },
      }),
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`dispatcher HTTP ${response.status}: ${body.slice(0, 300)}`);
    }

    await markDelivery(supabase, delivery.delivery_id, 'sent', { provider: 'email_dispatcher' });
    logger.info('email dispatched', { delivery_id: delivery.delivery_id, service });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    await markDelivery(supabase, delivery.delivery_id, 'failed', {
      provider: 'email_dispatcher',
      errorMessage: message,
    });
    logger.error('email dispatch failed', { delivery_id: delivery.delivery_id, service, message });
  }
}

const emailByProfileCache = new Map<string, { email: string | null; expiresAt: number }>();
const PROFILE_EMAIL_TTL_MS = 5 * 60 * 1000;

async function resolveProfileEmail(supabase: SupabaseClient, profileId: string): Promise<string | null> {
  const now = Date.now();
  const cached = emailByProfileCache.get(profileId);
  if (cached && cached.expiresAt > now) return cached.email;

  const { data, error } = await supabase.auth.admin.getUserById(profileId);
  if (error) {
    logger.error('email resolve profile failed', { profile_id: profileId, message: error.message });
    emailByProfileCache.set(profileId, { email: null, expiresAt: now + PROFILE_EMAIL_TTL_MS });
    return null;
  }
  const email = data.user?.email ?? null;
  emailByProfileCache.set(profileId, { email, expiresAt: now + PROFILE_EMAIL_TTL_MS });
  return email;
}

function extractMetadataEmail(metadata: Record<string, unknown> | null): string | null {
  const value = metadata?.email_to;
  return typeof value === 'string' && value.includes('@') ? value : null;
}

function metadataString(metadata: Record<string, unknown> | null, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function metadataStringArray(metadata: Record<string, unknown> | null, key: string): string[] {
  const value = metadata?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

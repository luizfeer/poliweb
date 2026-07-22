import type { WorkerEnv } from '../runtime/env.js';
import { logger } from '../runtime/logger.js';
import {
  buildSupabase,
  fetchPendingPushDeliveries,
  fetchExpoTokens,
  fetchWebPushSubs,
  markDelivery,
  removeExpiredExpoToken,
  removeExpiredWebSub,
  type PushDelivery,
} from './push/supabase-client.js';
import { configureWebPush, sendExpo, sendWebPush } from './push/sender.js';

let shuttingDown = false;

export async function runPushDeliveries(env: WorkerEnv): Promise<void> {
  if (!env.vapidPublicKey || !env.vapidPrivateKey) {
    throw new Error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY ausentes — não dá pra iniciar o daemon de push.');
  }

  configureWebPush(env);
  const supabase = buildSupabase(env);

  logger.info('push:deliveries started', {
    poll_interval_ms: env.pushPollIntervalMs,
    batch_size: env.pushBatchSize,
  });

  process.on('SIGINT', () => {
    logger.info('push:deliveries SIGINT received');
    shuttingDown = true;
  });
  process.on('SIGTERM', () => {
    logger.info('push:deliveries SIGTERM received');
    shuttingDown = true;
  });

  while (!shuttingDown) {
    try {
      const pending = await fetchPendingPushDeliveries(supabase, env.pushBatchSize);
      if (pending.length === 0) {
        await sleep(env.pushPollIntervalMs);
        continue;
      }
      for (const delivery of pending) {
        if (shuttingDown) break;
        await processOne(env, supabase, delivery);
      }
    } catch (err) {
      const detail =
        err instanceof Error
          ? { message: err.message, stack: err.stack ?? null }
          : { err: String(err) };
      logger.error('push:deliveries tick failed', detail);
      await sleep(env.pushPollIntervalMs);
    }
  }

  logger.info('push:deliveries stopped');
}

async function processOne(
  env: WorkerEnv,
  supabase: ReturnType<typeof buildSupabase>,
  delivery: PushDelivery,
): Promise<void> {
  const targetUrl = delivery.target_url.startsWith('http')
    ? delivery.target_url
    : `${env.appUrl}${delivery.target_url}`;

  const [expoTokens, webSubs] = await Promise.all([
    fetchExpoTokens(supabase, delivery.recipient_profile_id),
    fetchWebPushSubs(supabase, delivery.recipient_profile_id),
  ]);

  if (expoTokens.length === 0 && webSubs.length === 0) {
    await markDelivery(supabase, delivery.delivery_id, 'skipped', {
      errorMessage: 'sem tokens registrados',
    });
    logger.info('push skipped — no tokens', { delivery_id: delivery.delivery_id });
    return;
  }

  let anySent = false;
  let lastError: string | undefined;

  if (expoTokens.length > 0) {
    const results = await sendExpo(
      env,
      expoTokens,
      delivery.title,
      delivery.body,
      targetUrl,
      delivery.push_payload,
    );

    for (const [token, result] of results) {
      if (result.ok) {
        anySent = true;
        logger.info('push sent (expo)', { delivery_id: delivery.delivery_id, token: token.slice(0, 20) });
      } else {
        lastError = result.error;
        logger.warn('push failed (expo)', { delivery_id: delivery.delivery_id, error: result.error });
        if (result.expired) {
          await removeExpiredExpoToken(supabase, token);
          logger.info('push expired token removed', { token: token.slice(0, 20) });
        }
      }
    }
  }

  for (const sub of webSubs) {
    const result = await sendWebPush(
      sub,
      delivery.title,
      delivery.body,
      targetUrl,
      delivery.push_payload,
    );
    if (result.ok) {
      anySent = true;
      logger.info('push sent (webpush)', { delivery_id: delivery.delivery_id, endpoint: sub.endpoint.slice(0, 40) });
    } else {
      lastError = result.error;
      logger.warn('push failed (webpush)', { delivery_id: delivery.delivery_id, error: result.error });
      if (result.expired) {
        await removeExpiredWebSub(supabase, sub.endpoint);
        logger.info('push expired sub removed', { endpoint: sub.endpoint.slice(0, 40) });
      }
    }
  }

  if (anySent) {
    await markDelivery(supabase, delivery.delivery_id, 'sent', { provider: 'push' });
  } else {
    await markDelivery(supabase, delivery.delivery_id, 'failed', {
      provider: 'push',
      ...(lastError !== undefined ? { errorMessage: lastError } : {}),
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

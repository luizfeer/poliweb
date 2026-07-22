import type { WorkerEnv } from '../runtime/env.js';
import { logger } from '../runtime/logger.js';
import { sendBrevoEmail } from './email/brevo.js';
import { renderEmail } from './email/template.js';
import {
  buildSupabase,
  fetchPendingDeliveries,
  markDelivery,
  type PendingDelivery,
} from './email/supabase-client.js';

let shuttingDown = false;

export async function runEmailDeliveries(env: WorkerEnv): Promise<void> {
  if (Object.keys(env.brevoServices).length === 0) {
    throw new Error('Nenhuma configuracao Brevo encontrada. Configure BREVO_API_KEY ou BREVO_SERVICES_JSON.');
  }

  const supabase = buildSupabase(env);

  logger.info('email:deliveries started', {
    poll_interval_ms: env.emailPollIntervalMs,
    batch_size: env.emailBatchSize,
    default_service: env.brevoDefaultService,
    services: Object.keys(env.brevoServices),
  });

  process.on('SIGINT', () => {
    logger.info('email:deliveries SIGINT received');
    shuttingDown = true;
  });
  process.on('SIGTERM', () => {
    logger.info('email:deliveries SIGTERM received');
    shuttingDown = true;
  });

  while (!shuttingDown) {
    try {
      const pending = await fetchPendingDeliveries(supabase, env.emailBatchSize);
      if (pending.length === 0) {
        await sleep(env.emailPollIntervalMs);
        continue;
      }
      for (const delivery of pending) {
        if (shuttingDown) break;
        await processOne(env, supabase, delivery);
      }
    } catch (err) {
      const detail: Record<string, string | null> =
        err instanceof Error
          ? { message: err.message, stack: err.stack ?? null }
          : typeof err === 'object' && err !== null
            ? Object.fromEntries(
                Object.entries(err as Record<string, unknown>).map(([k, v]) => [
                  k,
                  v == null ? null : typeof v === 'string' ? v : JSON.stringify(v),
                ]),
              )
            : { err: String(err) };
      logger.error('email:deliveries tick failed', detail);
      await sleep(env.emailPollIntervalMs);
    }
  }

  logger.info('email:deliveries stopped');
}

async function processOne(
  env: WorkerEnv,
  supabase: ReturnType<typeof buildSupabase>,
  delivery: PendingDelivery,
): Promise<void> {
  const serviceName = getMetadataString(delivery.metadata, 'email_service')
    ?? getMetadataString(delivery.metadata, 'service')
    ?? env.brevoDefaultService;
  const service = env.brevoServices[serviceName];
  if (!service) {
    logger.error('email service missing', { delivery_id: delivery.delivery_id, service: serviceName });
    await markDelivery(supabase, delivery.delivery_id, 'failed', {
      provider: 'brevo',
      errorMessage: `Servico de email Brevo nao configurado: ${serviceName}`,
    });
    return;
  }

  const ctaUrl = delivery.target_url.startsWith('http')
    ? delivery.target_url
    : `${service.appUrl}${delivery.target_url}`;
  const ctaLabel = getMetadataString(delivery.metadata, 'email_cta_label') ?? 'Abrir no painel';
  const footnote = getMetadataString(delivery.metadata, 'email_footnote')
    ?? 'Este aviso foi gerado automaticamente.';
  const tags = [
    ...service.defaultTags,
    ...getMetadataStringArray(delivery.metadata, 'email_tags'),
  ];
  const brandName = getMetadataString(delivery.metadata, 'email_brand_name') ?? service.fromName;

  const { html, text } = renderEmail({
    brandName,
    title: delivery.title,
    body: delivery.body,
    ctaLabel,
    ctaUrl,
    footnote,
  });

  try {
    const result = await sendBrevoEmail({
      to: delivery.recipient_email,
      subject: delivery.title,
      html,
      text,
      tags,
      fromEmail: service.fromEmail,
      fromName: service.fromName,
      apiKey: service.apiKey,
    });
    logger.info('email sent', {
      delivery_id: delivery.delivery_id,
      message_id: result.messageId,
      service: serviceName,
    });
    await markDelivery(supabase, delivery.delivery_id, 'sent', { provider: 'brevo' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    logger.error('email failed', { delivery_id: delivery.delivery_id, message, service: serviceName });
    await markDelivery(supabase, delivery.delivery_id, 'failed', {
      provider: 'brevo',
      errorMessage: message,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMetadataString(metadata: Record<string, unknown> | null, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getMetadataStringArray(metadata: Record<string, unknown> | null, key: string): string[] {
  const value = metadata?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

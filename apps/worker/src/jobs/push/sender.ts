import Expo, { type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import webpush from 'web-push';
import type { WorkerEnv } from '../../runtime/env.js';
import type { ExpoToken, WebPushSub } from './supabase-client.js';

export type SendResult =
  | { ok: true; provider: string }
  | { ok: false; provider: string; error: string; expired?: boolean };

let expoClient: Expo | null = null;

function getExpoClient(env: WorkerEnv): Expo {
  if (!expoClient) {
    const opts = env.expoAccessToken ? { accessToken: env.expoAccessToken } : {};
    expoClient = new Expo(opts);
  }
  return expoClient;
}

export function configureWebPush(env: WorkerEnv): void {
  webpush.setVapidDetails(
    env.vapidSubject,
    env.vapidPublicKey,
    env.vapidPrivateKey,
  );
}

export async function sendExpo(
  env: WorkerEnv,
  tokens: ExpoToken[],
  title: string,
  body: string | null,
  targetUrl: string,
  extraPayload: Record<string, unknown> | null,
): Promise<Map<string, SendResult>> {
  const results = new Map<string, SendResult>();

  const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t.token));
  if (validTokens.length === 0) return results;

  const messages: ExpoPushMessage[] = validTokens.map((t) => {
    const msg: ExpoPushMessage = {
      to: t.token,
      title,
      data: { url: targetUrl, ...(extraPayload ?? {}) },
      sound: 'default',
    };
    if (body != null) msg.body = body;
    return msg;
  });

  const expo = getExpoClient(env);
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    let tickets: ExpoPushTicket[];
    try {
      tickets = await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      for (const msg2 of chunk) {
        const token = typeof msg2.to === 'string' ? msg2.to : msg2.to[0] ?? '';
        results.set(token, { ok: false, provider: 'expo', error: msg });
      }
      continue;
    }

    tickets.forEach((ticket, i) => {
      const token = typeof chunk[i]!.to === 'string'
        ? (chunk[i]!.to as string)
        : (chunk[i]!.to as string[])[0] ?? '';

      if (ticket.status === 'ok') {
        results.set(token, { ok: true, provider: 'expo' });
      } else {
        const expired =
          ticket.details?.error === 'DeviceNotRegistered' ||
          ticket.details?.error === 'InvalidCredentials';
        results.set(token, {
          ok: false,
          provider: 'expo',
          error: ticket.details?.error ?? 'unknown',
          expired,
        });
      }
    });
  }

  return results;
}

export async function sendWebPush(
  sub: WebPushSub,
  title: string,
  body: string | null,
  targetUrl: string,
  extraPayload: Record<string, unknown> | null,
): Promise<SendResult> {
  const payload = JSON.stringify({
    title,
    body: body ?? '',
    url: targetUrl,
    ...(extraPayload ?? {}),
  });

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
      { TTL: 86400 },
    );
    return { ok: true, provider: 'webpush' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const statusCode = (err as { statusCode?: number }).statusCode;
    const expired = statusCode === 404 || statusCode === 410;
    return { ok: false, provider: 'webpush', error: msg, expired };
  }
}

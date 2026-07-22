import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export type ExpoPushMessage = {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: 'default' | 'alerts';
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
};

type ExpoTicket =
  | { status: 'ok'; id: string }
  | { status: 'error'; message: string; details?: { error?: string } };

type ExpoPushResponse = { data: ExpoTicket[] } | { errors: { message: string }[] };

const EXPO_PUSH_CHUNK_SIZE = 100;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoTicket[]> {
  if (messages.length === 0) return [];
  const tickets: ExpoTicket[] = [];

  for (const group of chunk(messages, EXPO_PUSH_CHUNK_SIZE)) {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        ...(process.env.EXPO_ACCESS_TOKEN
          ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(group),
    });
    const json = (await res.json()) as ExpoPushResponse;
    if ('errors' in json) {
      throw new Error(`Expo push error: ${json.errors.map((e) => e.message).join(', ')}`);
    }
    tickets.push(...json.data);
  }

  return tickets;
}

/**
 * Envia push para todos os dispositivos de um usuário.
 * Limpa tokens marcados como `DeviceNotRegistered` pela Expo.
 */
export async function pushToUser(
  profileId: string,
  payload: Omit<ExpoPushMessage, 'to'>,
): Promise<{ sent: number; cleaned: number }> {
  const service = createServiceRoleClient();
  const { data: tokens } = await service
    .from('device_push_tokens')
    .select('token')
    .eq('profile_id', profileId);

  if (!tokens || tokens.length === 0) return { sent: 0, cleaned: 0 };

  const messages: ExpoPushMessage[] = tokens.map((row) => ({ to: row.token, ...payload }));
  const tickets = await sendExpoPush(messages);

  const stale: string[] = [];
  tickets.forEach((ticket, index) => {
    if (
      ticket.status === 'error' &&
      ticket.details?.error === 'DeviceNotRegistered' &&
      tokens[index]
    ) {
      stale.push(tokens[index].token);
    }
  });

  if (stale.length > 0) {
    await service.from('device_push_tokens').delete().in('token', stale);
  }

  return { sent: tickets.filter((t) => t.status === 'ok').length, cleaned: stale.length };
}

/**
 * Envia push para uma lista de usuários (ex: todos com role `citizen` em uma cidade).
 * Quem deriva a lista a partir de `profile_roles` é o caller — esse helper só ventila.
 */
export async function pushToUsers(
  profileIds: string[],
  payload: Omit<ExpoPushMessage, 'to'>,
): Promise<{ sent: number; cleaned: number }> {
  if (profileIds.length === 0) return { sent: 0, cleaned: 0 };
  const service = createServiceRoleClient();
  const { data: tokens } = await service
    .from('device_push_tokens')
    .select('token')
    .in('profile_id', profileIds);

  if (!tokens || tokens.length === 0) return { sent: 0, cleaned: 0 };

  const messages: ExpoPushMessage[] = tokens.map((row) => ({
    to: row.token,
    channelId: 'alerts',
    priority: 'high',
    ...payload,
  }));
  const tickets = await sendExpoPush(messages);

  const stale: string[] = [];
  tickets.forEach((ticket, index) => {
    if (
      ticket.status === 'error' &&
      ticket.details?.error === 'DeviceNotRegistered' &&
      tokens[index]
    ) {
      stale.push(tokens[index].token);
    }
  });

  if (stale.length > 0) {
    await service.from('device_push_tokens').delete().in('token', stale);
  }

  return { sent: tickets.filter((t) => t.status === 'ok').length, cleaned: stale.length };
}

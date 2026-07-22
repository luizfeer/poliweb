/**
 * Webhook do WhatsApp Cloud API.
 *
 * GET  → handshake de verificação (hub.challenge)
 * POST → recebe mensagens/status, persiste em wa_messages + wa_webhook_log,
 *        enfileira inbound em wa_inbound_queue (worker IA consome depois).
 *
 * Segurança:
 *   - GET valida hub.verify_token contra WA_VERIFY_TOKEN (env) ou contra o
 *     verify_token do canal correspondente.
 *   - POST valida X-Hub-Signature-256 (HMAC SHA256 do body cru com app_secret).
 *
 * Sempre responde 200 rápido — processamento pesado fica nas filas.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-hub-signature-256',
};

function text(body: string, status = 200) {
  return new Response(body, { status, headers: corsHeaders });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function verifySignature(rawBody: string, signature: string | null, appSecret: string) {
  if (!signature || !signature.startsWith('sha256=')) return false;
  const expected = signature.slice('sha256='.length);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return timingSafeEqual(hex, expected);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL/SERVICE_ROLE_KEY ausentes');
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`supabase ${response.status}: ${body}`);
  }
  return response;
}

type Channel = {
  id: string;
  city_id: string;
  kind: 'transactional' | 'assistant';
  phone_number_id: string;
  webhook_verify_token: string;
};

async function findChannelByPhoneId(phoneNumberId: string): Promise<Channel | null> {
  const response = await supabaseFetch(
    `/rest/v1/wa_channels?phone_number_id=eq.${encodeURIComponent(phoneNumberId)}&select=id,city_id,kind,phone_number_id,webhook_verify_token&limit=1`,
  );
  const rows = (await response.json()) as Channel[];
  return rows[0] ?? null;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // ── GET: handshake ───────────────────────────────────────────────────────
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const tokenIn = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const envToken = Deno.env.get('WA_VERIFY_TOKEN');

    if (mode === 'subscribe' && tokenIn && challenge && envToken && tokenIn === envToken) {
      return text(challenge);
    }
    return text('forbidden', 403);
  }

  if (request.method !== 'POST') return text('method_not_allowed', 405);

  const rawBody = await request.text();
  const appSecret = Deno.env.get('META_WA_APP_SECRET');
  const signatureOk = appSecret
    ? await verifySignature(rawBody, request.headers.get('x-hub-signature-256'), appSecret)
    : false;

  // Log cru independentemente da assinatura — debug é mais importante que limpeza
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    await logRaw(rawBody, signatureOk, 'invalid_json');
    return text('ok'); // sempre 200 pra Meta não reenviar
  }

  await logRaw(parsed, signatureOk);

  if (!signatureOk && appSecret) {
    // assinatura inválida — não processa, mas responde 200 pra Meta não floodar
    return text('ok');
  }

  try {
    await processPayload(parsed as WaPayload);
  } catch (err) {
    console.error('wa-webhook process error', err);
    // Não retornar 5xx — Meta vai reenviar e duplicar.
  }
  return text('ok');
});

type WaPayload = {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ wa_id: string; profile?: { name?: string } }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          [k: string]: unknown;
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          errors?: Array<{ code: number; title: string; message?: string }>;
        }>;
      };
    }>;
  }>;
};

async function processPayload(payload: WaPayload) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue;
      const v = change.value;
      const phoneId = v.metadata.phone_number_id;
      const channel = await findChannelByPhoneId(phoneId);
      if (!channel) {
        console.warn('wa-webhook: unknown phone_number_id', phoneId);
        continue;
      }

      for (const msg of v.messages ?? []) {
        await ingestInbound(channel, v.metadata.display_phone_number, msg);
      }
      for (const status of v.statuses ?? []) {
        await applyStatus(status);
      }
    }
  }
}

async function ingestInbound(
  channel: Channel,
  toNumber: string,
  msg: WaPayload['entry'][0]['changes'][0]['value']['messages'] extends Array<infer T> ? T : never,
) {
  const textBody =
    (msg as { text?: { body: string } }).text?.body ??
    ((msg as { interactive?: { button_reply?: { title: string }; list_reply?: { title: string } } })
      .interactive?.button_reply?.title ??
      (msg as { interactive?: { list_reply?: { title: string } } }).interactive?.list_reply?.title) ??
    null;

  const insertResponse = await supabaseFetch('/rest/v1/wa_messages', {
    method: 'POST',
    body: JSON.stringify({
      channel_id: channel.id,
      direction: 'in',
      kind: mapKind(msg.type),
      status: 'received',
      wamid: msg.id,
      from_number: msg.from,
      to_number: toNumber.replace(/\D/g, ''),
      text_body: textBody,
      payload: msg,
    }),
  });
  const inserted = (await insertResponse.json()) as Array<{ id: string }>;
  const messageId = inserted[0]?.id;
  if (!messageId) return;

  // Toca a sessão de 24h via RPC
  await supabaseFetch('/rest/v1/rpc/wa_touch_session', {
    method: 'POST',
    body: JSON.stringify({
      p_channel_id: channel.id,
      p_contact: msg.from,
      p_message_id: messageId,
    }),
  });

  // Roteia para a fila correta:
  //   - canal assistant   → worker IA  (consumer 'assistant')
  //   - canal transacional → bot delivery (consumer 'delivery_bot')
  // O bot decide se o remetente é um operador de loja conhecido.
  const consumer = channel.kind === 'assistant' ? 'assistant' : 'delivery_bot';
  await supabaseFetch('/rest/v1/wa_inbound_queue', {
    method: 'POST',
    body: JSON.stringify({
      message_id: messageId,
      channel_id: channel.id,
      consumer,
      status: 'pending',
    }),
  }).catch(() => {
    /* unique(message_id) — idempotente */
  });
}

async function applyStatus(
  status: WaPayload['entry'][0]['changes'][0]['value']['statuses'] extends Array<infer T> ? T : never,
) {
  const tsField =
    status.status === 'delivered'
      ? 'delivered_at'
      : status.status === 'read'
        ? 'read_at'
        : status.status === 'sent'
          ? 'sent_at'
          : null;

  const patch: Record<string, unknown> = { status: status.status };
  if (tsField) patch[tsField] = new Date(Number(status.timestamp) * 1000).toISOString();
  if (status.status === 'failed' && status.errors?.[0]) {
    patch.error_code = String(status.errors[0].code);
    patch.error_message = status.errors[0].message ?? status.errors[0].title;
  }

  await supabaseFetch(`/rest/v1/wa_messages?wamid=eq.${encodeURIComponent(status.id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

function mapKind(type: string): string {
  if (['text', 'interactive', 'location', 'contacts', 'reaction'].includes(type)) return type === 'reaction' ? 'reaction' : type === 'location' ? 'location' : type === 'contacts' ? 'contacts' : type;
  if (['image', 'audio', 'video', 'document', 'sticker'].includes(type)) return 'media';
  return 'system';
}

async function logRaw(payload: unknown, signatureOk: boolean, error?: string) {
  try {
    await supabaseFetch('/rest/v1/wa_webhook_log', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ payload, signature_ok: signatureOk, error: error ?? null }),
    });
  } catch (err) {
    console.error('wa-webhook log error', err);
  }
}

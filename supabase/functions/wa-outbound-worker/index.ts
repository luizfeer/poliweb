/**
 * Worker da fila outbound.
 *
 * Disparo: cron Supabase (configurar `* * * * *` — a cada minuto) chamando esta função
 *          com header Authorization: Bearer <SERVICE_ROLE_KEY>.
 *
 * Por execução:
 *   1. pega até BATCH_SIZE itens pending com scheduled_for <= now()
 *   2. marca como processing (lock otimista via UPDATE...WHERE status='pending')
 *   3. resolve canal + token + tenta enviar via Graph API
 *   4. cria wa_messages com status='sent' (ou 'failed') e linka via message_id
 *
 * Rate limit Meta: 80 req/s por número (Tier 1) — BATCH_SIZE 25 é seguro.
 */

const GRAPH_BASE = 'https://graph.facebook.com/v22.0';
const BATCH_SIZE = 25;
const MAX_ATTEMPTS = 5;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function sb(path: string, init: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`supabase ${response.status}: ${await response.text()}`);
  }
  return response;
}

type QueueRow = {
  id: string;
  channel_id: string;
  to_number: string;
  kind: string;
  template_name: string | null;
  template_language: string | null;
  template_variables: Record<string, string> | null;
  text_body: string | null;
  interactive: Record<string, unknown> | null;
  attempts: number;
};

type Channel = {
  id: string;
  phone_number_id: string;
  meta_secret_ref: string | null;
  enabled: boolean;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Aceita chamada vinda do cron (com service key) ou de admin autenticado
  const auth = request.headers.get('authorization') ?? '';
  if (!auth.includes(SERVICE_KEY) && !auth.includes(Deno.env.get('WA_WORKER_TOKEN') ?? '__none__')) {
    return json({ error: 'unauthorized' }, 401);
  }

  const stats = { picked: 0, sent: 0, failed: 0, retried: 0 };

  // Pega lote
  const picked = await pickBatch();
  stats.picked = picked.length;

  for (const row of picked) {
    try {
      const channel = await getChannel(row.channel_id);
      if (!channel?.enabled) {
        await markFailed(row.id, 'channel_disabled');
        stats.failed++;
        continue;
      }
      const token = resolveToken(channel.meta_secret_ref);
      if (!token) {
        await markFailed(row.id, 'token_missing');
        stats.failed++;
        continue;
      }

      const result = await sendOne(channel, token, row);
      await markDone(row, result, channel);
      stats.sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const willRetry = row.attempts + 1 < MAX_ATTEMPTS;
      if (willRetry) {
        await scheduleRetry(row, message);
        stats.retried++;
      } else {
        await markFailed(row.id, message);
        stats.failed++;
      }
    }
  }

  return json(stats);
});

async function pickBatch(): Promise<QueueRow[]> {
  const response = await sb(
    `/rest/v1/wa_outbound_queue?status=eq.pending&scheduled_for=lte.${encodeURIComponent(new Date().toISOString())}&order=created_at.asc&limit=${BATCH_SIZE}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ status: 'processing', picked_at: new Date().toISOString() }),
    },
  );
  return (await response.json()) as QueueRow[];
}

async function getChannel(id: string): Promise<Channel | null> {
  const response = await sb(
    `/rest/v1/wa_channels?id=eq.${id}&select=id,phone_number_id,meta_secret_ref,enabled&limit=1`,
  );
  const rows = (await response.json()) as Channel[];
  return rows[0] ?? null;
}

function resolveToken(ref: string | null): string | undefined {
  if (ref) {
    const v = Deno.env.get(ref);
    if (v) return v;
  }
  return Deno.env.get('META_WA_ACCESS_TOKEN');
}

async function sendOne(channel: Channel, token: string, row: QueueRow) {
  let body: Record<string, unknown>;

  if (row.kind === 'template') {
    if (!row.template_name) throw new Error('template_name missing');
    const components: unknown[] = [];
    if (row.template_variables && Object.keys(row.template_variables).length > 0) {
      const parameters = Object.keys(row.template_variables)
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => ({ type: 'text', text: row.template_variables![k] }));
      components.push({ type: 'body', parameters });
    }
    body = {
      messaging_product: 'whatsapp',
      to: row.to_number,
      type: 'template',
      template: {
        name: row.template_name,
        language: { code: row.template_language ?? 'pt_BR' },
        ...(components.length > 0 ? { components } : {}),
      },
    };
  } else if (row.kind === 'text') {
    if (!row.text_body) throw new Error('text_body missing');
    body = {
      messaging_product: 'whatsapp',
      to: row.to_number,
      type: 'text',
      text: { body: row.text_body, preview_url: false },
    };
  } else if (row.kind === 'interactive') {
    // Mensagem com botões de resposta (ex: novo pedido → Aceitar/Recusar).
    // Só entregue dentro da janela de 24h; fora dela use template.
    if (!row.interactive) throw new Error('interactive payload missing');
    body = {
      messaging_product: 'whatsapp',
      to: row.to_number,
      type: 'interactive',
      interactive: row.interactive,
    };
  } else {
    throw new Error(`unsupported kind: ${row.kind}`);
  }

  const response = await fetch(`${GRAPH_BASE}/${channel.phone_number_id}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as
    | { messages: Array<{ id: string }> }
    | { error: { message: string; code: number } };
  if (!response.ok || 'error' in result) {
    const err = 'error' in result ? result.error : { message: 'unknown', code: response.status };
    throw new Error(`meta ${err.code}: ${err.message}`);
  }
  return { wamid: result.messages[0]?.id, payload: body };
}

async function markDone(
  row: QueueRow,
  result: { wamid?: string; payload: Record<string, unknown> },
  channel: Channel,
) {
  // 1. Cria wa_messages
  const insertResponse = await sb('/rest/v1/wa_messages', {
    method: 'POST',
    body: JSON.stringify({
      channel_id: channel.id,
      direction: 'out',
      kind: row.kind,
      status: 'sent',
      wamid: result.wamid ?? null,
      from_number: channel.phone_number_id,
      to_number: row.to_number,
      template_name: row.template_name,
      template_language: row.template_language,
      template_variables: row.template_variables,
      text_body: row.text_body,
      payload: result.payload,
      sent_at: new Date().toISOString(),
    }),
  });
  const [msg] = (await insertResponse.json()) as Array<{ id: string }>;

  // 2. Atualiza fila
  await sb(`/rest/v1/wa_outbound_queue?id=eq.${row.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'done',
      processed_at: new Date().toISOString(),
      message_id: msg?.id ?? null,
      attempts: row.attempts + 1,
    }),
  });
}

async function markFailed(id: string, error: string) {
  await sb(`/rest/v1/wa_outbound_queue?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'failed',
      processed_at: new Date().toISOString(),
      error,
    }),
  });
}

async function scheduleRetry(row: QueueRow, error: string) {
  const backoffMin = Math.pow(2, row.attempts); // 1, 2, 4, 8, 16
  const next = new Date(Date.now() + backoffMin * 60_000).toISOString();
  await sb(`/rest/v1/wa_outbound_queue?id=eq.${row.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'pending',
      attempts: row.attempts + 1,
      scheduled_for: next,
      error,
    }),
  });
}

/**
 * Bot de delivery no WhatsApp (lado do comerciante).
 *
 * Disparo: cron Supabase (`* * * * *` — a cada minuto) com Authorization: Bearer <SERVICE_ROLE_KEY>.
 *
 * Por execução:
 *   1. pega até BATCH_SIZE itens pending em wa_inbound_queue (consumer='delivery_bot')
 *   2. marca processing (lock otimista)
 *   3. carrega a wa_messages → resolve operador por from_number
 *   4. interpreta comando de texto OU botão interativo
 *   5. executa (online/offline, listar, mudar status) e responde via wa_outbound_queue
 *
 * Tudo assíncrono: nada é enviado direto pra Meta aqui — só enfileira a resposta,
 * que o wa-outbound-worker drena. Janela de 24h: como o operador acabou de mandar
 * mensagem, a janela está aberta → resposta como `text` funciona.
 */

const BATCH_SIZE = 25;
const AUTO_OFFLINE_HOURS = 6;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

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
  if (!response.ok) throw new Error(`supabase ${response.status}: ${await response.text()}`);
  return response;
}

type InboundRow = { id: string; message_id: string; channel_id: string; attempts: number };
type Message = {
  id: string;
  channel_id: string;
  from_number: string;
  text_body: string | null;
  payload: Record<string, unknown> | null;
};
type Operator = { business_id: string; role: string };

const OPEN_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'dispatched'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'aguardando', confirmed: 'aceito', preparing: 'em preparo', ready: 'pronto',
  dispatched: 'a caminho', delivered: 'entregue', cancelled: 'cancelado', rejected: 'recusado',
};
const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'dispatched', dispatched: 'delivered',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = request.headers.get('authorization') ?? '';
  if (!auth.includes(SERVICE_KEY)) return json({ error: 'unauthorized' }, 401);

  const stats = { picked: 0, handled: 0, ignored: 0, failed: 0 };
  const picked = await pickBatch();
  stats.picked = picked.length;

  for (const row of picked) {
    try {
      const handled = await handleInbound(row);
      if (handled) stats.handled++;
      else stats.ignored++;
      await markDone(row.id);
    } catch (err) {
      stats.failed++;
      await markFailed(row.id, err instanceof Error ? err.message : String(err));
    }
  }
  return json(stats);
});

async function pickBatch(): Promise<InboundRow[]> {
  const response = await sb(
    `/rest/v1/wa_inbound_queue?status=eq.pending&consumer=eq.delivery_bot&order=created_at.asc&limit=${BATCH_SIZE}`,
    { method: 'PATCH', body: JSON.stringify({ status: 'processing', picked_at: new Date().toISOString() }) },
  );
  return (await response.json()) as InboundRow[];
}

async function handleInbound(row: InboundRow): Promise<boolean> {
  const msg = await getMessage(row.message_id);
  if (!msg) return false;

  const operators = await findOperators(msg.from_number);
  if (operators.length === 0) return false; // não é operador conhecido → ignora
  const businessId = operators[0].business_id; // TODO: desambiguar multi-negócio

  const parsed = parseInput(msg);
  if (!parsed) {
    await reply(msg, '🤖 Não entendi. Digite */ajuda* para ver os comandos.');
    return true;
  }

  switch (parsed.action) {
    case 'help':
      await reply(msg, helpText());
      break;
    case 'open':
      await setOnline(businessId, true);
      await reply(msg, '✅ Sua loja está *ONLINE*. Os clientes já podem fazer pedidos.\n_Fecha sozinho em ' + AUTO_OFFLINE_HOURS + 'h ou com_ */fechar*.');
      break;
    case 'close':
      await setOnline(businessId, false);
      await reply(msg, '🔴 Sua loja está *OFFLINE*. Você não receberá novos pedidos.');
      break;
    case 'list':
      await reply(msg, await listOrders(businessId));
      break;
    case 'accept':
      await changeOrder(msg, businessId, parsed.arg, 'confirmed');
      break;
    case 'reject':
      await changeOrder(msg, businessId, parsed.arg, 'rejected');
      break;
    case 'ready':
      await changeOrder(msg, businessId, parsed.arg, 'ready');
      break;
    case 'dispatch':
      await changeOrder(msg, businessId, parsed.arg, 'dispatched');
      break;
    case 'delivered':
      await changeOrder(msg, businessId, parsed.arg, 'delivered');
      break;
    case 'next':
      await advanceOrder(msg, parsed.arg);
      break;
  }
  return true;
}

// ── Parsing ──────────────────────────────────────────────────────────────────

type ParsedInput = { action: string; arg: string };

function parseInput(msg: Message): ParsedInput | null {
  // Botão interativo? payload.interactive.button_reply.id = "ord_accept:<uuid>"
  const buttonId = extractButtonId(msg.payload);
  if (buttonId) {
    const [kind, id] = buttonId.split(':');
    if (kind === 'ord_accept') return { action: 'accept', arg: id };
    if (kind === 'ord_reject') return { action: 'reject', arg: id };
    if (kind === 'ord_next') return { action: 'next', arg: id };
    if (kind === 'menu' && id === 'list') return { action: 'list', arg: '' };
  }

  const text = (msg.text_body ?? '').trim().toLowerCase();
  if (!text.startsWith('/')) return null;
  const [cmd, ...rest] = text.slice(1).split(/\s+/);
  const arg = rest.join(' ').replace(/^#/, '');
  const map: Record<string, string> = {
    ajuda: 'help', help: 'help', abrir: 'open', online: 'open', fechar: 'close', offline: 'close',
    lista: 'list', pedidos: 'list', aceitar: 'accept', recusar: 'reject', pronto: 'ready',
    saiu: 'dispatch', entregue: 'delivered',
  };
  const action = map[cmd];
  return action ? { action, arg } : null;
}

function extractButtonId(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  const interactive = payload.interactive as { button_reply?: { id?: string } } | undefined;
  return interactive?.button_reply?.id ?? null;
}

// ── Ações ────────────────────────────────────────────────────────────────────

async function setOnline(businessId: string, online: boolean) {
  const body = {
    business_id: businessId,
    is_online: online,
    online_since: online ? new Date().toISOString() : null,
    auto_offline_at: online ? new Date(Date.now() + AUTO_OFFLINE_HOURS * 3600_000).toISOString() : null,
    source: 'whatsapp',
  };
  await sb('/rest/v1/business_delivery_status?on_conflict=business_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(body),
  });
}

async function listOrders(businessId: string): Promise<string> {
  const response = await sb(
    `/rest/v1/orders?business_id=eq.${businessId}&status=in.(${OPEN_STATUSES.join(',')})` +
      `&order=created_at.asc&select=code,status,total,order_type,created_at,customer_name`,
  );
  const orders = (await response.json()) as Array<{
    code: string; status: string; total: number; order_type: string; created_at: string; customer_name: string | null;
  }>;
  if (orders.length === 0) return '📋 Nenhum pedido aberto no momento.';
  const lines = ['📋 *Pedidos abertos*', ''];
  for (const o of orders) {
    const mins = Math.round((Date.now() - new Date(o.created_at).getTime()) / 60000);
    const type = o.order_type === 'delivery' ? '🛵' : o.order_type === 'pickup' ? '📦' : '🍽️';
    lines.push(`#${o.code} ${type} ${STATUS_LABELS[o.status] ?? o.status} • há ${mins}min • ${brl(o.total)}`);
  }
  lines.push('', '_Use_ */pronto <nº>* _,_ */saiu <nº>* _, etc._');
  return lines.join('\n');
}

async function changeOrder(msg: Message, businessId: string, arg: string, status: string) {
  const order = await resolveOrder(businessId, arg);
  if (!order) {
    await reply(msg, `❓ Pedido #${arg} não encontrado.`);
    return;
  }
  await setStatus(order.id, status);
  await reply(msg, `✔️ Pedido #${order.code} → *${STATUS_LABELS[status] ?? status}*.`);
}

async function advanceOrder(msg: Message, orderId: string) {
  const response = await sb(`/rest/v1/orders?id=eq.${orderId}&select=id,code,status&limit=1`);
  const [order] = (await response.json()) as Array<{ id: string; code: string; status: string }>;
  if (!order) {
    await reply(msg, '❓ Pedido não encontrado.');
    return;
  }
  const next = NEXT_STATUS[order.status];
  if (!next) {
    await reply(msg, `Pedido #${order.code} já está *${STATUS_LABELS[order.status] ?? order.status}*.`);
    return;
  }
  await setStatus(order.id, next);
  await reply(msg, `✔️ Pedido #${order.code} → *${STATUS_LABELS[next] ?? next}*.`);
}

async function setStatus(orderId: string, status: string) {
  await sb('/rest/v1/rpc/update_order_status', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ p_order_id: orderId, p_status: status, p_note: null, p_actor: null }),
  });
}

// ── Queries auxiliares ───────────────────────────────────────────────────────

async function resolveOrder(businessId: string, arg: string): Promise<{ id: string; code: string } | null> {
  const code = arg.replace(/[^0-9]/g, '');
  if (!code) return null;
  const response = await sb(
    `/rest/v1/orders?business_id=eq.${businessId}&code=eq.${code}&order=created_at.desc&select=id,code&limit=1`,
  );
  const [order] = (await response.json()) as Array<{ id: string; code: string }>;
  return order ?? null;
}

async function getMessage(id: string): Promise<Message | null> {
  const response = await sb(
    `/rest/v1/wa_messages?id=eq.${id}&select=id,channel_id,from_number,text_body,payload&limit=1`,
  );
  const [msg] = (await response.json()) as Message[];
  return msg ?? null;
}

async function findOperators(phone: string): Promise<Operator[]> {
  const num = phone.replace(/\D/g, '');
  const response = await sb(
    `/rest/v1/business_wa_operators?phone_number=eq.${num}&active=is.true&verified_at=not.is.null&select=business_id,role`,
  );
  return (await response.json()) as Operator[];
}

async function reply(msg: Message, text: string) {
  await sb('/rest/v1/wa_outbound_queue', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      channel_id: msg.channel_id,
      to_number: msg.from_number.replace(/\D/g, ''),
      kind: 'text',
      text_body: text,
      status: 'pending',
    }),
  });
}

async function markDone(id: string) {
  await sb(`/rest/v1/wa_inbound_queue?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'done', processed_at: new Date().toISOString() }),
  });
}

async function markFailed(id: string, error: string) {
  await sb(`/rest/v1/wa_inbound_queue?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'failed', processed_at: new Date().toISOString(), error }),
  });
}

function helpText(): string {
  return [
    '🤖 *Comandos do seu delivery*',
    '',
    '*/abrir* — ficar online e receber pedidos',
    '*/fechar* — ficar offline',
    '*/lista* — ver pedidos abertos',
    '*/aceitar <nº>* — aceitar um pedido',
    '*/recusar <nº>* — recusar',
    '*/pronto <nº>* — marcar como pronto',
    '*/saiu <nº>* — saiu para entrega',
    '*/entregue <nº>* — finalizar',
    '',
    '_Você também pode usar os botões que chegam em cada pedido._',
  ].join('\n');
}

function brl(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

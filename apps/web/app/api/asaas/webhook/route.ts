import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/supabase/database.types';
import type { BusinessLeadStatus } from '@/lib/business-leads/types';
import { recordAsaasWebhookPayment } from '@/lib/payments/ledger';

const FEATURE_PAID_EVENTS = new Set([
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED_IN_CASH',
]);
const FEATURE_FAILED_EVENTS = new Set([
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'PAYMENT_REFUNDED',
  'PAYMENT_REFUND_DENIED',
  'PAYMENT_CHARGEBACK_REQUESTED',
]);

type FeatureOrderRow = {
  id: string;
  city_id: string;
  status: string;
  target_type: 'classified' | 'community_group';
  target_id: string;
  duration_days: number;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AsaasPayment = {
  id?: string;
  subscription?: string | null;
  customer?: string | null;
  externalReference?: string | null;
  status?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  value?: number | null;
  netValue?: number | null;
  dueDate?: string | null;
  paymentDate?: string | null;
  billingType?: string | null;
  description?: string | null;
};

type AsaasSubscriptionPayload = {
  id?: string;
  customer?: string | null;
  status?: string | null;
  nextDueDate?: string | null;
  externalReference?: string | null;
};

type AsaasEvent = {
  id?: string;
  event?: string;
  dateCreated?: string;
  payment?: AsaasPayment;
  subscription?: AsaasSubscriptionPayload;
};

type ExtendedTables = Database['public']['Tables'] & {
  business_leads: {
    Row: Record<string, unknown>;
    Insert: Record<string, unknown>;
    Update: Record<string, unknown>;
    Relationships: [];
  };
  asaas_webhook_events: {
    Row: Record<string, unknown>;
    Insert: Record<string, unknown>;
    Update: Record<string, unknown>;
    Relationships: [];
  };
};

type ExtendedDb = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & { Tables: ExtendedTables };
};

function asExtended(client: SupabaseClient<Database>): SupabaseClient<ExtendedDb> {
  return client as unknown as SupabaseClient<ExtendedDb>;
}

const STATUS_TO_LEAD_STATUS: Record<string, BusinessLeadStatus> = {
  CONFIRMED: 'converted',
  RECEIVED: 'converted',
  RECEIVED_IN_CASH: 'converted',
  PAYMENT_CONFIRMED: 'converted',
  PAYMENT_RECEIVED: 'converted',
};

function bodyToken(req: Request): string | null {
  return req.headers.get('asaas-access-token') ?? req.headers.get('x-asaas-token') ?? null;
}

export async function POST(req: Request) {
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      { error: 'ASAAS_WEBHOOK_TOKEN not configured.' },
      { status: 503 },
    );
  }

  const providedToken = bodyToken(req);
  if (providedToken !== expectedToken) {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
  }

  let event: AsaasEvent;
  try {
    event = (await req.json()) as AsaasEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const supabase = asExtended(createServiceRoleClient());

  const payment = event.payment;
  const subscription = event.subscription;
  const subscriptionId = payment?.subscription ?? subscription?.id ?? null;
  const customerId = payment?.customer ?? subscription?.customer ?? null;

  const { data: webhookLog, error: logError } = await supabase
    .from('asaas_webhook_events')
    .insert({
      event_type: event.event ?? 'UNKNOWN',
      event_id: event.id ?? null,
      payment_id: payment?.id ?? null,
      subscription_id: subscriptionId,
      customer_id: customerId,
      payload: event as unknown as Json,
      processed: false,
    })
    .select('id')
    .single();
  if (logError) {
    console.error('[asaas/webhook] failed to log event', logError);
  }

  try {
    const portalPaymentId = await recordAsaasWebhookPayment(
      event,
      typeof webhookLog?.id === 'string' ? webhookLog.id : null,
    );
    await applyEvent(supabase, event, subscriptionId, customerId);
    await applyFeatureOrderEvent(supabase, event);
    await applyDeliveryProEvent(supabase, event);
    await applyPublicationPaymentEvent(supabase, event);
    if (typeof webhookLog?.id === 'string') {
      await supabase
        .from('asaas_webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString(), portal_payment_id: portalPaymentId })
        .eq('id', webhookLog.id);
    } else if (event.id) {
      await supabase
        .from('asaas_webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString(), portal_payment_id: portalPaymentId })
        .eq('event_id', event.id);
    }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'unknown error';
    console.error('[asaas/webhook] processing failed', caught);
    if (event.id) {
      await supabase
        .from('asaas_webhook_events')
        .update({ error_message: message })
        .eq('event_id', event.id);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function applyPublicationPaymentEvent(
  supabase: SupabaseClient<ExtendedDb>,
  event: AsaasEvent,
) {
  const payment = event.payment;
  const paymentId = payment?.id;
  const eventType = event.event ?? '';
  const reference = payment?.externalReference ?? '';
  if (!paymentId || !reference.startsWith('publication:')) return;
  if (!FEATURE_PAID_EVENTS.has(eventType) && !FEATURE_FAILED_EVENTS.has(eventType)) return;

  const [, entityType, entityId] = reference.split(':');
  if ((entityType !== 'classified' && entityType !== 'property') || !entityId) return;

  const isPaid = FEATURE_PAID_EVENTS.has(eventType);
  const table = entityType === 'classified' ? 'classifieds' : 'properties';
  const update = isPaid
    ? {
        payment_status: 'paid',
        payment_provider_ref: paymentId,
        status: 'pending',
        review_status: 'pending',
      }
    : {
        payment_status: 'pending',
        payment_provider_ref: paymentId,
      };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from(table as any) as any)
    .update(update)
    .eq('id', entityId);

  try {
    revalidatePath(entityType === 'classified' ? '/painel/cidadao/classificados' : '/painel/imobiliaria/imoveis');
  } catch {
    // revalidate fora de request context — ignora
  }
}

async function applyEvent(
  supabase: SupabaseClient<ExtendedDb>,
  event: AsaasEvent,
  subscriptionId: string | null,
  customerId: string | null,
) {
  if (!subscriptionId && !customerId) return;

  const update: Record<string, unknown> = {};
  const payment = event.payment;
  const subscription = event.subscription;

  if (event.event && event.event.startsWith('PAYMENT_')) {
    if (payment?.status) update.asaas_subscription_status = payment.status;
    if (payment?.invoiceUrl) update.asaas_payment_link = payment.invoiceUrl;
    if (payment?.dueDate) update.asaas_next_due_date = payment.dueDate;

    const mapped = payment?.status ? STATUS_TO_LEAD_STATUS[payment.status] : undefined;
    if (mapped) update.status = mapped;
  }

  if (event.event && event.event.startsWith('SUBSCRIPTION_')) {
    if (subscription?.status) update.asaas_subscription_status = subscription.status;
    if (subscription?.nextDueDate) update.asaas_next_due_date = subscription.nextDueDate;
    if (subscription?.status === 'INACTIVE' || subscription?.status === 'EXPIRED') {
      update.status = 'rejected';
      update.rejected_reason = `Assinatura ASAAS ${subscription.status}`;
    }
  }

  if (Object.keys(update).length === 0) return;

  let query = supabase.from('business_leads').update(update);
  if (subscriptionId) {
    query = query.eq('asaas_subscription_id', subscriptionId);
  } else if (customerId) {
    query = query.eq('asaas_customer_id', customerId);
  }
  const { error } = await query;
  if (error) throw error;
}

// Delivery Pro: assinatura recorrente. externalReference = 'delivery_pro:<businessId>'
// vem na subscription e é herdado pelos pagamentos. Pagamento confirmado liga o
// Pro e estende o período; overdue marca atraso; cancelamento volta para free.
async function applyDeliveryProEvent(supabase: SupabaseClient<ExtendedDb>, event: AsaasEvent) {
  const eventType = event.event ?? '';
  const ref = event.payment?.externalReference ?? event.subscription?.externalReference ?? '';
  if (!ref.startsWith('delivery_pro:')) return;
  const businessId = ref.slice('delivery_pro:'.length);
  if (!businessId) return;

  const subscriptionId = event.payment?.subscription ?? event.subscription?.id ?? null;

  const PAID = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED_IN_CASH']);
  const OVERDUE = new Set(['PAYMENT_OVERDUE']);
  const CANCEL = new Set([
    'PAYMENT_REFUNDED',
    'PAYMENT_DELETED',
    'PAYMENT_CHARGEBACK_REQUESTED',
    'SUBSCRIPTION_DELETED',
    'SUBSCRIPTION_INACTIVATED',
  ]);

  let status: 'paid' | 'overdue' | 'cancelled' | null = null;
  if (PAID.has(eventType)) status = 'paid';
  else if (OVERDUE.has(eventType)) status = 'overdue';
  else if (CANCEL.has(eventType)) status = 'cancelled';
  if (!status) return;

  // Próximo vencimento como fim de período pago (+1 ciclo de folga no SQL).
  const periodEnd =
    status === 'paid'
      ? (() => {
          const d = new Date();
          d.setUTCDate(d.getUTCDate() + 35);
          return d.toISOString();
        })()
      : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)('apply_delivery_pro_payment', {
    p_business_id: businessId,
    p_subscription_id: subscriptionId,
    p_status: status,
    p_period_end: periodEnd,
  });
}

async function applyFeatureOrderEvent(
  supabase: SupabaseClient<ExtendedDb>,
  event: AsaasEvent,
) {
  const paymentId = event.payment?.id;
  const eventType = event.event ?? '';
  if (!paymentId) return;
  if (!FEATURE_PAID_EVENTS.has(eventType) && !FEATURE_FAILED_EVENTS.has(eventType)) return;

  const { data: orderRow } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('feature_orders' as any)
    .select('id, city_id, status, target_type, target_id, duration_days')
    .eq('asaas_payment_id', paymentId)
    .maybeSingle();
  const order = (orderRow as FeatureOrderRow | null) ?? null;
  if (!order) return;

  if (FEATURE_PAID_EVENTS.has(eventType)) {
    if (order.status === 'paid') return;
    const grantedUntil = new Date();
    grantedUntil.setUTCDate(grantedUntil.getUTCDate() + order.duration_days);
    const grantedIso = grantedUntil.toISOString();

    await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('feature_orders' as any)
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        granted_until: grantedIso,
      })
      .eq('id', order.id);

    const table = order.target_type === 'classified' ? 'classifieds' : 'community_groups';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from(table as any) as any)
      .update({ featured_until: grantedIso })
      .eq('id', order.target_id)
      .eq('city_id', order.city_id);

    try {
      revalidateTag('community-groups', 'max');
      revalidatePath('/comunidade/classificados');
      revalidatePath('/comunidade/grupos');
    } catch {
      // revalidate fora de request context — ignora
    }
  } else {
    const newStatus =
      eventType === 'PAYMENT_REFUNDED'
        ? 'refunded'
        : eventType === 'PAYMENT_OVERDUE'
          ? 'expired'
          : 'failed';
    await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('feature_orders' as any)
      .update({ status: newStatus, failure_reason: eventType })
      .eq('id', order.id);
  }
}

import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/service';
import type { Json } from '@/lib/supabase/database.types';

export type PortalPaymentStatus = 'pending' | 'paid' | 'overdue' | 'failed' | 'cancelled' | 'refunded';
export type PortalPaymentSource = 'business_subscription' | 'feature_order' | 'publication' | 'manual' | 'unknown';

type PaymentLookup = {
  id: string;
  city_id: string | null;
  profile_id: string | null;
};

type FeatureOrderLookup = {
  id: string;
  city_id: string;
  profile_id: string;
  target_type: string;
  target_id: string;
  duration_days: number;
};

type ClassifiedLookup = {
  id: string;
  city_id: string;
  author_profile_id: string;
  title: string;
  payment_amount_cents: number | null;
};

type PropertyLookup = {
  id: string;
  city_id: string;
  owner_profile_id: string | null;
  title: string;
  payment_amount_cents: number | null;
};

type BusinessLeadLookup = {
  id: string;
  city_id: string;
  profile_id: string;
  business_name: string;
};

type LooseDbResult = {
  data: unknown;
  error: { message: string } | null;
};

type LooseQuery = {
  select(columns?: string): LooseQuery;
  insert(payload: unknown): LooseQuery;
  update(payload: unknown): LooseQuery;
  eq(column: string, value: unknown): LooseQuery;
  maybeSingle(): Promise<LooseDbResult>;
  single(): Promise<LooseDbResult>;
};

type LooseClient = {
  from(table: string): LooseQuery;
};

function createLedgerClient(): LooseClient {
  return createServiceRoleClient() as unknown as LooseClient;
}

export type RecordPortalPaymentInput = {
  cityId?: string | null;
  profileId?: string | null;
  providerPaymentId?: string | null;
  providerSubscriptionId?: string | null;
  providerCustomerId?: string | null;
  sourceType: PortalPaymentSource;
  sourceId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  amountCents: number;
  netAmountCents?: number | null;
  status: PortalPaymentStatus;
  billingType?: string | null;
  invoiceUrl?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  externalReference?: string | null;
  asaasRaw?: Json;
  metadata?: Json;
};

export type RecordPortalPaymentEventInput = {
  paymentId?: string | null;
  asaasWebhookEventId?: string | null;
  providerEventId?: string | null;
  eventType: string;
  providerStatus?: string | null;
  message?: string | null;
  payload?: Json;
};

function normalizeAmountCents(value: number | null | undefined): number {
  if (!Number.isFinite(value ?? 0)) return 0;
  return Math.max(0, Math.round((value ?? 0) * 100));
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

function normalizePaidAt(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.includes('T') ? value : `${value}T00:00:00.000Z`;
}

export function mapAsaasPaymentStatus(eventType: string, paymentStatus?: string | null): PortalPaymentStatus {
  if (eventType === 'PAYMENT_REFUNDED') return 'refunded';
  if (eventType === 'PAYMENT_OVERDUE') return 'overdue';
  if (eventType === 'PAYMENT_DELETED') return 'cancelled';
  if (eventType === 'PAYMENT_CHARGEBACK_REQUESTED' || eventType === 'PAYMENT_REFUND_DENIED') return 'failed';
  if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED_IN_CASH') {
    return 'paid';
  }

  if (paymentStatus === 'RECEIVED' || paymentStatus === 'CONFIRMED' || paymentStatus === 'RECEIVED_IN_CASH') return 'paid';
  if (paymentStatus === 'OVERDUE') return 'overdue';
  if (paymentStatus === 'REFUNDED') return 'refunded';
  if (paymentStatus === 'DELETED' || paymentStatus === 'CANCELLED') return 'cancelled';
  return 'pending';
}

export async function recordPortalPayment(input: RecordPortalPaymentInput): Promise<string | null> {
  const service = createLedgerClient();
  const existing = input.providerPaymentId
    ? await findPortalPaymentByProviderId(input.providerPaymentId)
    : null;
  const payload = {
    city_id: input.cityId ?? null,
    profile_id: input.profileId ?? null,
    provider: 'asaas',
    provider_payment_id: input.providerPaymentId ?? null,
    provider_subscription_id: input.providerSubscriptionId ?? null,
    provider_customer_id: input.providerCustomerId ?? null,
    source_type: input.sourceType,
    source_id: input.sourceId ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    description: input.description ?? null,
    amount_cents: input.amountCents,
    net_amount_cents: input.netAmountCents ?? null,
    status: input.status,
    billing_type: input.billingType ?? null,
    invoice_url: input.invoiceUrl ?? null,
    due_date: normalizeDate(input.dueDate),
    paid_at: normalizePaidAt(input.paidAt),
    external_reference: input.externalReference ?? null,
    asaas_raw: input.asaasRaw ?? {},
    metadata: input.metadata ?? {},
  };

  if (existing) {
    const { data, error } = await service
      .from('portal_payments')
      .update(payload)
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error) throw error;
    return (data as PaymentLookup | null)?.id ?? existing.id;
  }

  const { data, error } = await service
    .from('portal_payments')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw error;
  return (data as PaymentLookup | null)?.id ?? null;
}

export async function recordPortalPaymentEvent(input: RecordPortalPaymentEventInput): Promise<void> {
  const service = createLedgerClient();
  const { error } = await service
    .from('portal_payment_events')
    .insert({
      payment_id: input.paymentId ?? null,
      asaas_webhook_event_id: input.asaasWebhookEventId ?? null,
      provider: 'asaas',
      provider_event_id: input.providerEventId ?? null,
      event_type: input.eventType,
      provider_status: input.providerStatus ?? null,
      message: input.message ?? null,
      payload: input.payload ?? {},
    })
    .select('id')
    .single();
  if (error) throw error;
}

export async function recordAsaasWebhookPayment(
  event: {
    id?: string;
    event?: string;
    payment?: {
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
  },
  asaasWebhookEventId?: string | null,
): Promise<string | null> {
  const payment = event.payment;
  if (!payment?.id) return null;

  const context = await resolvePaymentContext({
    paymentId: payment.id,
    subscriptionId: payment.subscription ?? null,
    customerId: payment.customer ?? null,
    externalReference: payment.externalReference ?? null,
  });
  const status = mapAsaasPaymentStatus(event.event ?? 'PAYMENT_EVENT', payment.status);
  const paymentId = await recordPortalPayment({
    cityId: context.cityId,
    profileId: context.profileId,
    providerPaymentId: payment.id,
    providerSubscriptionId: payment.subscription ?? context.providerSubscriptionId,
    providerCustomerId: payment.customer ?? context.providerCustomerId,
    sourceType: context.sourceType,
    sourceId: context.sourceId,
    entityType: context.entityType,
    entityId: context.entityId,
    description: payment.description ?? context.description,
    amountCents: normalizeAmountCents(payment.value),
    netAmountCents: payment.netValue == null ? null : normalizeAmountCents(payment.netValue),
    status,
    billingType: payment.billingType ?? null,
    invoiceUrl: payment.invoiceUrl ?? payment.bankSlipUrl ?? null,
    dueDate: payment.dueDate ?? null,
    paidAt: payment.paymentDate ?? null,
    externalReference: payment.externalReference ?? null,
    asaasRaw: event as Json,
    metadata: context.metadata,
  });

  if (paymentId) {
    await recordPortalPaymentEvent({
      paymentId,
      asaasWebhookEventId,
      providerEventId: event.id ?? null,
      eventType: event.event ?? 'PAYMENT_EVENT',
      providerStatus: payment.status ?? null,
      payload: event as Json,
    });
  }

  return paymentId;
}

async function findPortalPaymentByProviderId(providerPaymentId: string): Promise<PaymentLookup | null> {
  const service = createLedgerClient();
  const { data, error } = await service
    .from('portal_payments')
    .select('id, city_id, profile_id')
    .eq('provider', 'asaas')
    .eq('provider_payment_id', providerPaymentId)
    .maybeSingle();
  if (error) throw error;
  return (data as PaymentLookup | null) ?? null;
}

async function resolvePaymentContext(input: {
  paymentId: string;
  subscriptionId: string | null;
  customerId: string | null;
  externalReference: string | null;
}): Promise<{
  cityId: string | null;
  profileId: string | null;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  sourceType: PortalPaymentSource;
  sourceId: string | null;
  entityType: string | null;
  entityId: string | null;
  description: string | null;
  metadata: Json;
}> {
  const service = createLedgerClient();
  const reference = input.externalReference ?? '';

  if (reference.startsWith('feature_order:')) {
    const orderId = reference.replace('feature_order:', '');
    const { data } = await service
      .from('feature_orders')
      .select('id, city_id, profile_id, target_type, target_id, duration_days')
      .eq('id', orderId)
      .maybeSingle();
    const order = (data as FeatureOrderLookup | null) ?? null;
    if (order) {
      return {
        cityId: order.city_id,
        profileId: order.profile_id,
        providerSubscriptionId: input.subscriptionId,
        providerCustomerId: input.customerId,
        sourceType: 'feature_order',
        sourceId: order.id,
        entityType: order.target_type,
        entityId: order.target_id,
        description: 'Destaque pago',
        metadata: { duration_days: order.duration_days },
      };
    }
  }

  if (reference.startsWith('publication:')) {
    const [, entityType, entityId] = reference.split(':');
    if (entityType === 'classified' && entityId) {
      const { data } = await service
        .from('classifieds')
        .select('id, city_id, author_profile_id, title, payment_amount_cents')
        .eq('id', entityId)
        .maybeSingle();
      const classified = (data as ClassifiedLookup | null) ?? null;
      if (classified) {
        return {
          cityId: classified.city_id,
          profileId: classified.author_profile_id,
          providerSubscriptionId: input.subscriptionId,
          providerCustomerId: input.customerId,
          sourceType: 'publication',
          sourceId: classified.id,
          entityType,
          entityId: classified.id,
          description: classified.title,
          metadata: { expected_amount_cents: classified.payment_amount_cents ?? 0 },
        };
      }
    }

    if (entityType === 'property' && entityId) {
      const { data } = await service
        .from('properties')
        .select('id, city_id, owner_profile_id, title, payment_amount_cents')
        .eq('id', entityId)
        .maybeSingle();
      const property = (data as PropertyLookup | null) ?? null;
      if (property) {
        return {
          cityId: property.city_id,
          profileId: property.owner_profile_id,
          providerSubscriptionId: input.subscriptionId,
          providerCustomerId: input.customerId,
          sourceType: 'publication',
          sourceId: property.id,
          entityType,
          entityId: property.id,
          description: property.title,
          metadata: { expected_amount_cents: property.payment_amount_cents ?? 0 },
        };
      }
    }
  }

  if (reference.startsWith('lead:')) {
    const leadId = reference.replace('lead:', '');
    const lead = await findLeadByColumn('id', leadId);
    if (lead) return leadContext(lead, input.subscriptionId, input.customerId);
  }

  if (input.subscriptionId) {
    const lead = await findLeadByColumn('asaas_subscription_id', input.subscriptionId);
    if (lead) return leadContext(lead, input.subscriptionId, input.customerId);
  }

  if (input.customerId) {
    const lead = await findLeadByColumn('asaas_customer_id', input.customerId);
    if (lead) return leadContext(lead, input.subscriptionId, input.customerId);
  }

  return {
    cityId: null,
    profileId: null,
    providerSubscriptionId: input.subscriptionId,
    providerCustomerId: input.customerId,
    sourceType: 'unknown',
    sourceId: null,
    entityType: null,
    entityId: null,
    description: null,
    metadata: {},
  };
}

async function findLeadByColumn(column: 'id' | 'asaas_subscription_id' | 'asaas_customer_id', value: string): Promise<BusinessLeadLookup | null> {
  const service = createLedgerClient();
  const { data } = await service
    .from('business_leads')
    .select('id, city_id, profile_id, business_name')
    .eq(column, value)
    .maybeSingle();
  return (data as BusinessLeadLookup | null) ?? null;
}

function leadContext(
  lead: BusinessLeadLookup,
  subscriptionId: string | null,
  customerId: string | null,
) {
  return {
    cityId: lead.city_id,
    profileId: lead.profile_id,
    providerSubscriptionId: subscriptionId,
    providerCustomerId: customerId,
    sourceType: 'business_subscription' as const,
    sourceId: lead.id,
    entityType: 'business_lead',
    entityId: lead.id,
    description: `Assinatura - ${lead.business_name}`,
    metadata: {},
  };
}

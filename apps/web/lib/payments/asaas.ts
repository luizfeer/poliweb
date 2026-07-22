import 'server-only';

import { requireProfile } from '@/lib/auth';
import {
  AsaasError,
  createOrUpdateCustomer,
  createPayment,
  dueDateFromNow,
  getAsaasConfig,
  type AsaasBillingType,
} from '@/lib/asaas';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import type { PaymentGateway } from './gateway';
import { recordPortalPayment } from './ledger';
import type { CheckoutSession, CreateCheckoutInput, PaymentWebhookPayload } from './types';

export class AsaasPaymentGateway implements PaymentGateway {
  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const config = getAsaasConfig();
    if (!config) {
      throw new Error('Pagamentos não configurados. Defina ASAAS_API_KEY no ambiente.');
    }

    const auth = await requireProfile();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email;
    if (!email) throw new Error('Email do usuário não encontrado para gerar cobrança.');

    const customer = await createOrUpdateCustomer(config, {
      name: auth.profile.full_name ?? email,
      email,
      mobilePhone: auth.profile.phone,
      externalReference: `profile:${auth.profile.id}`,
    });

    const successUrl = new URL(input.successUrl, resolvePublicSiteOrigin()).toString();
    const paymentInput = {
      customer: customer.id,
      value: input.amountCents / 100,
      dueDate: dueDateFromNow(2),
      billingType: 'PIX' as AsaasBillingType,
      description: input.description,
      externalReference: `publication:${input.entityType}:${input.entityId}`,
      callback: {
        successUrl,
        autoRedirect: true,
      },
    };

    const payment = await createPayment(config, paymentInput).catch(async (error: unknown) => {
      if (error instanceof AsaasError && error.message.toLowerCase().includes('pix')) {
        return createPayment(config, { ...paymentInput, billingType: 'UNDEFINED' });
      }
      throw error;
    });

    try {
      await recordPortalPayment({
        cityId: input.cityId,
        profileId: auth.profile.id,
        providerPaymentId: payment.id,
        providerCustomerId: customer.id,
        sourceType: 'publication',
        sourceId: input.entityId,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        amountCents: input.amountCents,
        netAmountCents: payment.netValue == null ? null : Math.round(payment.netValue * 100),
        status: payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' ? 'paid' : 'pending',
        billingType: payment.billingType,
        invoiceUrl: payment.invoiceUrl,
        dueDate: payment.dueDate,
        paidAt: payment.paymentDate,
        externalReference: payment.externalReference,
        asaasRaw: payment as unknown as Json,
        metadata: input.metadata ?? {},
      });
    } catch (error) {
      console.error('[asaas] falha ao registrar pagamento no ledger', error);
    }

    return {
      provider: 'asaas',
      providerReference: payment.id,
      status: payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' ? 'paid' : 'pending',
      checkoutUrl: payment.invoiceUrl,
    };
  }

  async parseWebhook(request: Request): Promise<PaymentWebhookPayload> {
    const payload = (await request.json()) as unknown;
    if (!isAsaasPublicationWebhook(payload)) {
      throw new Error('Invalid Asaas publication webhook payload');
    }

    const [entityType, entityId] = payload.payment.externalReference.replace(/^publication:/, '').split(':');
    if ((entityType !== 'property' && entityType !== 'classified') || !entityId) {
      throw new Error('Invalid Asaas publication reference');
    }

    return {
      provider: 'asaas',
      providerReference: payload.payment.id,
      status: ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED_IN_CASH'].includes(payload.event)
        ? 'paid'
        : 'failed',
      entityType,
      entityId,
      amountCents: Math.round((payload.payment.value ?? 49) * 100),
    };
  }
}

function isAsaasPublicationWebhook(value: unknown): value is {
  event: string;
  payment: { id: string; value?: number | null; externalReference: string };
} {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Record<string, unknown>;
  const payment = payload.payment as Record<string, unknown> | undefined;
  return (
    typeof payload.event === 'string' &&
    typeof payment?.id === 'string' &&
    typeof payment.externalReference === 'string' &&
    payment.externalReference.startsWith('publication:')
  );
}

import type { PaymentGateway } from './gateway';
import type { CheckoutSession, CreateCheckoutInput, PaymentWebhookPayload } from './types';

export class MockPaymentGateway implements PaymentGateway {
  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession> {
    return {
      provider: 'mock',
      providerReference: `mock_${input.entityType}_${input.entityId}`,
      status: 'paid',
      checkoutUrl: null,
    };
  }

  async parseWebhook(request: Request): Promise<PaymentWebhookPayload> {
    const payload = (await request.json()) as unknown;

    if (!isMockWebhookPayload(payload)) {
      throw new Error('Invalid mock payment webhook payload');
    }

    return payload;
  }
}

function isMockWebhookPayload(value: unknown): value is PaymentWebhookPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    payload.provider === 'mock' &&
    typeof payload.providerReference === 'string' &&
    ['paid', 'failed', 'expired', 'refunded'].includes(String(payload.status)) &&
    ['property', 'classified'].includes(String(payload.entityType)) &&
    typeof payload.entityId === 'string' &&
    typeof payload.amountCents === 'number'
  );
}

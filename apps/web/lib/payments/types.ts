export type PaymentEntityType = 'property' | 'classified';

export type CheckoutSession = {
  provider: 'mock' | 'stripe' | 'pagarme' | 'asaas';
  providerReference: string;
  status: 'pending' | 'paid';
  checkoutUrl: string | null;
};

export type CreateCheckoutInput = {
  cityId: string;
  entityType: PaymentEntityType;
  entityId: string;
  amountCents: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type PaymentWebhookPayload = {
  provider: CheckoutSession['provider'];
  providerReference: string;
  status: 'paid' | 'failed' | 'expired' | 'refunded';
  entityType: PaymentEntityType;
  entityId: string;
  amountCents: number;
};

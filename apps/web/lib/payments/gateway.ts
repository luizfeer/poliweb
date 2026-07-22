import type { CheckoutSession, CreateCheckoutInput, PaymentWebhookPayload } from './types';

export type PaymentGateway = {
  createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession>;
  parseWebhook(request: Request): Promise<PaymentWebhookPayload>;
};

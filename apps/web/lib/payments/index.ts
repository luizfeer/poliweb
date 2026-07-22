import { AsaasPaymentGateway } from './asaas';
import type { PaymentGateway } from './gateway';

export function getPaymentGateway(): PaymentGateway {
  return new AsaasPaymentGateway();
}

export type { PaymentGateway } from './gateway';
export type {
  CheckoutSession,
  CreateCheckoutInput,
  PaymentEntityType,
  PaymentWebhookPayload,
} from './types';

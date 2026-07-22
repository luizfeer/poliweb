import { getPaymentGateway } from '@/lib/payments';
import type { CheckoutSession } from '@/lib/payments';
import {
  calculatePropertyFeeCents,
  type ListingType,
  type PropertyType,
  type RealEstatePricingConfig,
} from './pricing';

export type CreatePropertyCheckoutInput = {
  cityId: string;
  propertyId: string;
  title: string;
  listingType: ListingType;
  propertyType: PropertyType;
  publisherKind: 'private_owner' | 'realtor';
  pricing: RealEstatePricingConfig;
  successUrl: string;
  cancelUrl: string;
};

export async function createPropertyCheckout(
  input: CreatePropertyCheckoutInput,
): Promise<CheckoutSession> {
  const amountCents = calculatePropertyFeeCents({
    listingType: input.listingType,
    propertyType: input.propertyType,
    publisherKind: input.publisherKind,
    pricing: input.pricing,
  });

  if (amountCents === 0) {
    return {
      provider: 'mock',
      providerReference: `not_required_property_${input.propertyId}`,
      status: 'paid',
      checkoutUrl: null,
    };
  }

  const gateway = getPaymentGateway();

  return gateway.createCheckoutSession({
    cityId: input.cityId,
    entityType: 'property',
    entityId: input.propertyId,
    amountCents,
    description: `Publicacao de imovel: ${input.title}`,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    metadata: {
      listingType: input.listingType,
      propertyType: input.propertyType,
    },
  });
}

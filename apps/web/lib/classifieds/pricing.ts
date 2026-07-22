import type { CityModuleConfig, ClassifiedType } from './types';

const defaultPricingCents: Record<ClassifiedType, number> = {
  item: 4900,
  vehicle: 4900,
  service: 4900,
  job: 4900,
  other: 4900,
};

const PUBLICATION_FEE_CENTS = 4900;

export function calculateFee(type: ClassifiedType, cityConfig: CityModuleConfig | null | undefined): number {
  if (!cityConfig?.classifieds_payment_active) return 0;
  return PUBLICATION_FEE_CENTS;
}

export function validityDaysForType(type: ClassifiedType): number {
  if (type === 'job' || type === 'service') return 30;
  return 60;
}

export function paymentStatusForFee(amountCents: number) {
  return amountCents > 0 ? 'pending' : 'not_required';
}

export function dateAfterDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

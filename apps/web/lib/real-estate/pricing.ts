import type { Json } from '@/lib/supabase/database.types';

export const REAL_ESTATE_MODULE_KEY = 'real_estate';

export const LISTING_TYPES = ['sale', 'rent', 'temporary'] as const;
export const PROPERTY_TYPES = [
  'apartment',
  'house',
  'cobertura',
  'kitnet',
  'studio',
  'chacara',
  'sitio',
  'fazenda',
  'terreno_urbano',
  'terreno_rural',
  'comercial_loja',
  'comercial_sala',
  'galpao',
  'hotel',
] as const;

export type ListingType = (typeof LISTING_TYPES)[number];
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type PropertyPricingKey = `${ListingType}:${PropertyType}`;

export type RealtorSubscriptionPlan = {
  activeListingsLimit: number | null;
  featuredListingsPerMonth: number;
  monthlyAmountCents: number;
};

export type RealEstatePricingConfig = {
  paymentActive: boolean;
  privateListingFeesCents: Record<PropertyPricingKey, number>;
  realtorPlans: {
    free: RealtorSubscriptionPlan;
    pro: RealtorSubscriptionPlan;
    premium: RealtorSubscriptionPlan;
  };
};

export type CalculatePropertyFeeInput = {
  listingType: ListingType;
  propertyType: PropertyType;
  publisherKind: 'private_owner' | 'realtor';
  pricing: RealEstatePricingConfig;
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  sale: 'Venda',
  rent: 'Aluguel mensal',
  temporary: 'Temporada',
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  cobertura: 'Cobertura',
  kitnet: 'Kitnet',
  studio: 'Studio',
  chacara: 'Chacara',
  sitio: 'Sitio',
  fazenda: 'Fazenda',
  terreno_urbano: 'Terreno urbano',
  terreno_rural: 'Terreno rural',
  comercial_loja: 'Loja comercial',
  comercial_sala: 'Sala comercial',
  galpao: 'Galpao',
  hotel: 'Hotel/pousada',
};

const DEFAULT_PRIVATE_FEE_BY_LISTING_TYPE: Record<ListingType, number> = {
  sale: 4900,
  rent: 4900,
  temporary: 4900,
};

const PRIVATE_PUBLICATION_FEE_CENTS = 4900;

export const DEFAULT_REAL_ESTATE_PRICING_CONFIG: RealEstatePricingConfig = {
  paymentActive: false,
  privateListingFeesCents: Object.fromEntries(
    LISTING_TYPES.flatMap((listingType) =>
      PROPERTY_TYPES.map((propertyType) => [
        buildPropertyPricingKey(listingType, propertyType),
        DEFAULT_PRIVATE_FEE_BY_LISTING_TYPE[listingType],
      ]),
    ),
  ) as Record<PropertyPricingKey, number>,
  realtorPlans: {
    free: {
      activeListingsLimit: 3,
      featuredListingsPerMonth: 0,
      monthlyAmountCents: 0,
    },
    pro: {
      activeListingsLimit: 25,
      featuredListingsPerMonth: 3,
      monthlyAmountCents: 9900,
    },
    premium: {
      activeListingsLimit: null,
      featuredListingsPerMonth: 999,
      monthlyAmountCents: 29900,
    },
  },
};

export function buildPropertyPricingKey(
  listingType: ListingType,
  propertyType: PropertyType,
): PropertyPricingKey {
  return `${listingType}:${propertyType}`;
}

export function isListingType(value: unknown): value is ListingType {
  return typeof value === 'string' && LISTING_TYPES.includes(value as ListingType);
}

export function isPropertyType(value: unknown): value is PropertyType {
  return typeof value === 'string' && PROPERTY_TYPES.includes(value as PropertyType);
}

export function parseCurrencyToCents(value: FormDataEntryValue | null): number {
  if (typeof value !== 'string') {
    return 0;
  }

  const currency = value.replace(/[^\d,.-]/g, '');
  const lastComma = currency.lastIndexOf(',');
  const lastDot = currency.lastIndexOf('.');
  const decimalSeparator = lastComma > lastDot ? ',' : lastDot > -1 ? '.' : null;
  const normalized = decimalSeparator
    ? normalizeCurrencyWithDecimalSeparator(currency, decimalSeparator)
    : currency;
  const amount = Number.parseFloat(normalized);

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return Math.round(amount * 100);
}

function normalizeCurrencyWithDecimalSeparator(value: string, decimalSeparator: ',' | '.'): string {
  const separatorIndex = value.lastIndexOf(decimalSeparator);
  const decimals = value.slice(separatorIndex + 1);

  if (decimals.length > 2) {
    return value.replace(/[,.]/g, '');
  }

  const integerPart = value.slice(0, separatorIndex).replace(/[,.]/g, '');
  return `${integerPart}.${decimals}`;
}

export function formatCentsAsInputValue(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function formatCentsAsCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function normalizeRealEstatePricingConfig(config: Json | null): RealEstatePricingConfig {
  if (!isRecord(config)) {
    return DEFAULT_REAL_ESTATE_PRICING_CONFIG;
  }

  const pricing = isRecord(config.pricing) ? config.pricing : {};
  const privateListingFees = isRecord(pricing.privateListingFeesCents)
    ? pricing.privateListingFeesCents
    : {};

  const privateListingFeesCents = { ...DEFAULT_REAL_ESTATE_PRICING_CONFIG.privateListingFeesCents };
  for (const listingType of LISTING_TYPES) {
    for (const propertyType of PROPERTY_TYPES) {
      const key = buildPropertyPricingKey(listingType, propertyType);
      const value = privateListingFees[key];
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        privateListingFeesCents[key] = Math.round(value);
      }
    }
  }

  return {
    paymentActive:
      config.real_estate_payment_active === true || pricing.paymentActive === true,
    privateListingFeesCents,
    realtorPlans: DEFAULT_REAL_ESTATE_PRICING_CONFIG.realtorPlans,
  };
}

export function serializeRealEstatePricingConfig(
  currentConfig: Json | null,
  pricing: RealEstatePricingConfig,
): Json {
  const base = isRecord(currentConfig) ? currentConfig : {};

  return {
    ...base,
    real_estate_payment_active: pricing.paymentActive,
    pricing: {
      paymentActive: pricing.paymentActive,
      privateListingFeesCents: pricing.privateListingFeesCents,
      realtorPlans: pricing.realtorPlans,
    },
  };
}

export function calculatePropertyFeeCents({
  listingType,
  propertyType,
  publisherKind,
  pricing,
}: CalculatePropertyFeeInput): number {
  if (!pricing.paymentActive || publisherKind === 'realtor') {
    return 0;
  }

  return pricing.privateListingFeesCents[buildPropertyPricingKey(listingType, propertyType)] ? PRIVATE_PUBLICATION_FEE_CENTS : 0;
}

function isRecord(value: unknown): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

import type { Database, Json } from '@/lib/supabase/database.types';
import type { ListingType, PropertyType } from './pricing';

export type ListingKind = Database['public']['Enums']['listing_kind'];
export type PropertyKind = Database['public']['Enums']['property_kind'];
export type PropertyReviewStatus = Database['public']['Enums']['property_review_status'];
export type PropertyPaymentStatus = Database['public']['Enums']['property_payment_status'];
export type RealtorSubscriptionPlan = Database['public']['Enums']['realtor_subscription_plan'];
export type EntityStatus = Database['public']['Enums']['entity_status'];

export type PropertySearchParams = {
  cityId?: string;
  q?: string;
  listingType?: ListingType;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  districtId?: string;
  furnished?: boolean;
  petsAllowed?: boolean;
  limit?: number;
  offset?: number;
};

export type PropertyRealtorSummary = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  creci: string | null;
  verified: boolean;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  subscriptionPlan: RealtorSubscriptionPlan;
};

export type Property = {
  id: string;
  cityId: string;
  slug: string;
  title: string;
  description: string | null;
  listingType: ListingType;
  propertyType: PropertyType;
  status: EntityStatus;
  reviewStatus: PropertyReviewStatus;
  paymentStatus: PropertyPaymentStatus;
  paymentAmountCents: number;
  paymentProviderRef: string | null;
  rejectionReason: string | null;
  price: number | null;
  rentPrice: number | null;
  condoFee: number | null;
  iptuYearly: number | null;
  areaTotalM2: number | null;
  areaUsefulM2: number | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  districtId: string | null;
  districtName: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  cep: string | null;
  showExactLocation: boolean;
  lat: number | null;
  lng: number | null;
  amenities: string[];
  furnished: boolean;
  petsAllowed: boolean;
  hasPool: boolean;
  hasGrill: boolean;
  hasGarden: boolean;
  hasGarage: boolean;
  nearLake: boolean;
  coverUrl: string | null;
  photos: string[];
  videoUrl: string | null;
  featured: boolean;
  featuredUntil: string | null;
  viewsCount: number;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  ownerProfileId: string | null;
  realtorId: string | null;
  realtor: PropertyRealtorSummary | null;
  ogImageUrl?: string;
  ogSquareImageUrl?: string;
};

export type Realtor = {
  id: string;
  cityId: string;
  slug: string;
  name: string;
  legalName: string | null;
  cnpj: string | null;
  creci: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  districtName: string | null;
  about: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  instagram: string | null;
  status: EntityStatus;
  verified: boolean;
  featured: boolean;
  subscriptionPlan: RealtorSubscriptionPlan;
  createdAt: string | null;
};

export type PropertyInquiry = {
  id: string;
  propertyId: string;
  requesterName: string;
  requesterEmail: string | null;
  requesterPhone: string | null;
  message: string | null;
  source: string | null;
  status: string | null;
  createdAt: string | null;
};

export type PropertyRow = Database['public']['Tables']['properties']['Row'] & {
  districts?: { name: string | null } | null;
  realtors?: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
    creci: string | null;
    verified: boolean | null;
    whatsapp: string | null;
    phone: string | null;
    email: string | null;
    subscription_plan: RealtorSubscriptionPlan | null;
  } | null;
  og_image_url?: string | null;
  og_square_image_url?: string | null;
};

export type RealtorRow = Database['public']['Tables']['realtors']['Row'] & {
  districts?: { name: string | null } | null;
};

export function asStringArray(value: Json | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'string') {
        return item.url;
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

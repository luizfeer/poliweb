import { isListingType, isPropertyType, type ListingType, type PropertyType } from './pricing';

export type RealEstateSearchParams = {
  q?: string;
  finalidade?: string;
  tipo?: string;
  min?: string;
  max?: string;
  quartos?: string;
  banheiros?: string;
  bairro?: string;
  mobiliado?: string;
  pets?: string;
};

export function parseSearchParams(params: RealEstateSearchParams) {
  return {
    q: normalizeOptionalString(params.q),
    listingType: parseListingKind(params.finalidade),
    propertyType: parsePropertyKind(params.tipo),
    minPrice: parseNumber(params.min),
    maxPrice: parseNumber(params.max),
    bedrooms: parseInteger(params.quartos),
    bathrooms: parseInteger(params.banheiros),
    districtId: normalizeOptionalString(params.bairro),
    furnished: params.mobiliado === '1' ? true : undefined,
    petsAllowed: params.pets === '1' ? true : undefined,
  };
}

function parseListingKind(value: string | undefined): ListingType | undefined {
  return isListingType(value) ? value : undefined;
}

function parsePropertyKind(value: string | undefined): PropertyType | undefined {
  return isPropertyType(value) ? value : undefined;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseInteger(value: string | undefined): number | undefined {
  const parsed = parseNumber(value);
  return parsed === undefined ? undefined : Math.round(parsed);
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

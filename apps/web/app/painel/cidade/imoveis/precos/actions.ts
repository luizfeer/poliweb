'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import {
  buildPropertyPricingKey,
  LISTING_TYPES,
  normalizeRealEstatePricingConfig,
  parseCurrencyToCents,
  PROPERTY_TYPES,
  REAL_ESTATE_MODULE_KEY,
  serializeRealEstatePricingConfig,
} from '@/lib/real-estate/pricing';
import { createClient } from '@/lib/supabase/server';

const updateRealEstatePricingSchema = z.object({
  paymentActive: z.boolean(),
  privateListingFeesCents: z.record(z.string(), z.number().int().min(0).max(10_000_000)),
});

export async function updateRealEstatePricingAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = updateRealEstatePricingSchema.parse({
    paymentActive: formData.get('payment_active') === 'on',
    privateListingFeesCents: collectPricingMatrix(formData),
  });

  const supabase = await createClient();
  const { data: currentModule } = await supabase
    .from('city_modules')
    .select('config')
    .eq('city_id', city.id)
    .eq('module_key', REAL_ESTATE_MODULE_KEY)
    .maybeSingle();

  const pricing = normalizeRealEstatePricingConfig(currentModule?.config ?? null);
  pricing.paymentActive = parsed.paymentActive;
  pricing.privateListingFeesCents = {
    ...pricing.privateListingFeesCents,
    ...parsed.privateListingFeesCents,
  };

  const nextConfig = serializeRealEstatePricingConfig(currentModule?.config ?? null, pricing);

  await supabase.from('city_modules').upsert({
    city_id: city.id,
    module_key: REAL_ESTATE_MODULE_KEY,
    enabled: true,
    config: nextConfig,
  });

  await supabase.from('audit_log').insert({
    actor_id: auth.profile.id,
    city_id: city.id,
    action: 'real_estate_pricing.updated',
    entity_type: 'city_module',
    entity_id: city.id,
    diff: {
      module_key: REAL_ESTATE_MODULE_KEY,
      payment_active: parsed.paymentActive,
      private_listing_fees_cents: parsed.privateListingFeesCents,
    },
  });

  revalidatePath('/painel/cidade/imoveis/precos');
}

function collectPricingMatrix(formData: FormData): Record<string, number> {
  const fees: Record<string, number> = {};

  for (const listingType of LISTING_TYPES) {
    for (const propertyType of PROPERTY_TYPES) {
      const key = buildPropertyPricingKey(listingType, propertyType);
      fees[key] = parseCurrencyToCents(formData.get(`fee__${key}`));
    }
  }

  return fees;
}

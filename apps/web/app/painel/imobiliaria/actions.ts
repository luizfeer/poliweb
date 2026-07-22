'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { notifyCityAdmins } from '@/lib/notifications';
import {
  createPropertyCheckout,
  LISTING_TYPES,
  normalizeRealEstatePricingConfig,
  PROPERTY_TYPES,
  REAL_ESTATE_MODULE_KEY,
  calculatePropertyFeeCents,
} from '@/lib/real-estate';
import { createClient } from '@/lib/supabase/server';
import { uploadLinkedImage } from '@/lib/media/actions';

const propertyDraftSchema = z.object({
  title: z.string().min(5).max(140),
  listingType: z.enum(LISTING_TYPES),
  propertyType: z.enum(PROPERTY_TYPES),
  price: z.coerce.number().min(0).optional(),
  rentPrice: z.coerce.number().min(0).optional(),
  description: z.string().max(3000).optional().or(z.literal('')),
  districtId: z.string().uuid().optional().or(z.literal('')),
  bedrooms: z.coerce.number().int().min(0).max(30).optional(),
  bathrooms: z.coerce.number().int().min(0).max(30).optional(),
  areaUsefulM2: z.coerce.number().min(0).optional(),
  safetyTermsAccepted: z.literal(true),
});

const propertyIdSchema = z.object({
  propertyId: z.string().uuid(),
});

export async function createPropertyDraftAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireProfile();
  const parsed = propertyDraftSchema.parse({
    title: formData.get('title'),
    listingType: formData.get('listing_type'),
    propertyType: formData.get('property_type'),
    price: formData.get('price') || undefined,
    rentPrice: formData.get('rent_price') || undefined,
    description: formData.get('description') ?? '',
    districtId: formData.get('district_id') ?? '',
    bedrooms: formData.get('bedrooms') || undefined,
    bathrooms: formData.get('bathrooms') || undefined,
    areaUsefulM2: formData.get('area_useful_m2') || undefined,
    safetyTermsAccepted: formData.get('safety_terms_accepted') === 'on',
  });
  const supabase = await createClient();
  const pricing = await getPricingConfig(city.id);
  const paymentAmountCents = calculatePropertyFeeCents({
    listingType: parsed.listingType,
    propertyType: parsed.propertyType,
    publisherKind: 'private_owner',
    pricing,
  });

  const { data, error } = await supabase
    .from('properties')
    .insert({
      city_id: city.id,
      owner_profile_id: auth.profile.id,
      slug: `${slugify(parsed.title)}-${Date.now().toString(36)}`,
      listing_type: parsed.listingType,
      property_type: parsed.propertyType,
      title: parsed.title,
      description: parsed.description || null,
      district_id: parsed.districtId || null,
      price: parsed.price ?? null,
      rent_price: parsed.rentPrice ?? null,
      bedrooms: parsed.bedrooms ?? null,
      bathrooms: parsed.bathrooms ?? null,
      area_useful_m2: parsed.areaUsefulM2 ?? null,
      status: 'draft',
      review_status: 'pending',
      payment_status: paymentAmountCents > 0 ? 'pending' : 'not_required',
      payment_amount_cents: paymentAmountCents,
      published_by_profile_id: auth.profile.id,
    })
    .select('id')
    .single();

  if (error) throw error;

  const coverFile = formData.get('cover_file');
  const galleryFiles = formData.getAll('gallery_files');
  let hasCover = false;
  if (coverFile instanceof File && coverFile.size > 0) {
    await uploadLinkedImage({
      entityType: 'property',
      entityId: data.id,
      role: 'cover',
      file: coverFile,
      altText: parsed.title,
      actorProfileId: auth.profile.id,
    });
    hasCover = true;
  }

  for (const file of galleryFiles) {
    if (!(file instanceof File) || file.size === 0) continue;
    if (!hasCover && file.type.startsWith('image/')) {
      await uploadLinkedImage({
        entityType: 'property',
        entityId: data.id,
        role: 'cover',
        file,
        altText: parsed.title,
        actorProfileId: auth.profile.id,
      });
      hasCover = true;
    }
    await uploadLinkedImage({
      entityType: 'property',
      entityId: data.id,
      role: 'gallery',
      file,
      altText: parsed.title,
      actorProfileId: auth.profile.id,
    });
  }

  revalidatePath('/painel/imobiliaria/imoveis');
  redirect(`/painel/imobiliaria/imoveis?created=${data.id}`);
}

export async function submitForReviewAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireProfile();
  const parsed = propertyIdSchema.parse({ propertyId: formData.get('property_id') });
  const supabase = await createClient();
  const pricing = await getPricingConfig(city.id);

  const { data: property, error } = await supabase
    .from('properties')
    .select('id, title, listing_type, property_type, payment_status, owner_profile_id, realtor_id')
    .eq('city_id', city.id)
    .eq('id', parsed.propertyId)
    .maybeSingle();

  if (error) throw error;
  if (!property) return;

  if (pricing.paymentActive && !['paid', 'waived', 'not_required'].includes(property.payment_status)) {
    const checkout = await createPropertyCheckout({
      cityId: city.id,
      propertyId: property.id,
      title: property.title,
      listingType: property.listing_type,
      propertyType: property.property_type,
      publisherKind: property.realtor_id ? 'realtor' : 'private_owner',
      pricing,
      successUrl: `/painel/imobiliaria/imoveis?payment=success&property=${property.id}`,
      cancelUrl: `/painel/imobiliaria/imoveis?payment=cancel&property=${property.id}`,
    });

    await supabase
      .from('properties')
      .update({
        payment_status: checkout.status,
        payment_provider_ref: checkout.providerReference,
      })
      .eq('city_id', city.id)
      .eq('id', property.id);

    if (checkout.checkoutUrl) {
      redirect(checkout.checkoutUrl);
    }
  }

  await supabase
    .from('properties')
    .update({
      status: 'pending',
      review_status: 'pending',
      published_by_profile_id: property.owner_profile_id,
    })
    .eq('city_id', city.id)
    .eq('id', property.id);

  await notifyCityAdmins({
    cityId: city.id,
    type: 'approval.pending',
    priority: 'normal',
    title: 'Imóvel aguardando aprovação',
    body: property.title,
    targetUrl: '/painel/cidade/imoveis/aprovacao',
    entityType: 'property',
    entityId: property.id,
    metadata: { owner_profile_id: property.owner_profile_id, realtor_id: property.realtor_id },
  });

  revalidatePath('/painel/imobiliaria/imoveis');
  redirect('/painel/imobiliaria/imoveis');
}

export async function requestRemovalAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireProfile();
  const parsed = propertyIdSchema.parse({ propertyId: formData.get('property_id') });
  const supabase = await createClient();

  await supabase
    .from('properties')
    .update({ status: 'archived' })
    .eq('city_id', city.id)
    .eq('id', parsed.propertyId);

  revalidatePath('/painel/imobiliaria/imoveis');
}

async function getPricingConfig(cityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('city_modules')
    .select('config')
    .eq('city_id', cityId)
    .eq('module_key', REAL_ESTATE_MODULE_KEY)
    .maybeSingle();

  return normalizeRealEstatePricingConfig(data?.config ?? null);
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);
}

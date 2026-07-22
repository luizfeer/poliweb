'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getProfile } from '@/lib/auth/get-profile';
import { notifyCityAdmins } from '@/lib/notifications';
import { notifyPropertyInquiry } from '@/lib/real-estate/notifications';
import { getPropertyBySlug } from '@/lib/real-estate/queries';
import { createClient } from '@/lib/supabase/server';

const inquirySchema = z.object({
  propertyId: z.string().uuid(),
  propertySlug: z.string().min(1),
  requesterName: z.string().min(2).max(120),
  requesterEmail: z.string().email().optional().or(z.literal('')),
  requesterPhone: z.string().min(8).max(30),
  message: z.string().max(1000).optional().or(z.literal('')),
});

const favoriteSchema = z.object({
  propertyId: z.string().uuid(),
  propertySlug: z.string().min(1),
});

const requestContactSchema = z.object({
  propertyId: z.string().uuid(),
  propertySlug: z.string().trim().min(1).max(160),
  nextPath: z.string().trim().min(1).max(240),
});

export type PropertyContactResult = {
  contactName: string | null;
  phoneUrl: string | null;
  whatsappUrl: string | null;
};

export async function createInquiryAction(formData: FormData) {
  const parsed = inquirySchema.parse({
    propertyId: formData.get('property_id'),
    propertySlug: formData.get('property_slug'),
    requesterName: formData.get('requester_name'),
    requesterEmail: formData.get('requester_email') ?? '',
    requesterPhone: formData.get('requester_phone'),
    message: formData.get('message') ?? '',
  });

  const [supabase, auth] = await Promise.all([createClient(), getProfile()]);
  if (!auth) {
    redirect(`/entrar?next=${encodeURIComponent(`/imoveis/${parsed.propertySlug}`)}`);
  }

  await supabase.from('property_inquiries').insert({
    property_id: parsed.propertyId,
    requester_profile_id: auth.profile.id,
    requester_name: parsed.requesterName,
    requester_email: parsed.requesterEmail || null,
    requester_phone: parsed.requesterPhone,
    message: parsed.message || null,
    source: 'site',
  });

  const property = await getPropertyBySlug(parsed.propertySlug);
  if (property) {
    await notifyPropertyInquiry({
      property,
      requesterName: parsed.requesterName,
      requesterPhone: parsed.requesterPhone,
      message: parsed.message || undefined,
    });
    await notifyCityAdmins({
      cityId: property.cityId,
      type: 'lead.received',
      priority: 'normal',
      title: 'Novo contato em imóvel',
      body: `${parsed.requesterName} demonstrou interesse em ${property.title}.`,
      targetUrl: '/painel/cidade/imoveis',
      entityType: 'property',
      entityId: property.id,
      metadata: {
        requester_name: parsed.requesterName,
        requester_phone: parsed.requesterPhone,
      },
    });
  }

  revalidatePath(`/imoveis/${parsed.propertySlug}`);
}

export async function requestPropertyContactAction(input: unknown): Promise<PropertyContactResult> {
  const parsed = requestContactSchema.parse(input);
  const safeNextPath = safeInternalPath(parsed.nextPath, `/imoveis/${parsed.propertySlug}`);
  const [supabase, auth] = await Promise.all([createClient(), getProfile()]);
  if (!auth) {
    redirect(`/entrar?next=${encodeURIComponent(safeNextPath)}`);
  }

  const property = await getPropertyBySlug(parsed.propertySlug);
  if (!property || property.id !== parsed.propertyId) {
    throw new Error('Imóvel não encontrado ou indisponível.');
  }

  await supabase.from('audit_log').insert({
    actor_id: auth.profile.id,
    city_id: property.cityId,
    action: 'property.contact_reveal',
    entity_type: 'property',
    entity_id: property.id,
    diff: {
      title: property.title,
      requester_profile_id: auth.profile.id,
      realtor_id: property.realtorId,
    },
  });

  await notifyCityAdmins({
    cityId: property.cityId,
    type: 'lead.received',
    priority: 'normal',
    title: 'Contato de imóvel solicitado',
    body: `${auth.profile.full_name ?? 'Usuário'} solicitou o contato de ${property.title}.`,
    targetUrl: '/painel/cidade/imoveis',
    entityType: 'property',
    entityId: property.id,
    metadata: {
      requester_profile_id: auth.profile.id,
      realtor_id: property.realtorId,
    },
  });

  return {
    contactName: property.realtor?.name ?? null,
    phoneUrl: phoneLink(property.realtor?.phone),
    whatsappUrl: whatsappLink(property.realtor?.whatsapp ?? property.realtor?.phone),
  };
}

export async function toggleFavoriteAction(formData: FormData) {
  const parsed = favoriteSchema.parse({
    propertyId: formData.get('property_id'),
    propertySlug: formData.get('property_slug'),
  });
  const auth = await getProfile();

  if (!auth) {
    redirect(`/entrar?next=/imoveis/${parsed.propertySlug}`);
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('property_favorites')
    .select('property_id')
    .eq('property_id', parsed.propertyId)
    .eq('profile_id', auth.profile.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('property_favorites')
      .delete()
      .eq('property_id', parsed.propertyId)
      .eq('profile_id', auth.profile.id);
  } else {
    await supabase.from('property_favorites').insert({
      property_id: parsed.propertyId,
      profile_id: auth.profile.id,
    });
  }

  revalidatePath(`/imoveis/${parsed.propertySlug}`);
}

function safeInternalPath(value: string, fallback: string): string {
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (!value.startsWith('/imoveis/')) return fallback;
  return value;
}

function phoneDigits(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? '';
  if (digits.length < 8) return null;
  return digits;
}

function whatsappLink(value: string | null | undefined): string | null {
  const digits = phoneDigits(value);
  if (!digits) return null;
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

function phoneLink(value: string | null | undefined): string | null {
  const digits = phoneDigits(value);
  return digits ? `tel:${digits}` : null;
}

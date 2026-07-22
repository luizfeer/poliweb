'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireProfile, requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

const reportSchema = z.object({
  classified_id: z.string().uuid(),
  reason: z.enum(['spam', 'golpe', 'inadequado', 'incorreto']),
  notes: z.string().trim().max(1000).optional().transform((value) => value || null),
});

const contactSchema = z.object({
  classified_id: z.string().uuid(),
  message: z.string().trim().min(10).max(1200),
});

const requestContactSchema = z.object({
  classifiedId: z.string().uuid(),
  classifiedSlug: z.string().trim().min(1).max(160),
  nextPath: z.string().trim().min(1).max(240),
});

export type ClassifiedContactResult = {
  contactName: string | null;
  phoneUrl: string | null;
  whatsappUrl: string | null;
};

export async function reportClassifiedAction(formData: FormData) {
  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city) return;
  const parsed = reportSchema.parse({
    classified_id: formData.get('classified_id'),
    reason: formData.get('reason'),
    notes: formData.get('notes') || undefined,
  });

  const supabase = await createClient();
  const { error } = await supabase.from('classified_reports').insert({
    city_id: city.id,
    classified_id: parsed.classified_id,
    reporter_profile_id: auth.profile.id,
    reason: parsed.reason,
    notes: parsed.notes,
  });
  if (error && error.code !== '23505') throw error;
  revalidatePath('/classificados');
  revalidatePath('/painel/cidade/classificados/reports');
}

export async function contactSellerAction(formData: FormData) {
  await requireProfile();
  const city = await getCurrentCity();
  if (!city) return;
  const parsed = contactSchema.parse({
    classified_id: formData.get('classified_id'),
    message: formData.get('message'),
  });
  const supabase = await createClient();
  await supabase.from('audit_log').insert({
    actor_id: null,
    city_id: city.id,
    action: 'classified.contact_seller',
    entity_type: 'classified',
    entity_id: parsed.classified_id,
    diff: { message_preview: parsed.message.slice(0, 120) },
  });
}

export async function requestClassifiedContactAction(input: unknown): Promise<ClassifiedContactResult> {
  const parsed = requestContactSchema.parse(input);
  const safeNextPath = safeInternalPath(parsed.nextPath, `/classificados/buscar`);
  const auth = await requireProfile(`/entrar?next=${encodeURIComponent(safeNextPath)}`);
  const city = await getCurrentCity();
  if (!city) throw new Error('Cidade atual não encontrada.');

  const supabase = await createClient();
  const { data: classified, error } = await supabase
    .from('classifieds')
    .select('id, city_id, slug, title, contact_name, contact_phone, contact_whatsapp')
    .eq('city_id', city.id)
    .eq('id', parsed.classifiedId)
    .eq('slug', parsed.classifiedSlug)
    .eq('status', 'published')
    .eq('review_status', 'approved')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  if (!classified) throw new Error('Classificado não encontrado ou indisponível.');

  await supabase.from('audit_log').insert({
    actor_id: auth.profile.id,
    city_id: city.id,
    action: 'classified.contact_reveal',
    entity_type: 'classified',
    entity_id: classified.id,
    diff: {
      title: classified.title,
      requester_profile_id: auth.profile.id,
    },
  });

  return {
    contactName: classified.contact_name,
    phoneUrl: phoneLink(classified.contact_phone),
    whatsappUrl: whatsappLink(classified.contact_whatsapp ?? classified.contact_phone),
  };
}

export async function resolveClassifiedReportAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const parsed = z.object({
    id: z.string().uuid(),
    status: z.enum(['reviewed', 'dismissed']),
  }).parse({
    id: formData.get('id'),
    status: formData.get('status'),
  });
  const supabase = await createClient();
  await supabase
    .from('classified_reports')
    .update({ status: parsed.status, reviewed_by: auth.profile.id, reviewed_at: new Date().toISOString() })
    .eq('id', parsed.id)
    .eq('city_id', city.id);
  revalidatePath('/painel/cidade/classificados/reports');
}

function safeInternalPath(value: string, fallback: string): string {
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (!value.startsWith('/classificados/')) return fallback;
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

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { notifyCityAdmins } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/server';

const reviewSchema = z.object({
  business_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).nullable(),
  comment: z.string().trim().max(2000).nullable(),
});

const reviewImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxReviewImageSize = 5 * 1024 * 1024;

function getReviewPhoto(formData: FormData): File | null {
  const value = formData.get('photo');
  if (!(value instanceof File) || value.size === 0) return null;
  if (!reviewImageTypes.has(value.type)) {
    throw new Error('Formato de imagem inválido.');
  }
  if (value.size > maxReviewImageSize) {
    throw new Error('A imagem deve ter até 5 MB.');
  }
  return value;
}

function extensionFor(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

const claimSchema = z.object({
  business_id: z.string().uuid(),
  whatsapp: z.string().trim().min(10).max(32),
  evidence_text: z.string().trim().min(10).max(2000),
});

const reportSchema = z.object({
  business_id: z.string().uuid(),
  reason: z.enum(['closed', 'outdated_info', 'wrong_contact', 'wrong_address', 'duplicate', 'inappropriate', 'other']),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value || null),
});

export async function createReviewAction(formData: FormData) {
  const [auth, city] = await Promise.all([requireProfile(), getCurrentCity()]);
  if (!city) return;

  const parsed = reviewSchema.parse({
    business_id: formData.get('business_id'),
    rating: formData.get('rating'),
    title: formData.get('title') || null,
    comment: formData.get('comment') || null,
  });
  const photo = getReviewPhoto(formData);
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug, cities(slug)')
    .eq('id', parsed.business_id)
    .eq('city_id', city.id)
    .single();
  if (!business) return;

  const { data: review, error } = await supabase
    .from('business_reviews')
    .upsert({
      business_id: parsed.business_id,
      author_profile_id: auth.profile.id,
      rating: parsed.rating,
      title: parsed.title,
      comment: parsed.comment,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error || !review) throw error;

  if (photo) {
    const citySlug = (business.cities as { slug?: string | null } | null)?.slug ?? city.slug;
    const path = `${citySlug}/reviews/${review.id}.${extensionFor(photo.type)}`;
    const { error: uploadError } = await supabase.storage.from('businesses').upload(path, photo, {
      contentType: photo.type,
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage.from('businesses').getPublicUrl(path);
    const { error: photoError } = await supabase
      .from('business_reviews')
      .update({ photo_url: publicUrl.publicUrl, status: 'pending' })
      .eq('id', review.id)
      .eq('author_profile_id', auth.profile.id);
    if (photoError) throw photoError;
  }

  await supabase.from('ai_jobs').insert({
    city_id: city.id,
    job_type: 'moderate_ugc',
    input_ref: { review_id: review.id, entity_type: 'business_review' },
  });
  await notifyCityAdmins({
    cityId: city.id,
    type: 'review.pending',
    priority: 'normal',
    title: 'Review de comércio aguardando moderação',
    body: parsed.title ?? parsed.comment ?? 'Uma nova avaliação foi enviada.',
    targetUrl: '/painel/cidade/comercio',
    entityType: 'business_review',
    entityId: review.id,
    metadata: { business_id: parsed.business_id },
  });

  revalidatePath(`/comercio/negocio/${business.slug}`);
}

export async function submitClaimAction(formData: FormData) {
  const [auth, city] = await Promise.all([requireProfile(), getCurrentCity()]);
  if (!city) return;

  const parsed = claimSchema.parse({
    business_id: formData.get('business_id'),
    whatsapp: formData.get('whatsapp'),
    evidence_text: formData.get('evidence_text'),
  });
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug')
    .eq('id', parsed.business_id)
    .eq('city_id', city.id)
    .single();
  if (!business) return;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ phone: parsed.whatsapp })
    .eq('id', auth.profile.id);
  if (profileError) throw profileError;

  const { error } = await supabase.from('business_claims').upsert({
    business_id: parsed.business_id,
    profile_id: auth.profile.id,
    evidence_text: `WhatsApp do solicitante: ${parsed.whatsapp}\n\n${parsed.evidence_text}`,
    evidence_url: null,
    status: 'pending',
  });
  if (error) throw error;
  await notifyCityAdmins({
    cityId: city.id,
    type: 'business_claim.pending',
    priority: 'high',
    title: 'Novo pedido de dono de página',
    body: `Pedido para reivindicar ${business.slug}.`,
    targetUrl: '/painel/cidade/comercio/claims',
    entityType: 'business_claim',
    entityId: parsed.business_id,
    metadata: { business_id: parsed.business_id, requester_profile_id: auth.profile.id },
  });

  revalidatePath(`/comercio/negocio/${business.slug}`);
  revalidatePath('/painel/cidade/comercio/claims');
}

export async function reportBusinessAction(formData: FormData) {
  const [auth, city] = await Promise.all([requireProfile(), getCurrentCity()]);
  if (!city) return;

  const parsed = reportSchema.parse({
    business_id: formData.get('business_id'),
    reason: formData.get('reason'),
    notes: formData.get('notes') || undefined,
  });
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug')
    .eq('id', parsed.business_id)
    .eq('city_id', city.id)
    .eq('status', 'published')
    .single();
  if (!business) return;

  const { error } = await supabase.from('business_reports').insert({
    city_id: city.id,
    business_id: parsed.business_id,
    reporter_profile_id: auth.profile.id,
    reason: parsed.reason,
    notes: parsed.notes,
  });
  if (error && error.code !== '23505') throw error;
  if (!error) {
    await notifyCityAdmins({
      cityId: city.id,
      type: 'business_report.received',
      priority: 'normal',
      title: 'Novo relato de erro em comércio',
      body: parsed.notes ?? `Motivo: ${parsed.reason}`,
      targetUrl: '/painel/cidade/comercio/reports',
      entityType: 'business_report',
      entityId: parsed.business_id,
      metadata: { business_id: parsed.business_id, reason: parsed.reason },
    });
  }

  revalidatePath(`/comercio/negocio/${business.slug}`);
  revalidatePath('/painel/cidade/comercio/reports');
}

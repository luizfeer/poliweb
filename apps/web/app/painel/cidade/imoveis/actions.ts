'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createNotification } from '@/lib/notifications';
import { notifyPropertyReviewDecision } from '@/lib/real-estate/notifications';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';

const propertyIdSchema = z.object({
  propertyId: z.string().uuid(),
});

const decisionSchema = propertyIdSchema.extend({
  reason: z.string().max(1000).optional().or(z.literal('')),
});

const featureSchema = propertyIdSchema.extend({
  durationDays: z.coerce.number().int().min(1).max(365),
});

export async function approvePropertyAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = propertyIdSchema.parse({ propertyId: formData.get('property_id') });
  const supabase = await createClient();

  const { data: property } = await supabase
    .from('properties')
    .select('id, title, owner_profile_id')
    .eq('city_id', city.id)
    .eq('id', parsed.propertyId)
    .maybeSingle();

  await supabase
    .from('properties')
    .update({
      review_status: 'approved',
      status: 'published',
      rejection_reason: null,
      review_decided_by_profile_id: auth.profile.id,
      review_decided_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      expires_at: dateAfterDays(90),
    })
    .eq('city_id', city.id)
    .eq('id', parsed.propertyId);

  await writeAudit('real_estate.property.approved', city.id, auth.profile.id, parsed.propertyId);
  if (property) {
    if (property.owner_profile_id) {
      await createNotification({
        recipientProfileId: property.owner_profile_id,
        cityId: city.id,
        type: 'approval.approved',
        priority: 'normal',
        title: 'Imóvel aprovado',
        body: property.title,
        targetUrl: '/painel/imobiliaria/imoveis',
        entityType: 'property',
        entityId: parsed.propertyId,
      });
    }
    await notifyPropertyReviewDecision({ propertyTitle: property.title, decision: 'approved' });
  }

  revalidateAdminPaths();
}

export async function rejectPropertyAction(formData: FormData) {
  await decideProperty(formData, 'rejected');
}

export async function requestChangesAction(formData: FormData) {
  await decideProperty(formData, 'needs_changes');
}

export async function featurePropertyAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = featureSchema.parse({
    propertyId: formData.get('property_id'),
    durationDays: formData.get('duration_days'),
  });

  const supabase = await createClient();
  await supabase
    .from('properties')
    .update({
      featured: true,
      featured_until: dateAfterDays(parsed.durationDays),
    })
    .eq('city_id', city.id)
    .eq('id', parsed.propertyId);

  await writeAudit('real_estate.property.featured', city.id, auth.profile.id, parsed.propertyId, {
    duration_days: parsed.durationDays,
  });
  revalidateAdminPaths();
}

export async function waivePaymentAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = decisionSchema.parse({
    propertyId: formData.get('property_id'),
    reason: formData.get('reason') ?? '',
  });

  const supabase = await createClient();
  await supabase
    .from('properties')
    .update({ payment_status: 'waived' })
    .eq('city_id', city.id)
    .eq('id', parsed.propertyId);

  await writeAudit('real_estate.payment.waived', city.id, auth.profile.id, parsed.propertyId, {
    reason: parsed.reason || null,
  });
  revalidateAdminPaths();
}

async function decideProperty(formData: FormData, decision: 'rejected' | 'needs_changes') {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = decisionSchema.parse({
    propertyId: formData.get('property_id'),
    reason: formData.get('reason') ?? '',
  });
  const supabase = await createClient();

  const { data: property } = await supabase
    .from('properties')
    .select('id, title, owner_profile_id')
    .eq('city_id', city.id)
    .eq('id', parsed.propertyId)
    .maybeSingle();

  await supabase
    .from('properties')
    .update({
      review_status: decision,
      status: 'rejected',
      rejection_reason: parsed.reason || null,
      review_decided_by_profile_id: auth.profile.id,
      review_decided_at: new Date().toISOString(),
    })
    .eq('city_id', city.id)
    .eq('id', parsed.propertyId);

  await writeAudit(`real_estate.property.${decision}`, city.id, auth.profile.id, parsed.propertyId, {
    reason: parsed.reason || null,
  });
  if (property) {
    if (property.owner_profile_id) {
      await createNotification({
        recipientProfileId: property.owner_profile_id,
        cityId: city.id,
        type: decision === 'needs_changes' ? 'approval.needs_changes' : 'approval.rejected',
        priority: 'normal',
        title: decision === 'needs_changes' ? 'Imóvel precisa de ajustes' : 'Imóvel recusado',
        body: parsed.reason || property.title,
        targetUrl: '/painel/imobiliaria/imoveis',
        entityType: 'property',
        entityId: parsed.propertyId,
      });
    }
    await notifyPropertyReviewDecision({
      propertyTitle: property.title,
      decision,
      reason: parsed.reason || undefined,
    });
  }

  revalidateAdminPaths();
}

async function writeAudit(
  action: string,
  cityId: string,
  actorId: string,
  propertyId: string,
  diff?: Record<string, Json | undefined>,
) {
  const supabase = await createClient();
  await supabase.from('audit_log').insert({
    actor_id: actorId,
    city_id: cityId,
    action,
    entity_type: 'property',
    entity_id: propertyId,
    diff: diff ?? {},
  });
}

function dateAfterDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function revalidateAdminPaths() {
  revalidatePath('/painel/cidade/imoveis');
  revalidatePath('/painel/cidade/imoveis/aprovacao');
  revalidatePath('/imoveis');
}

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createNotification } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { validityDaysForType, dateAfterDays } from '@/lib/classifieds/pricing';
import type { ClassifiedType } from '@/lib/classifieds/types';

const decisionSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().max(1000).optional().or(z.literal('')),
});

export async function approveClassifiedAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const { id } = decisionSchema.parse({ id: formData.get('id') });
  const supabase = await createClient();
  const { data } = await supabase
    .from('classifieds')
    .select('type, title, author_profile_id')
    .eq('city_id', city.id)
    .eq('id', id)
    .maybeSingle();

  await supabase
    .from('classifieds')
    .update({
      review_status: 'approved',
      status: 'published',
      rejection_reason: null,
      review_decided_by_profile_id: auth.profile.id,
      review_decided_at: new Date().toISOString(),
      expires_at: dateAfterDays(validityDaysForType((data?.type ?? 'item') as ClassifiedType)),
    })
    .eq('city_id', city.id)
    .eq('id', id);

  await writeAudit('classified.approve', city.id, auth.profile.id, id, {});
  if (data?.author_profile_id) {
    await createNotification({
      recipientProfileId: data.author_profile_id,
      cityId: city.id,
      type: 'approval.approved',
      priority: 'normal',
      title: 'Classificado aprovado',
      body: data.title,
      targetUrl: '/painel/cidadao/classificados',
      entityType: 'classified',
      entityId: id,
    });
  }
  revalidateClassifiedAdminPaths();
}

export async function rejectClassifiedAction(formData: FormData) {
  await decideClassified(formData, 'rejected', 'rejected', 'classified.reject');
}

export async function requestChangesAction(formData: FormData) {
  await decideClassified(formData, 'needs_changes', 'draft', 'classified.request_changes');
}

export async function unpublishClassifiedAction(formData: FormData) {
  await decideClassified(formData, 'pending', 'archived', 'classified.unpublish');
}

export async function banAuthorAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = z.object({
    profile_id: z.string().uuid(),
    reason: z.string().trim().min(3).max(1000),
  }).parse({
    profile_id: formData.get('profile_id'),
    reason: formData.get('reason'),
  });
  await writeAudit('classified.author.ban_requested', city.id, auth.profile.id, parsed.profile_id, {
    reason: parsed.reason,
  });
  revalidateClassifiedAdminPaths();
}

async function decideClassified(
  formData: FormData,
  reviewStatus: 'pending' | 'rejected' | 'needs_changes',
  status: 'draft' | 'rejected' | 'archived',
  action: string,
) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const parsed = decisionSchema.parse({
    id: formData.get('id'),
    reason: formData.get('reason') ?? '',
  });
  const supabase = await createClient();
  const { data } = await supabase
    .from('classifieds')
    .select('title, author_profile_id')
    .eq('city_id', city.id)
    .eq('id', parsed.id)
    .maybeSingle();
  await supabase
    .from('classifieds')
    .update({
      review_status: reviewStatus,
      status,
      rejection_reason: parsed.reason || null,
      review_decided_by_profile_id: auth.profile.id,
      review_decided_at: new Date().toISOString(),
    })
    .eq('city_id', city.id)
    .eq('id', parsed.id);

  await writeAudit(action, city.id, auth.profile.id, parsed.id, { reason: parsed.reason || null });
  if (data?.author_profile_id) {
    await createNotification({
      recipientProfileId: data.author_profile_id,
      cityId: city.id,
      type: reviewStatus === 'needs_changes' ? 'approval.needs_changes' : 'approval.rejected',
      priority: 'normal',
      title: reviewStatus === 'needs_changes' ? 'Classificado precisa de ajustes' : 'Classificado recusado',
      body: parsed.reason || data.title,
      targetUrl: '/painel/cidadao/classificados',
      entityType: 'classified',
      entityId: parsed.id,
    });
  }
  revalidateClassifiedAdminPaths();
}

async function writeAudit(action: string, cityId: string, actorId: string, entityId: string, diff: Record<string, Json | null>) {
  const supabase = await createClient();
  await supabase.from('audit_log').insert({
    actor_id: actorId,
    city_id: cityId,
    action,
    entity_type: 'classified',
    entity_id: entityId,
    diff,
  });
}

function revalidateClassifiedAdminPaths() {
  revalidatePath('/classificados');
  revalidatePath('/painel/cidade/classificados');
  revalidatePath('/painel/cidade/classificados/aprovacao');
  revalidatePath('/painel/cidade/classificados/reports');
}

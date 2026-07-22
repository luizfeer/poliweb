import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { CreateNotificationInput, NotificationRow, NotifyCityAdminsInput } from './types';

export async function createNotification(input: CreateNotificationInput): Promise<string | null> {
  assertInternalTargetUrl(input.targetUrl);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_notification', {
    p_recipient_profile_id: input.recipientProfileId,
    p_city_id: input.cityId,
    p_audience: input.audience ?? 'user',
    p_type: input.type,
    p_priority: input.priority ?? 'normal',
    p_title: input.title,
    p_body: input.body ?? '',
    p_target_url: input.targetUrl,
    p_metadata: input.metadata ?? {},
    p_send_email: input.sendEmail ?? false,
    ...(input.entityType ? { p_entity_type: input.entityType } : {}),
    ...(input.entityId ? { p_entity_id: input.entityId } : {}),
    ...(input.pushPayload ? { p_push_payload: input.pushPayload } : {}),
  });
  if (error) throw error;

  // Quando sendEmail=true o RPC já enfileira uma linha em
  // notification_deliveries com status='pending' e provider='brevo'.
  // O worker (apps/email-worker) faz o envio assíncrono via Brevo.

  return data ? String(data) : null;
}

export async function notifyCityAdmins(input: NotifyCityAdminsInput): Promise<number> {
  assertInternalTargetUrl(input.targetUrl);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('notify_city_admins', {
    p_city_id: input.cityId,
    p_type: input.type,
    p_priority: input.priority ?? 'normal',
    p_title: input.title,
    p_body: input.body ?? '',
    p_target_url: input.targetUrl,
    p_metadata: input.metadata ?? {},
    p_send_email: input.sendEmail ?? false,
    ...(input.entityType ? { p_entity_type: input.entityType } : {}),
    ...(input.entityId ? { p_entity_id: input.entityId } : {}),
    ...(input.pushPayload ? { p_push_payload: input.pushPayload } : {}),
  });
  if (error) throw error;
  return data ?? 0;
}

export async function notifyEntityManagers(entityType: string, entityId: string, input: Omit<CreateNotificationInput, 'recipientProfileId'>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('entity_managers')
    .select('profile_id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);
  if (error) throw error;

  const recipientIds = new Set((data ?? []).map((row) => row.profile_id));
  await Promise.all(
    [...recipientIds].map((recipientProfileId) =>
      createNotification({
        ...input,
        recipientProfileId,
        entityType: input.entityType ?? entityType,
        entityId: input.entityId ?? entityId,
      }),
    ),
  );
}

export async function getUnreadNotificationCount(profileId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_profile_id', profileId)
    .is('read_at', null)
    .is('archived_at', null);
  if (error) throw error;
  return count ?? 0;
}

export async function listNotifications(profileId: string, filter?: string): Promise<NotificationRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('recipient_profile_id', profileId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(80);

  if (filter === 'nao-lidas') query = query.is('read_at', null);
  if (filter === 'aprovacoes') query = query.like('type', 'approval.%');
  if (filter === 'comentarios') query = query.in('type', ['comment.received', 'review.pending', 'photo.pending']);
  if (filter === 'leads') query = query.eq('type', 'lead.received');

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listAdminNotifications(cityId: string, profileId: string, filter?: string): Promise<NotificationRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('city_id', cityId)
    .eq('recipient_profile_id', profileId)
    .eq('audience', 'city_admin')
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(120);

  if (filter === 'nao-lidas') query = query.is('read_at', null);
  if (filter === 'lead') query = query.eq('type', 'lead.received');
  if (filter === 'aprovacao') query = query.or('type.eq.approval.pending,type.like.approval.%');
  if (filter === 'ugc') query = query.in('type', ['comment.received', 'review.pending', 'photo.pending']);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

function assertInternalTargetUrl(targetUrl: string) {
  if (!targetUrl.startsWith('/') || targetUrl.startsWith('//')) {
    throw new Error('targetUrl deve ser um caminho interno.');
  }
}

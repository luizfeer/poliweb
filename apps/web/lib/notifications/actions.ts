'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const idSchema = z.object({
  notificationId: z.string().uuid(),
});

export async function markNotificationReadAction(formData: FormData) {
  const auth = await requireProfile();
  const parsed = idSchema.parse({ notificationId: formData.get('notification_id') });
  const supabase = await createClient();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', parsed.notificationId)
    .eq('recipient_profile_id', auth.profile.id);
  revalidatePath('/painel');
  revalidatePath('/painel/notificacoes');
  revalidatePath('/painel/cidade/notificacoes');
}

export async function archiveNotificationAction(formData: FormData) {
  const auth = await requireProfile();
  const parsed = idSchema.parse({ notificationId: formData.get('notification_id') });
  const supabase = await createClient();
  await supabase
    .from('notifications')
    .update({ archived_at: new Date().toISOString(), read_at: new Date().toISOString() })
    .eq('id', parsed.notificationId)
    .eq('recipient_profile_id', auth.profile.id);
  revalidatePath('/painel');
  revalidatePath('/painel/notificacoes');
}

export async function markAllNotificationsReadAction() {
  const auth = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_profile_id', auth.profile.id)
    .is('read_at', null)
    .is('archived_at', null);
  revalidatePath('/painel');
  revalidatePath('/painel/notificacoes');
}

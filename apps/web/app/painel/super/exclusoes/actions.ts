'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const idSchema = z.string().uuid();

export async function approveDeletionAction(formData: FormData) {
  await requireRole({ kinds: ['super_admin'] });
  const id = idSchema.parse(formData.get('request_id'));
  const notes = (formData.get('notes') as string | null)?.trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.rpc('approve_account_deletion', {
    p_request_id: id,
    p_notes: notes ?? undefined,
  });

  revalidatePath('/painel/super/exclusoes');
  redirect(
    error
      ? `/painel/super/exclusoes?msg=erro`
      : `/painel/super/exclusoes?msg=aprovado`,
  );
}

export async function rejectDeletionAction(formData: FormData) {
  await requireRole({ kinds: ['super_admin'] });
  const id = idSchema.parse(formData.get('request_id'));
  const notes = z.string().min(3).max(1000).parse(formData.get('notes'));

  const supabase = await createClient();
  const { error } = await supabase.rpc('reject_account_deletion', {
    p_request_id: id,
    p_notes: notes,
  });

  revalidatePath('/painel/super/exclusoes');
  redirect(
    error
      ? `/painel/super/exclusoes?msg=erro`
      : `/painel/super/exclusoes?msg=rejeitado`,
  );
}

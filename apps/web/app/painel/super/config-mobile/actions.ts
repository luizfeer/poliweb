'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(2).max(120).regex(/^[A-Z0-9_]+$/, 'use UPPER_SNAKE_CASE'),
  value: z.string().max(4096),
  description: z.string().max(500).optional().nullable(),
});

export async function upsertMobileConfigAction(formData: FormData) {
  const { profile } = await requireRole({ kinds: ['super_admin'] });
  const parsed = upsertSchema.parse({
    id: formData.get('id') || undefined,
    key: formData.get('key'),
    value: formData.get('value') ?? '',
    description: formData.get('description') || null,
  });

  const supabase = await createClient();
  if (parsed.id) {
    await supabase
      .from('mobile_config')
      .update({
        key: parsed.key,
        value: parsed.value,
        description: parsed.description,
        updated_by: profile.id,
      })
      .eq('id', parsed.id);
  } else {
    await supabase
      .from('mobile_config')
      .upsert(
        {
          key: parsed.key,
          value: parsed.value,
          description: parsed.description,
          updated_by: profile.id,
        },
        { onConflict: 'key' },
      );
  }
  revalidatePath('/painel/super/config-mobile');
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function deleteMobileConfigAction(formData: FormData) {
  await requireRole({ kinds: ['super_admin'] });
  const { id } = deleteSchema.parse({ id: formData.get('id') });
  const supabase = await createClient();
  await supabase.from('mobile_config').delete().eq('id', id);
  revalidatePath('/painel/super/config-mobile');
}

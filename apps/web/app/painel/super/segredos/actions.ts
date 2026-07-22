'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { encryptSecret, invalidateSecret } from '@/lib/secrets/vault';
import { createClient } from '@/lib/supabase/server';

const upsertSchema = z.object({
  key: z.string().min(2).max(120).regex(/^[A-Z0-9_]+$/, 'use UPPER_SNAKE_CASE'),
  value: z.string().min(1).max(8192),
  scope: z.enum(['global', 'city']).default('global'),
  city_id: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

export async function upsertSecretAction(formData: FormData) {
  const { profile } = await requireRole({ kinds: ['super_admin'] });
  const parsed = upsertSchema.parse({
    key: formData.get('key'),
    value: formData.get('value'),
    scope: formData.get('scope') || 'global',
    city_id: formData.get('city_id') || null,
    description: formData.get('description') || null,
  });

  if (parsed.scope === 'city' && !parsed.city_id) {
    throw new Error('city_id obrigatorio para escopo city.');
  }

  const { ciphertext, nonce } = encryptSecret(parsed.value);
  const supabase = await createClient();

  const cityId = parsed.scope === 'global' ? null : parsed.city_id ?? null;
  const existingQuery = supabase
    .from('app_secrets')
    .select('id')
    .eq('key', parsed.key)
    .eq('scope', parsed.scope);
  const { data: existing } = await (cityId
    ? existingQuery.eq('city_id', cityId)
    : existingQuery.is('city_id', null)
  ).maybeSingle();

  if (existing) {
    await supabase
      .from('app_secrets')
      .update({
        ciphertext,
        nonce,
        description: parsed.description,
        rotated_by: profile.id,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('app_secrets').insert({
      key: parsed.key,
      ciphertext,
      nonce,
      scope: parsed.scope,
      city_id: cityId,
      description: parsed.description,
      created_by: profile.id,
    });
  }

  invalidateSecret(parsed.key, cityId);
  revalidatePath('/painel/super/segredos');
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function deleteSecretAction(formData: FormData) {
  await requireRole({ kinds: ['super_admin'] });
  const { id } = deleteSchema.parse({ id: formData.get('id') });
  const supabase = await createClient();
  const { data } = await supabase.from('app_secrets').select('key, city_id').eq('id', id).maybeSingle();
  await supabase.from('app_secrets').delete().eq('id', id);
  if (data) invalidateSecret(data.key, data.city_id);
  revalidatePath('/painel/super/segredos');
}

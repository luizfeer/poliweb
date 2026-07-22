'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const channelEnum = z.enum(['production', 'preview', 'development']);

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  channel: channelEnum,
  label: z.string().min(2).max(80),
  url: z.string().url().max(500),
  runtime_version: z.string().max(40).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  priority: z.coerce.number().int().min(0).max(1000).default(0),
  is_active: z.coerce.boolean().default(true),
});

export async function upsertUpdateChannelAction(formData: FormData) {
  const { profile } = await requireRole({ kinds: ['super_admin'] });
  const parsed = upsertSchema.parse({
    id: formData.get('id') || undefined,
    channel: formData.get('channel'),
    label: formData.get('label'),
    url: formData.get('url'),
    runtime_version: formData.get('runtime_version') || null,
    description: formData.get('description') || null,
    priority: formData.get('priority') || 0,
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
  });

  const supabase = await createClient();

  if (parsed.id) {
    await supabase
      .from('mobile_update_channels')
      .update({
        channel: parsed.channel,
        label: parsed.label,
        url: parsed.url,
        runtime_version: parsed.runtime_version,
        description: parsed.description,
        priority: parsed.priority,
        is_active: parsed.is_active,
      })
      .eq('id', parsed.id);
  } else {
    await supabase.from('mobile_update_channels').insert({
      channel: parsed.channel,
      label: parsed.label,
      url: parsed.url,
      runtime_version: parsed.runtime_version,
      description: parsed.description,
      priority: parsed.priority,
      is_active: parsed.is_active,
      created_by: profile.id,
    });
  }

  revalidatePath('/painel/super/atualizacoes-mobile');
}

const promoteSchema = z.object({ id: z.string().uuid() });

export async function promoteChannelAction(formData: FormData) {
  await requireRole({ kinds: ['super_admin'] });
  const { id } = promoteSchema.parse({ id: formData.get('id') });
  const supabase = await createClient();

  const { data: target } = await supabase
    .from('mobile_update_channels')
    .select('channel')
    .eq('id', id)
    .maybeSingle();
  if (!target) return;

  await supabase
    .from('mobile_update_channels')
    .update({ is_primary: false })
    .eq('channel', target.channel);

  await supabase
    .from('mobile_update_channels')
    .update({ is_primary: true, is_active: true })
    .eq('id', id);

  revalidatePath('/painel/super/atualizacoes-mobile');
}

const toggleSchema = z.object({ id: z.string().uuid(), is_active: z.coerce.boolean() });

export async function toggleChannelAction(formData: FormData) {
  await requireRole({ kinds: ['super_admin'] });
  const { id, is_active } = toggleSchema.parse({
    id: formData.get('id'),
    is_active: formData.get('is_active'),
  });
  const supabase = await createClient();
  await supabase.from('mobile_update_channels').update({ is_active }).eq('id', id);
  revalidatePath('/painel/super/atualizacoes-mobile');
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function deleteChannelAction(formData: FormData) {
  await requireRole({ kinds: ['super_admin'] });
  const { id } = deleteSchema.parse({ id: formData.get('id') });
  const supabase = await createClient();
  await supabase.from('mobile_update_channels').delete().eq('id', id);
  revalidatePath('/painel/super/atualizacoes-mobile');
}

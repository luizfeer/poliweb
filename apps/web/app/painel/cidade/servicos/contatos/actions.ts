'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { insertUtilityAudit } from '../_audit';

const contactSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  category: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  phone: z.string().min(2).max(40),
  email: z.string().email().max(160).nullable(),
  address: z.string().max(200).nullable(),
  whatsapp: z.string().max(40).nullable(),
  short_dial: z.string().max(20).nullable(),
  description: z.string().max(300).nullable(),
  when_to_use: z.string().max(500).nullable(),
  hours_legacy_text: z.string().max(120).nullable(),
  source_type: z.string().min(2).max(40).default('oficial'),
  tags: z.array(z.string().min(1).max(60)).default([]),
  needs_verification: z.boolean(),
  note: z.string().max(500).nullable(),
  last_verified_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  display_order: z.coerce.number().int().default(0),
  active: z.boolean(),
});

function value(formData: FormData, key: string): string | null {
  const text = String(formData.get(key) ?? '').trim();
  return text ? text : null;
}

export async function upsertEmergencyContactAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = contactSchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    category: formData.get('category'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: value(formData, 'email'),
    address: value(formData, 'address'),
    whatsapp: value(formData, 'whatsapp'),
    short_dial: value(formData, 'short_dial'),
    description: value(formData, 'description'),
    when_to_use: value(formData, 'when_to_use'),
    hours_legacy_text: value(formData, 'hours_legacy_text'),
    source_type: formData.get('source_type') || 'oficial',
    tags: String(formData.get('tags') ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    needs_verification: formData.get('needs_verification') === 'on',
    note: value(formData, 'note'),
    last_verified_at: value(formData, 'last_verified_at'),
    display_order: formData.get('display_order') || 0,
    active: formData.get('active') === 'on',
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const { data, error } = await supabase.from('emergency_contacts').upsert(parsed).select('id').single();
  if (error || !data) throw error;

  await insertUtilityAudit('utilities.contact.upsert', city.id, 'emergency_contact', data.id, parsed as Json);
  revalidatePath('/painel/cidade/servicos/contatos');
  revalidatePath('/servicos/telefones');
}

export async function reorderEmergencyContactsAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = z
    .object({
      city_id: z.string().uuid(),
      ordered_ids: z.string().transform((value) => value.split(',').map((id) => id.trim()).filter(Boolean)).pipe(z.array(z.string().uuid())),
    })
    .parse({
      city_id: formData.get('city_id'),
      ordered_ids: formData.get('ordered_ids'),
    });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  await Promise.all(
    parsed.ordered_ids.map((id, index) =>
      supabase.from('emergency_contacts').update({ display_order: index * 10 }).eq('id', id).eq('city_id', city.id),
    ),
  );
  await insertUtilityAudit('utilities.contact.reorder', city.id, 'emergency_contact', null, parsed as Json);
  revalidatePath('/painel/cidade/servicos/contatos');
  revalidatePath('/servicos/telefones');
}

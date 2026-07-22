'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { insertUtilityAudit } from '../_audit';

const alertSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  type: z.enum(['water', 'energy', 'traffic', 'weather', 'security', 'health']),
  severity: z.enum(['info', 'warning', 'critical']),
  title: z.string().min(2).max(180),
  description: z.string().max(1200).nullable(),
  affected_area: z.string().max(240).nullable(),
  affected_district_ids: z.array(z.string().uuid()),
  start_at: z.string().min(1),
  end_at: z.string().nullable(),
  source: z.string().max(80).nullable(),
  source_url: z.string().url().max(500).nullable(),
  active: z.boolean(),
});

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? '').trim();
  return value ? value : null;
}

function ids(formData: FormData): string[] {
  return formData
    .getAll('affected_district_ids')
    .map(String)
    .filter(Boolean);
}

export async function upsertAlertAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = alertSchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    type: formData.get('type'),
    severity: formData.get('severity'),
    title: formData.get('title'),
    description: text(formData, 'description'),
    affected_area: text(formData, 'affected_area'),
    affected_district_ids: ids(formData),
    start_at: formData.get('start_at'),
    end_at: text(formData, 'end_at'),
    source: text(formData, 'source'),
    source_url: text(formData, 'source_url'),
    active: formData.get('active') !== 'off',
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const { data, error } = await supabase.from('service_alerts').upsert(parsed).select('id').single();
  if (error || !data) throw error;

  await insertUtilityAudit('utilities.alert.upsert', city.id, 'service_alert', data.id, parsed as Json);
  revalidatePath('/painel/cidade/servicos/alertas');
  revalidatePath('/servicos');
  revalidatePath('/servicos/alertas');
}

export async function closeAlertAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const id = z.string().uuid().parse(formData.get('id'));
  const supabase = await createClient();
  const { error } = await supabase
    .from('service_alerts')
    .update({ active: false, end_at: new Date().toISOString() })
    .eq('id', id)
    .eq('city_id', city.id);
  if (error) throw error;

  await insertUtilityAudit('utilities.alert.close', city.id, 'service_alert', id, {});
  revalidatePath('/painel/cidade/servicos/alertas');
  revalidatePath('/servicos');
  revalidatePath('/servicos/alertas');
}

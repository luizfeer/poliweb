'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { insertUtilityAudit } from '../_audit';

const nullableTime = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .nullable();

const garbageSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  district_id: z.string().uuid(),
  type: z.enum(['common', 'recyclable', 'organic', 'electronic', 'special']),
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: nullableTime,
  end_time: nullableTime,
  notes: z.string().max(300).nullable(),
  active: z.boolean(),
});

const csvSchema = z.object({
  city_id: z.string().uuid(),
  csv: z.string().min(1),
});

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export async function upsertGarbageScheduleAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = garbageSchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    district_id: formData.get('district_id'),
    type: formData.get('type'),
    day_of_week: formData.get('day_of_week'),
    start_time: emptyToNull(formData.get('start_time')),
    end_time: emptyToNull(formData.get('end_time')),
    notes: emptyToNull(formData.get('notes')),
    active: formData.get('active') !== 'off',
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const { data, error } = await supabase.from('garbage_schedules').upsert(parsed).select('id').single();
  if (error || !data) throw error;

  await insertUtilityAudit('utilities.garbage.upsert', city.id, 'garbage_schedule', data.id, parsed as Json);
  revalidatePath('/painel/cidade/servicos/coleta');
  revalidatePath('/servicos/coleta');
}

export async function deleteGarbageScheduleAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const id = z.string().uuid().parse(formData.get('id'));
  const supabase = await createClient();
  const { error } = await supabase.from('garbage_schedules').delete().eq('id', id).eq('city_id', city.id);
  if (error) throw error;

  await insertUtilityAudit('utilities.garbage.delete', city.id, 'garbage_schedule', id, {});
  revalidatePath('/painel/cidade/servicos/coleta');
  revalidatePath('/servicos/coleta');
}

export async function bulkImportGarbageAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = csvSchema.parse({
    city_id: formData.get('city_id'),
    csv: formData.get('csv'),
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const { data: districts } = await supabase.from('districts').select('id, slug, name').eq('city_id', city.id);
  const bySlug = new Map((districts ?? []).map((district) => [district.slug, district.id]));
  const byName = new Map((districts ?? []).map((district) => [district.name.toLowerCase(), district.id]));

  const rows = parsed.csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)
    .map(parseCsvLine)
    .map(([district, type, day, start, end, notes]) => {
      const districtId = bySlug.get(district) ?? byName.get(district.toLowerCase());
      if (!districtId) return null;
      return garbageSchema.parse({
        city_id: city.id,
        district_id: districtId,
        type,
        day_of_week: day,
        start_time: start || null,
        end_time: end || null,
        notes: notes || null,
        active: true,
      });
    })
    .filter((row): row is z.infer<typeof garbageSchema> => Boolean(row));

  if (rows.length > 0) {
    const { error } = await supabase.from('garbage_schedules').upsert(rows);
    if (error) throw error;
  }

  await insertUtilityAudit('utilities.garbage.bulk_import', city.id, 'garbage_schedule', null, { count: rows.length });
  revalidatePath('/painel/cidade/servicos/coleta');
  revalidatePath('/servicos/coleta');
}

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { insertUtilityAudit } from '../_audit';

const pharmacySchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  name: z.string().min(2).max(160),
  address: z.string().max(240).nullable(),
  phone: z.string().max(40).nullable(),
  whatsapp: z.string().max(40).nullable(),
  is_24h: z.boolean(),
  lat: z.coerce.number().nullable(),
  lng: z.coerce.number().nullable(),
  google_maps_url: z.string().url().max(500).nullable(),
  active: z.boolean(),
});

const shiftSchema = z.object({
  id: z.string().uuid().optional(),
  pharmacy_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shift_type: z.enum(['plantao_24h', 'noturno']),
  notes: z.string().max(300).nullable(),
});

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? '').trim();
  return value ? value : null;
}

function numeric(formData: FormData, key: string): number | null {
  const value = text(formData, key);
  return value ? Number(value) : null;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else current += char;
  }
  values.push(current.trim());
  return values;
}

async function assertPharmacyInCity(pharmacyId: string, cityId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('pharmacies').select('id').eq('id', pharmacyId).eq('city_id', cityId).maybeSingle();
  return Boolean(data);
}

export async function upsertPharmacyAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = pharmacySchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    name: formData.get('name'),
    address: text(formData, 'address'),
    phone: text(formData, 'phone'),
    whatsapp: text(formData, 'whatsapp'),
    is_24h: formData.get('is_24h') === 'on',
    lat: numeric(formData, 'lat'),
    lng: numeric(formData, 'lng'),
    google_maps_url: text(formData, 'google_maps_url'),
    active: formData.get('active') !== 'off',
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const { data, error } = await supabase.from('pharmacies').upsert(parsed).select('id').single();
  if (error || !data) throw error;

  await insertUtilityAudit('utilities.pharmacy.upsert', city.id, 'pharmacy', data.id, parsed as Json);
  revalidatePath('/painel/cidade/servicos/farmacias');
  revalidatePath('/servicos/farmacias');
}

export async function upsertPharmacyShiftAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = shiftSchema.parse({
    id: formData.get('id') || undefined,
    pharmacy_id: formData.get('pharmacy_id'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    shift_type: formData.get('shift_type'),
    notes: text(formData, 'notes'),
  });
  if (parsed.end_date < parsed.start_date) throw new Error('Data final precisa ser igual ou posterior a inicial.');
  if (!(await assertPharmacyInCity(parsed.pharmacy_id, city.id))) return;

  const supabase = await createClient();
  const { data: overlap } = await supabase
    .from('pharmacy_shifts')
    .select('id')
    .eq('pharmacy_id', parsed.pharmacy_id)
    .eq('shift_type', parsed.shift_type)
    .lte('start_date', parsed.end_date)
    .gte('end_date', parsed.start_date)
    .neq('id', parsed.id ?? '00000000-0000-0000-0000-000000000000')
    .limit(1);
  if ((overlap ?? []).length > 0) {
    throw new Error('Já existe plantão do mesmo tipo nesse período para esta farmácia.');
  }

  const { data, error } = await supabase.from('pharmacy_shifts').upsert(parsed).select('id').single();
  if (error || !data) throw error;

  await insertUtilityAudit('utilities.pharmacy_shift.upsert', city.id, 'pharmacy_shift', data.id, parsed as Json);
  revalidatePath('/painel/cidade/servicos/farmacias');
  revalidatePath(`/painel/cidade/servicos/farmacias/${parsed.pharmacy_id}/plantao`);
  revalidatePath('/servicos/farmacias');
}

export async function bulkImportShiftsAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = z.object({ city_id: z.string().uuid(), csv: z.string().min(1) }).parse({
    city_id: formData.get('city_id'),
    csv: formData.get('csv'),
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const { data: pharmacies } = await supabase.from('pharmacies').select('id, name').eq('city_id', city.id);
  const byName = new Map((pharmacies ?? []).map((pharmacy) => [pharmacy.name.toLowerCase(), pharmacy.id]));

  const rows = parsed.csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)
    .map(parseCsvLine)
    .map(([pharmacyName, startDate, endDate, shiftType, notes]) => {
      const pharmacyId = byName.get(pharmacyName.toLowerCase());
      if (!pharmacyId) return null;
      return shiftSchema.parse({
        pharmacy_id: pharmacyId,
        start_date: startDate,
        end_date: endDate,
        shift_type: shiftType || 'plantao_24h',
        notes: notes || null,
      });
    })
    .filter((row): row is z.infer<typeof shiftSchema> => Boolean(row));

  if (rows.length > 0) {
    const { error } = await supabase.from('pharmacy_shifts').upsert(rows);
    if (error) throw error;
  }

  await insertUtilityAudit('utilities.pharmacy_shift.bulk_import', city.id, 'pharmacy_shift', null, { count: rows.length });
  revalidatePath('/painel/cidade/servicos/farmacias');
  revalidatePath('/servicos/farmacias');
}

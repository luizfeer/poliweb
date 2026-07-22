'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { insertUtilityAudit } from '../_audit';

const slugRegex = /^[a-z0-9-]+$/;

const routeSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  slug: z.string().min(2).max(120).regex(slugRegex, 'Slug deve conter apenas letras minúsculas, números e hífen'),
  name: z.string().min(2).max(160),
  short_name: z.string().max(80).nullable(),
  region: z.string().max(80).nullable(),
  district: z.string().max(80).nullable(),
  status: z.enum(['active', 'active_check_before_go', 'schedule_missing', 'suspended', 'inactive']),
  confidence: z.enum(['high', 'medium', 'low', 'route_confirmed_schedule_missing']),
  description: z.string().max(2000).nullable(),
  fare_summary: z.string().max(800).nullable(),
  fare_warning: z.string().max(400).nullable(),
  endpoint_a_label: z.string().max(80).nullable(),
  endpoint_b_label: z.string().max(80).nullable(),
  related_cities: z.string().max(1000).nullable(),
  operating_days: z.string().max(1000).nullable(),
  source_json: z.string().max(4000).nullable(),
  featured: z.boolean(),
  active: z.boolean(),
  display_order: z.coerce.number().int().default(0),
  important_info: z.string().max(4000).nullable(),
  fare_json: z.string().max(8000).nullable(),
});

const scheduleSchema = z.object({
  id: z.string().uuid().optional(),
  route_id: z.string().uuid(),
  city_id: z.string().uuid(),
  direction: z.string().min(1).max(120),
  origin: z.string().max(120).nullable(),
  destination: z.string().max(120).nullable(),
  departs_at: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato HH:MM'),
  notes: z.string().max(400).nullable(),
  active: z.boolean(),
});

const alertSchema = z.object({
  id: z.string().uuid().optional(),
  route_id: z.string().uuid(),
  city_id: z.string().uuid(),
  type: z.enum(['info', 'warning', 'maintenance', 'event', 'safety']),
  title: z.string().min(2).max(160),
  message: z.string().min(2).max(800),
  active: z.boolean(),
});

function v(formData: FormData, key: string): string | null {
  const text = String(formData.get(key) ?? '').trim();
  return text ? text : null;
}

function parseJsonOrNull(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseImportantInfo(value: string | null): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    const parsed = parseJsonOrNull(trimmed);
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string');
  }
  return trimmed
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseLines(value: string | null): string[] {
  if (!value) return [];
  return value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function upsertFerryRouteAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const parsed = routeSchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    slug: formData.get('slug'),
    name: formData.get('name'),
    short_name: v(formData, 'short_name'),
    region: v(formData, 'region'),
    district: v(formData, 'district'),
    status: formData.get('status'),
    confidence: formData.get('confidence'),
    description: v(formData, 'description'),
    fare_summary: v(formData, 'fare_summary'),
    fare_warning: v(formData, 'fare_warning'),
    endpoint_a_label: v(formData, 'endpoint_a_label'),
    endpoint_b_label: v(formData, 'endpoint_b_label'),
    related_cities: v(formData, 'related_cities'),
    operating_days: v(formData, 'operating_days'),
    source_json: v(formData, 'source_json'),
    featured: formData.get('featured') === 'on',
    active: formData.get('active') !== 'off',
    display_order: formData.get('display_order') || 0,
    important_info: v(formData, 'important_info'),
    fare_json: v(formData, 'fare_json'),
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const importantInfo = parseImportantInfo(parsed.important_info);
  const fare = parseJsonOrNull(parsed.fare_json) ?? {};
  const source = parseJsonOrNull(parsed.source_json) ?? {};

  const payload = {
    id: parsed.id,
    city_id: parsed.city_id,
    slug: parsed.slug,
    name: parsed.name,
    short_name: parsed.short_name,
    region: parsed.region,
    district: parsed.district,
    status: parsed.status,
    confidence: parsed.confidence,
    description: parsed.description,
    fare_summary: parsed.fare_summary,
    fare_warning: parsed.fare_warning,
    endpoint_a_label: parsed.endpoint_a_label,
    endpoint_b_label: parsed.endpoint_b_label,
    related_cities: parseLines(parsed.related_cities),
    operating_days: parseLines(parsed.operating_days),
    source: source as Json,
    featured: parsed.featured,
    active: parsed.active,
    display_order: parsed.display_order,
    important_info: importantInfo as unknown as Json,
    fare: fare as Json,
  };

  const { data, error } = await supabase
    .from('ferry_routes')
    .upsert(payload)
    .select('id, slug')
    .single();
  if (error || !data) throw error;

  await insertUtilityAudit('utilities.ferry_route.upsert', city.id, 'ferry_route', data.id, payload as Json);
  revalidatePath('/painel/cidade/servicos/balsas');
  revalidatePath(`/painel/cidade/servicos/balsas/${data.id}`);
  revalidatePath('/balsas');
  revalidatePath(`/balsas/${data.slug}`);

  if (!parsed.id) redirect(`/painel/cidade/servicos/balsas/${data.id}`);
}

export async function deleteFerryRouteAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const id = z.string().uuid().parse(formData.get('id'));
  const supabase = await createClient();
  await supabase.from('ferry_routes').delete().eq('id', id).eq('city_id', city.id);
  await insertUtilityAudit('utilities.ferry_route.delete', city.id, 'ferry_route', id, {} as Json);
  revalidatePath('/painel/cidade/servicos/balsas');
  revalidatePath('/balsas');
  redirect('/painel/cidade/servicos/balsas');
}

export async function upsertFerryScheduleAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const parsed = scheduleSchema.parse({
    id: formData.get('id') || undefined,
    route_id: formData.get('route_id'),
    city_id: formData.get('city_id'),
    direction: formData.get('direction'),
    origin: v(formData, 'origin'),
    destination: v(formData, 'destination'),
    departs_at: formData.get('departs_at'),
    notes: v(formData, 'notes'),
    active: formData.get('active') !== 'off',
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const departs_at = parsed.departs_at.length === 5 ? `${parsed.departs_at}:00` : parsed.departs_at;
  const { data, error } = await supabase
    .from('ferry_schedule_items')
    .upsert({ ...parsed, departs_at })
    .select('id, route_id')
    .single();
  if (error || !data) throw error;
  await insertUtilityAudit('utilities.ferry_schedule.upsert', city.id, 'ferry_schedule_item', data.id, parsed as Json);
  revalidatePath(`/painel/cidade/servicos/balsas/${data.route_id}`);
  revalidatePath('/balsas');
}

export async function deleteFerryScheduleAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = z.object({ id: z.string().uuid(), route_id: z.string().uuid() }).parse({
    id: formData.get('id'),
    route_id: formData.get('route_id'),
  });
  const supabase = await createClient();
  await supabase.from('ferry_schedule_items').delete().eq('id', parsed.id).eq('city_id', city.id);
  await insertUtilityAudit('utilities.ferry_schedule.delete', city.id, 'ferry_schedule_item', parsed.id, {} as Json);
  revalidatePath(`/painel/cidade/servicos/balsas/${parsed.route_id}`);
  revalidatePath('/balsas');
}

export async function upsertFerryAlertAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const parsed = alertSchema.parse({
    id: formData.get('id') || undefined,
    route_id: formData.get('route_id'),
    city_id: formData.get('city_id'),
    type: formData.get('type'),
    title: formData.get('title'),
    message: formData.get('message'),
    active: formData.get('active') !== 'off',
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ferry_alerts')
    .upsert(parsed)
    .select('id, route_id')
    .single();
  if (error || !data) throw error;
  await insertUtilityAudit('utilities.ferry_alert.upsert', city.id, 'ferry_alert', data.id, parsed as Json);
  revalidatePath(`/painel/cidade/servicos/balsas/${data.route_id}`);
  revalidatePath('/balsas');
}

export async function deleteFerryAlertAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = z.object({ id: z.string().uuid(), route_id: z.string().uuid() }).parse({
    id: formData.get('id'),
    route_id: formData.get('route_id'),
  });
  const supabase = await createClient();
  await supabase.from('ferry_alerts').delete().eq('id', parsed.id).eq('city_id', city.id);
  await insertUtilityAudit('utilities.ferry_alert.delete', city.id, 'ferry_alert', parsed.id, {} as Json);
  revalidatePath(`/painel/cidade/servicos/balsas/${parsed.route_id}`);
  revalidatePath('/balsas');
}

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { insertUtilityAudit } from '../_audit';

const facilitySchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  district_id: z.string().uuid().nullable(),
  name: z.string().min(2).max(160),
  type: z.enum(['ubs', 'hospital', 'upa', 'odonto', 'psf', 'caps', 'secretaria', 'farmacia-publica', 'vacinacao', 'vigilancia']),
  slug: z.string().max(180).nullable(),
  neighborhood: z.string().max(160).nullable(),
  address: z.string().max(240).nullable(),
  phone: z.string().max(40).nullable(),
  secondary_phone: z.string().max(40).nullable(),
  whatsapp: z.string().max(40).nullable(),
  hours_legacy_text: z.string().max(160).nullable(),
  services: z.array(z.string().min(1).max(60)),
  requirements: z.array(z.string().min(1).max(80)).default([]),
  source_type: z.string().min(2).max(40).default('oficial'),
  tags: z.array(z.string().min(1).max(60)).default([]),
  needs_verification: z.boolean(),
  note: z.string().max(500).nullable(),
  last_verified_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  display_order: z.coerce.number().int().default(0),
  lat: z.coerce.number().nullable(),
  lng: z.coerce.number().nullable(),
  active: z.boolean(),
});

const campaignSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  title: z.string().min(2).max(160),
  description: z.string().max(1000).nullable(),
  target_group: z.string().max(120).nullable(),
  vaccine_or_topic: z.string().max(120).nullable(),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
  location: z.string().max(240).nullable(),
  cover_url: z.string().url().max(500).nullable(),
  active: z.boolean(),
});

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? '').trim();
  return value ? value : null;
}

function numberOrNull(formData: FormData, key: string): number | null {
  const value = text(formData, key);
  return value ? Number(value) : null;
}

function services(value: FormDataEntryValue | null): string[] {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function upsertHealthFacilityAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = facilitySchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    district_id: text(formData, 'district_id'),
    name: formData.get('name'),
    type: formData.get('type'),
    slug: text(formData, 'slug'),
    neighborhood: text(formData, 'neighborhood'),
    address: text(formData, 'address'),
    phone: text(formData, 'phone'),
    secondary_phone: text(formData, 'secondary_phone'),
    whatsapp: text(formData, 'whatsapp'),
    hours_legacy_text: text(formData, 'hours_legacy_text'),
    services: services(formData.get('services')),
    requirements: services(formData.get('requirements')),
    source_type: formData.get('source_type') || 'oficial',
    tags: services(formData.get('tags')),
    needs_verification: formData.get('needs_verification') === 'on',
    note: text(formData, 'note'),
    last_verified_at: text(formData, 'last_verified_at'),
    display_order: formData.get('display_order') || 0,
    lat: numberOrNull(formData, 'lat'),
    lng: numberOrNull(formData, 'lng'),
    active: formData.get('active') === 'on',
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const { data, error } = await supabase.from('health_facilities').upsert(parsed).select('id').single();
  if (error || !data) throw error;

  await insertUtilityAudit('utilities.health_facility.upsert', city.id, 'health_facility', data.id, parsed as Json);
  revalidatePath('/painel/cidade/servicos/saude');
  revalidatePath('/servicos/saude');
}

export async function upsertHealthCampaignAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = campaignSchema.parse({
    id: formData.get('id') || undefined,
    city_id: formData.get('city_id'),
    title: formData.get('title'),
    description: text(formData, 'description'),
    target_group: text(formData, 'target_group'),
    vaccine_or_topic: text(formData, 'vaccine_or_topic'),
    start_at: text(formData, 'start_at'),
    end_at: text(formData, 'end_at'),
    location: text(formData, 'location'),
    cover_url: text(formData, 'cover_url'),
    active: formData.get('active') !== 'off',
  });
  if (parsed.city_id !== city.id) return;

  const supabase = await createClient();
  const { data, error } = await supabase.from('health_campaigns').upsert(parsed).select('id').single();
  if (error || !data) throw error;

  await insertUtilityAudit('utilities.health_campaign.upsert', city.id, 'health_campaign', data.id, parsed as Json);
  revalidatePath('/painel/cidade/servicos/saude');
  revalidatePath('/servicos/saude');
}

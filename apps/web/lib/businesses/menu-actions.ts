'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

// Tabelas novas (business_menu_sections/items) ainda não estão no database.types
// gerado — cast permissivo até regenerar, como em lib/studio/actions.
async function db() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as unknown as { from: (t: string) => any; rpc: (fn: string, args?: unknown) => any };
}

async function assertManagesBusiness(businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc('manages_business', { p_business_id: businessId });
  if (!data) throw new Error('Sem permissão para esse negócio.');
}

function revalidate(businessId: string) {
  revalidatePath(`/painel/comercio/${businessId}/cardapio`);
}

type Result = { ok: boolean; id?: string; error?: string };

// ── Seções ──────────────────────────────────────────────────────────────────
const saveSectionSchema = z.object({
  id: z.string().uuid().optional(),
  businessId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(400).optional().nullable(),
});

export async function saveMenuSectionAction(input: z.input<typeof saveSectionSchema>): Promise<Result> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };
  await requireProfile();
  const parsed = saveSectionSchema.parse(input);
  await assertManagesBusiness(parsed.businessId);

  const supabase = await db();
  if (parsed.id) {
    const { error } = await supabase
      .from('business_menu_sections')
      .update({ name: parsed.name, description: parsed.description ?? null })
      .eq('id', parsed.id)
      .eq('city_id', city.id);
    if (error) return { ok: false, error: error.message };
    revalidate(parsed.businessId);
    return { ok: true, id: parsed.id };
  }

  const { data: maxRow } = await supabase
    .from('business_menu_sections')
    .select('position')
    .eq('business_id', parsed.businessId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = ((maxRow?.position as number | undefined) ?? -1) + 1;

  const { data, error } = await supabase
    .from('business_menu_sections')
    .insert({
      city_id: city.id,
      business_id: parsed.businessId,
      name: parsed.name,
      description: parsed.description ?? null,
      position: nextPosition,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  revalidate(parsed.businessId);
  return { ok: true, id: data?.id };
}

const deleteSectionSchema = z.object({ id: z.string().uuid(), businessId: z.string().uuid() });

export async function deleteMenuSectionAction(input: z.input<typeof deleteSectionSchema>): Promise<Result> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };
  await requireProfile();
  const parsed = deleteSectionSchema.parse(input);
  await assertManagesBusiness(parsed.businessId);

  const supabase = await db();
  const { error } = await supabase
    .from('business_menu_sections')
    .delete()
    .eq('id', parsed.id)
    .eq('city_id', city.id);
  if (error) return { ok: false, error: error.message };
  revalidate(parsed.businessId);
  return { ok: true };
}

const reorderSectionsSchema = z.object({
  businessId: z.string().uuid(),
  sectionIds: z.array(z.string().uuid()).min(1),
});

export async function reorderMenuSectionsAction(input: z.input<typeof reorderSectionsSchema>): Promise<Result> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };
  await requireProfile();
  const parsed = reorderSectionsSchema.parse(input);
  await assertManagesBusiness(parsed.businessId);

  const supabase = await db();
  for (let i = 0; i < parsed.sectionIds.length; i++) {
    const { error } = await supabase
      .from('business_menu_sections')
      .update({ position: i })
      .eq('id', parsed.sectionIds[i])
      .eq('city_id', city.id);
    if (error) return { ok: false, error: error.message };
  }
  revalidate(parsed.businessId);
  return { ok: true };
}

// ── Itens ───────────────────────────────────────────────────────────────────
const saveItemSchema = z.object({
  id: z.string().uuid().optional(),
  businessId: z.string().uuid(),
  sectionId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600).optional().nullable(),
  priceCents: z.number().int().min(0).max(100_000_00),
  photoUrl: z.string().url().max(2000).optional().nullable(),
  available: z.boolean().default(true),
});

export async function saveMenuItemAction(input: z.input<typeof saveItemSchema>): Promise<Result> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };
  await requireProfile();
  const parsed = saveItemSchema.parse(input);
  await assertManagesBusiness(parsed.businessId);

  const supabase = await db();
  const payload = {
    name: parsed.name,
    description: parsed.description ?? null,
    price_cents: parsed.priceCents,
    photo_url: parsed.photoUrl ?? null,
    available: parsed.available,
  };

  if (parsed.id) {
    const { error } = await supabase
      .from('business_menu_items')
      .update(payload)
      .eq('id', parsed.id)
      .eq('city_id', city.id);
    if (error) return { ok: false, error: error.message };
    revalidate(parsed.businessId);
    return { ok: true, id: parsed.id };
  }

  const { data: maxRow } = await supabase
    .from('business_menu_items')
    .select('position')
    .eq('section_id', parsed.sectionId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = ((maxRow?.position as number | undefined) ?? -1) + 1;

  const { data, error } = await supabase
    .from('business_menu_items')
    .insert({
      city_id: city.id,
      business_id: parsed.businessId,
      section_id: parsed.sectionId,
      ...payload,
      position: nextPosition,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  revalidate(parsed.businessId);
  return { ok: true, id: data?.id };
}

const deleteItemSchema = z.object({ id: z.string().uuid(), businessId: z.string().uuid() });

export async function deleteMenuItemAction(input: z.input<typeof deleteItemSchema>): Promise<Result> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };
  await requireProfile();
  const parsed = deleteItemSchema.parse(input);
  await assertManagesBusiness(parsed.businessId);

  const supabase = await db();
  const { error } = await supabase
    .from('business_menu_items')
    .delete()
    .eq('id', parsed.id)
    .eq('city_id', city.id);
  if (error) return { ok: false, error: error.message };
  revalidate(parsed.businessId);
  return { ok: true };
}

const reorderItemsSchema = z.object({
  businessId: z.string().uuid(),
  itemIds: z.array(z.string().uuid()).min(1),
});

export async function reorderMenuItemsAction(input: z.input<typeof reorderItemsSchema>): Promise<Result> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };
  await requireProfile();
  const parsed = reorderItemsSchema.parse(input);
  await assertManagesBusiness(parsed.businessId);

  const supabase = await db();
  for (let i = 0; i < parsed.itemIds.length; i++) {
    const { error } = await supabase
      .from('business_menu_items')
      .update({ position: i })
      .eq('id', parsed.itemIds[i])
      .eq('city_id', city.id);
    if (error) return { ok: false, error: error.message };
  }
  revalidate(parsed.businessId);
  return { ok: true };
}

'use server'

// Gestão do catálogo de delivery (cardápio): catálogos, seções, itens, grupos de
// opção e valores. Segue o padrão do projeto: 'use server' + Zod + requireRole +
// checagem manages_business + revalidatePath. Depende da migration 20260530180000.

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth'
import { getCurrentCity } from '@/lib/cities'
import { createClient } from '@/lib/supabase/server'

async function ensureCanManage(businessId: string) {
  const city = await getCurrentCity()
  if (!city) throw new Error('cidade não encontrada')
  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] })

  const supabase = await createClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug')
    .eq('id', businessId)
    .eq('city_id', city.id)
    .single()
  if (!business) throw new Error('negócio não encontrado')

  const { data: can } = await supabase.rpc('manages_business', { p_business_id: businessId })
  if (!can) throw new Error('sem permissão')

  return { supabase, city, slug: business.slug as string }
}

function revalidate(businessId: string, slug: string) {
  revalidatePath(`/painel/comercio/${businessId}/cardapio`)
  revalidatePath(`/comercio/negocio/${slug}/cardapio`)
}

// ── Catálogo ─────────────────────────────────────────────────────────────────

const catalogSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  catalog_type: z.enum(['food_menu', 'product_catalog']).default('food_menu'),
  description: z.string().max(500).nullable().optional(),
})

export async function upsertCatalogAction(formData: FormData) {
  const input = catalogSchema.parse({
    id: formData.get('id') || undefined,
    business_id: formData.get('business_id'),
    name: formData.get('name'),
    catalog_type: formData.get('catalog_type') || 'food_menu',
    description: formData.get('description') || null,
  })
  const { supabase, slug } = await ensureCanManage(input.business_id)

  if (input.id) {
    await supabase
      .from('business_catalogs')
      .update({ name: input.name, catalog_type: input.catalog_type, description: input.description ?? null })
      .eq('id', input.id)
  } else {
    await supabase.from('business_catalogs').insert({
      business_id: input.business_id,
      name: input.name,
      catalog_type: input.catalog_type,
      description: input.description ?? null,
    })
  }
  revalidate(input.business_id, slug)
}

// ── Seção ────────────────────────────────────────────────────────────────────

const sectionSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  catalog_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  display_order: z.coerce.number().int().default(0),
})

export async function upsertSectionAction(formData: FormData) {
  const input = sectionSchema.parse({
    id: formData.get('id') || undefined,
    business_id: formData.get('business_id'),
    catalog_id: formData.get('catalog_id'),
    name: formData.get('name'),
    description: formData.get('description') || null,
    display_order: formData.get('display_order') || 0,
  })
  const { supabase, slug } = await ensureCanManage(input.business_id)

  if (input.id) {
    await supabase
      .from('catalog_sections')
      .update({ name: input.name, description: input.description ?? null, display_order: input.display_order })
      .eq('id', input.id)
  } else {
    await supabase.from('catalog_sections').insert({
      catalog_id: input.catalog_id,
      name: input.name,
      description: input.description ?? null,
      display_order: input.display_order,
    })
  }
  revalidate(input.business_id, slug)
}

export async function deleteSectionAction(formData: FormData) {
  const businessId = String(formData.get('business_id'))
  const sectionId = String(formData.get('section_id'))
  z.string().uuid().parse(businessId)
  z.string().uuid().parse(sectionId)
  const { supabase, slug } = await ensureCanManage(businessId)
  await supabase.from('catalog_sections').delete().eq('id', sectionId)
  revalidate(businessId, slug)
}

// ── Item ─────────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  section_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  price: z.coerce.number().min(0),
  promotional_price: z.coerce.number().min(0).nullable().optional(),
  serves: z.string().max(60).nullable().optional(),
  prep_time_min: z.coerce.number().int().min(0).nullable().optional(),
  tags: z.array(z.string()).default([]),
  available: z.boolean().default(true),
  display_order: z.coerce.number().int().default(0),
})

export async function upsertItemAction(formData: FormData) {
  const input = itemSchema.parse({
    id: formData.get('id') || undefined,
    business_id: formData.get('business_id'),
    section_id: formData.get('section_id'),
    name: formData.get('name'),
    description: formData.get('description') || null,
    price: formData.get('price') || 0,
    promotional_price: formData.get('promotional_price') || null,
    serves: formData.get('serves') || null,
    prep_time_min: formData.get('prep_time_min') || null,
    tags: formData.getAll('tags').map(String).filter(Boolean),
    available: formData.get('available') === 'on' || formData.get('available') === 'true',
    display_order: formData.get('display_order') || 0,
  })
  const { supabase, slug } = await ensureCanManage(input.business_id)

  const payload = {
    section_id: input.section_id,
    business_id: input.business_id,
    name: input.name,
    description: input.description ?? null,
    price: input.price,
    promotional_price: input.promotional_price ?? null,
    serves: input.serves ?? null,
    prep_time_min: input.prep_time_min ?? null,
    tags: input.tags,
    available: input.available,
    display_order: input.display_order,
  }

  if (input.id) {
    await supabase.from('catalog_items').update(payload).eq('id', input.id)
  } else {
    await supabase.from('catalog_items').insert(payload)
  }
  revalidate(input.business_id, slug)
}

export async function toggleItemAvailabilityAction(formData: FormData) {
  const businessId = String(formData.get('business_id'))
  const itemId = String(formData.get('item_id'))
  const available = formData.get('available') === 'true'
  z.string().uuid().parse(businessId)
  z.string().uuid().parse(itemId)
  const { supabase, slug } = await ensureCanManage(businessId)
  await supabase.from('catalog_items').update({ available }).eq('id', itemId)
  revalidate(businessId, slug)
}

export async function deleteItemAction(formData: FormData) {
  const businessId = String(formData.get('business_id'))
  const itemId = String(formData.get('item_id'))
  z.string().uuid().parse(businessId)
  z.string().uuid().parse(itemId)
  const { supabase, slug } = await ensureCanManage(businessId)
  await supabase.from('catalog_items').delete().eq('id', itemId)
  revalidate(businessId, slug)
}

// ── Grupos e valores de opção ────────────────────────────────────────────────

const optionGroupSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  item_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  min_choices: z.coerce.number().int().min(0).default(0),
  max_choices: z.coerce.number().int().min(1).default(1),
  display_order: z.coerce.number().int().default(0),
})

export async function upsertOptionGroupAction(formData: FormData) {
  const input = optionGroupSchema.parse({
    id: formData.get('id') || undefined,
    business_id: formData.get('business_id'),
    item_id: formData.get('item_id'),
    name: formData.get('name'),
    min_choices: formData.get('min_choices') || 0,
    max_choices: formData.get('max_choices') || 1,
    display_order: formData.get('display_order') || 0,
  })
  const { supabase, slug } = await ensureCanManage(input.business_id)

  if (input.id) {
    await supabase
      .from('catalog_item_option_groups')
      .update({ name: input.name, min_choices: input.min_choices, max_choices: input.max_choices, display_order: input.display_order })
      .eq('id', input.id)
  } else {
    await supabase.from('catalog_item_option_groups').insert({
      item_id: input.item_id,
      name: input.name,
      min_choices: input.min_choices,
      max_choices: input.max_choices,
      display_order: input.display_order,
    })
  }
  revalidate(input.business_id, slug)
}

export async function deleteOptionGroupAction(formData: FormData) {
  const businessId = String(formData.get('business_id'))
  const groupId = String(formData.get('group_id'))
  z.string().uuid().parse(businessId)
  z.string().uuid().parse(groupId)
  const { supabase, slug } = await ensureCanManage(businessId)
  await supabase.from('catalog_item_option_groups').delete().eq('id', groupId)
  revalidate(businessId, slug)
}

const optionValueSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  group_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  price_add: z.coerce.number().min(0).default(0),
  available: z.boolean().default(true),
  display_order: z.coerce.number().int().default(0),
})

export async function upsertOptionValueAction(formData: FormData) {
  const input = optionValueSchema.parse({
    id: formData.get('id') || undefined,
    business_id: formData.get('business_id'),
    group_id: formData.get('group_id'),
    name: formData.get('name'),
    price_add: formData.get('price_add') || 0,
    available: formData.get('available') === 'on' || formData.get('available') === 'true',
    display_order: formData.get('display_order') || 0,
  })
  const { supabase, slug } = await ensureCanManage(input.business_id)

  if (input.id) {
    await supabase
      .from('catalog_item_option_values')
      .update({ name: input.name, price_add: input.price_add, available: input.available, display_order: input.display_order })
      .eq('id', input.id)
  } else {
    await supabase.from('catalog_item_option_values').insert({
      group_id: input.group_id,
      name: input.name,
      price_add: input.price_add,
      available: input.available,
      display_order: input.display_order,
    })
  }
  revalidate(input.business_id, slug)
}

export async function deleteOptionValueAction(formData: FormData) {
  const businessId = String(formData.get('business_id'))
  const valueId = String(formData.get('value_id'))
  z.string().uuid().parse(businessId)
  z.string().uuid().parse(valueId)
  const { supabase, slug } = await ensureCanManage(businessId)
  await supabase.from('catalog_item_option_values').delete().eq('id', valueId)
  revalidate(businessId, slug)
}

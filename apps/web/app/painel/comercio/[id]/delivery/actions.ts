'use server'

// Configurações de delivery (campos na tabela businesses), presença online e
// operadores de WhatsApp. Depende da migration 20260530180000.

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
  return { supabase, slug: business.slug as string }
}

// ── Plano: ativar teste de 30 dias do Pro ────────────────────────────────────

export async function startDeliveryTrialAction(formData: FormData) {
  const businessId = String(formData.get('business_id'))
  z.string().uuid().parse(businessId)
  const { supabase } = await ensureCanManage(businessId)
  // RPC valida manages_business e "trial usado só uma vez".
  await supabase.rpc('start_delivery_trial', { p_business_id: businessId })
  revalidatePath(`/painel/comercio/${businessId}/delivery`)
  revalidatePath(`/painel/comercio/${businessId}/relatorios`)
}

// ── Configurações de delivery ────────────────────────────────────────────────

const deliverySchema = z.object({
  business_id: z.string().uuid(),
  delivery_enabled: z.boolean(),
  pickup_enabled: z.boolean(),
  table_service_enabled: z.boolean(),
  delivery_fee: z.coerce.number().min(0).nullable(),
  delivery_min_order: z.coerce.number().min(0).nullable(),
  delivery_time_min: z.coerce.number().int().min(0).nullable(),
  pickup_time_min: z.coerce.number().int().min(0).nullable(),
  delivery_radius_km: z.coerce.number().min(0).nullable(),
  pix_key: z.string().max(140).nullable(),
  accepts_card_on_delivery: z.boolean(),
  order_instructions: z.string().max(500).nullable(),
})

function nullableNum(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim()
  return s ? Number(s) : null
}

export async function upsertDeliverySettingsAction(formData: FormData) {
  const input = deliverySchema.parse({
    business_id: formData.get('business_id'),
    delivery_enabled: formData.get('delivery_enabled') === 'on',
    pickup_enabled: formData.get('pickup_enabled') === 'on',
    table_service_enabled: formData.get('table_service_enabled') === 'on',
    delivery_fee: nullableNum(formData.get('delivery_fee')),
    delivery_min_order: nullableNum(formData.get('delivery_min_order')),
    delivery_time_min: nullableNum(formData.get('delivery_time_min')),
    pickup_time_min: nullableNum(formData.get('pickup_time_min')),
    delivery_radius_km: nullableNum(formData.get('delivery_radius_km')),
    pix_key: (formData.get('pix_key') as string) || null,
    accepts_card_on_delivery: formData.get('accepts_card_on_delivery') === 'on',
    order_instructions: (formData.get('order_instructions') as string) || null,
  })
  const { supabase, slug } = await ensureCanManage(input.business_id)

  const { business_id, ...fields } = input
  await supabase.from('businesses').update(fields).eq('id', business_id)

  revalidatePath(`/painel/comercio/${business_id}/delivery`)
  revalidatePath(`/comercio/negocio/${slug}/cardapio`)
}

// ── Presença online (abre/fecha a loja pelo painel) ──────────────────────────

export async function setOnlineAction(formData: FormData) {
  const businessId = String(formData.get('business_id'))
  const online = formData.get('online') === 'true'
  z.string().uuid().parse(businessId)
  const { supabase, slug } = await ensureCanManage(businessId)
  // 6h de janela automática quando aberto pelo painel
  const autoOffline = online ? new Date(Date.now() + 6 * 3600_000).toISOString() : null
  await supabase.rpc('set_business_online', {
    p_business_id: businessId,
    p_online: online,
    p_auto_offline: autoOffline ?? undefined,
    p_source: 'panel',
  })
  revalidatePath(`/painel/comercio/${businessId}/delivery`)
  revalidatePath(`/painel/comercio/${businessId}/fila`)
  revalidatePath(`/comercio/negocio/${slug}/cardapio`)
  revalidatePath('/faca-pedidos')
}

// ── Operadores de WhatsApp ───────────────────────────────────────────────────

const operatorSchema = z.object({
  business_id: z.string().uuid(),
  phone_number: z.string().min(8).max(20),
  display_name: z.string().max(80).nullable(),
  role: z.enum(['owner', 'operator']).default('operator'),
})

export async function upsertOperatorAction(formData: FormData) {
  const input = operatorSchema.parse({
    business_id: formData.get('business_id'),
    phone_number: formData.get('phone_number'),
    display_name: (formData.get('display_name') as string) || null,
    role: formData.get('role') || 'operator',
  })
  const { supabase: db } = await ensureCanManage(input.business_id)

  const phone = input.phone_number.replace(/\D/g, '')
  // Cadastro pelo painel já marca verificado (o dono é responsável pelo número).
  await db.from('business_wa_operators').upsert(
    {
      business_id: input.business_id,
      phone_number: phone,
      display_name: input.display_name ?? null,
      role: input.role,
      active: true,
      verified_at: new Date().toISOString(),
    },
    { onConflict: 'business_id,phone_number' },
  )
  revalidatePath(`/painel/comercio/${input.business_id}/delivery`)
}

export async function deleteOperatorAction(formData: FormData) {
  const businessId = String(formData.get('business_id'))
  const operatorId = String(formData.get('operator_id'))
  z.string().uuid().parse(businessId)
  z.string().uuid().parse(operatorId)
  const { supabase: db } = await ensureCanManage(businessId)
  await db.from('business_wa_operators').delete().eq('id', operatorId)
  revalidatePath(`/painel/comercio/${businessId}/delivery`)
}

// ── Mudança de status de pedido (painel) ─────────────────────────────────────

export async function changeOrderStatusAction(formData: FormData) {
  const businessId = String(formData.get('business_id'))
  const orderId = String(formData.get('order_id'))
  const status = String(formData.get('status'))
  z.string().uuid().parse(businessId)
  z.string().uuid().parse(orderId)
  z.enum(['confirmed', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled', 'rejected']).parse(status)
  const { supabase } = await ensureCanManage(businessId)
  await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_status: status,
    p_note: (formData.get('note') as string) || undefined,
    p_actor: undefined,
  })
  revalidatePath(`/painel/comercio/${businessId}/fila`)
}

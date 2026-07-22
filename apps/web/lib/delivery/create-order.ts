'use client'

// Gravação do pedido DIRETO no Supabase (sem Server Action / sem Vercel no caminho).
// A RPC `create_order` é SECURITY DEFINER e tem grant para `anon` + `authenticated`,
// então funciona para cliente logado e para guest. Ela recalcula os preços a partir
// do catálogo no servidor (anti-fraude). A notificação ao operador no WhatsApp é
// enfileirada por trigger AFTER INSERT em `orders`. Ver plano 06.

import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/database.types'

export type CreateOrderItemInput = {
  catalogItemId: string
  qty: number
  notes?: string
  options?: Array<{ groupId: string; valueId: string }>
}

export type CreateOrderInput = {
  businessId: string
  orderType: 'delivery' | 'pickup' | 'table'
  items: CreateOrderItemInput[]
  paymentMethod?: 'pix' | 'card_on_delivery' | 'cash' | 'whatsapp'
  customerName?: string
  customerPhone?: string
  deliveryAddress?: Record<string, unknown> | null
  deliveryNotes?: string
  notes?: string
  changeFor?: number | null
  channel?: 'web' | 'app'
}

export type CreateOrderResult =
  | { ok: true; orderId: string; code: number; total: number }
  | { ok: false; error: string }

// Mapeia o erro cru da função SQL para uma mensagem amigável em pt-BR.
const ERROR_MESSAGES: Record<string, string> = {
  store_offline: 'Esta loja está fechada no momento.',
  empty_cart: 'Seu carrinho está vazio.',
  below_min_order: 'O valor do pedido é menor que o mínimo para entrega.',
  delivery_disabled: 'Esta loja não está aceitando entregas agora.',
  pickup_disabled: 'Esta loja não está aceitando retiradas agora.',
  business_not_found: 'Loja não encontrada.',
  plan_required: 'Esta loja recebe pedidos pelo WhatsApp.',
}

function friendlyError(raw: string): string {
  const key = Object.keys(ERROR_MESSAGES).find((k) => raw.includes(k))
  return key ? ERROR_MESSAGES[key] : 'Não foi possível enviar o pedido. Tente novamente.'
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('create_order', {
    p_business_id: input.businessId,
    p_order_type: input.orderType,
    p_items: input.items.map((i) => ({
      catalog_item_id: i.catalogItemId,
      qty: i.qty,
      notes: i.notes ?? null,
      options: (i.options ?? []).map((o) => ({ group_id: o.groupId, value_id: o.valueId })),
    })),
    p_payment_method: input.paymentMethod ?? undefined,
    p_customer_name: input.customerName ?? undefined,
    p_customer_phone: input.customerPhone ?? undefined,
    p_delivery_address: (input.deliveryAddress ?? undefined) as Json | undefined,
    p_delivery_notes: input.deliveryNotes ?? undefined,
    p_notes: input.notes ?? undefined,
    p_change_for: input.changeFor ?? undefined,
    p_channel: input.channel ?? 'web',
  })

  if (error) return { ok: false, error: friendlyError(error.message) }

  const result = data as unknown as { order_id: string; code: number; total: number }
  return { ok: true, orderId: result.order_id, code: result.code, total: result.total }
}

// Pedidos do cliente no app: leitura da lista, detalhe e assinatura realtime.
// Usa o client Supabase do app (RLS garante que o usuário só vê os próprios
// pedidos: orders.customer_id = auth.uid()). Ver migration 20260530180000.

import { supabase } from '@/lib/supabase'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'
  | 'rejected'

export type OrderListItem = {
  id: string
  code: string | null
  status: OrderStatus
  orderType: 'delivery' | 'pickup' | 'table'
  total: number
  businessName: string | null
  createdAt: string
}

export type OrderItemLine = {
  id: string
  name: string
  qty: number
  subtotal: number
  optionsSnapshot: Array<{ group: string; value: string; price_add: number }>
  notes: string | null
}

export type OrderDetail = OrderListItem & {
  deliveryFee: number
  totalItems: number
  paymentMethod: string | null
  deliveryAddress: { text?: string } | null
  notes: string | null
  merchantNotes: string | null
  items: OrderItemLine[]
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Aguardando confirmação',
  confirmed: 'Pedido aceito',
  preparing: 'Em preparo',
  ready: 'Pronto',
  dispatched: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  rejected: 'Recusado',
}

// Etapas exibidas no acompanhamento (rejeitado/cancelado tratados à parte).
export const ORDER_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'delivered']

type OrderRow = {
  id: string
  code: string | null
  status: OrderStatus
  order_type: 'delivery' | 'pickup' | 'table'
  total: number | string
  created_at: string
  businesses?: { name: string | null } | null
}

export async function fetchMyOrders(): Promise<OrderListItem[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, code, status, order_type, total, created_at, businesses(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  return (data as unknown as OrderRow[]).map((o) => ({
    id: o.id,
    code: o.code,
    status: o.status,
    orderType: o.order_type,
    total: Number(o.total),
    businessName: o.businesses?.name ?? null,
    createdAt: o.created_at,
  }))
}

export async function fetchOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, code, status, order_type, total, total_items, delivery_fee, payment_method, delivery_address, notes, merchant_notes, created_at, businesses(name), order_items(id, name, qty, subtotal, options_snapshot, notes)',
    )
    .eq('id', orderId)
    .maybeSingle()

  if (error || !data) return null

  const o = data as unknown as OrderRow & {
    total_items: number | string
    delivery_fee: number | string
    payment_method: string | null
    delivery_address: { text?: string } | null
    notes: string | null
    merchant_notes: string | null
    order_items?: Array<{
      id: string
      name: string
      qty: number
      subtotal: number | string
      options_snapshot: Array<{ group: string; value: string; price_add: number }> | null
      notes: string | null
    }>
  }

  return {
    id: o.id,
    code: o.code,
    status: o.status,
    orderType: o.order_type,
    total: Number(o.total),
    totalItems: Number(o.total_items),
    deliveryFee: Number(o.delivery_fee),
    paymentMethod: o.payment_method,
    deliveryAddress: o.delivery_address,
    notes: o.notes,
    merchantNotes: o.merchant_notes,
    businessName: o.businesses?.name ?? null,
    createdAt: o.created_at,
    items: (o.order_items ?? []).map((it) => ({
      id: it.id,
      name: it.name,
      qty: it.qty,
      subtotal: Number(it.subtotal),
      optionsSnapshot: it.options_snapshot ?? [],
      notes: it.notes,
    })),
  }
}

/**
 * Assina mudanças de status de um pedido (Realtime). Retorna a função de
 * cleanup para remover o canal. Use enquanto a tela de detalhe está aberta.
 */
export function subscribeOrder(orderId: string, onStatus: (status: OrderStatus) => void): () => void {
  const channel = supabase
    .channel(`order:${orderId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => {
        const next = (payload.new as { status?: OrderStatus }).status
        if (next) onStatus(next)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

// Relatórios e métricas de delivery (recurso Pro). Agrega os pedidos nativos
// gravados em `orders` para mostrar valor ao comerciante: faturamento, ticket
// médio, volume por dia, itens mais pedidos, horário de pico, tempo de preparo
// e taxa de aceite/cancelamento. Tudo calculado no servidor (RSC).
//
// Só existe dado aqui no Pro — no Free o pedido vai pelo WhatsApp e não é gravado.

import { createClient } from '@/lib/supabase/server'

import type { Database } from '@/lib/supabase/database.types'

type OrderRow = Database['public']['Tables']['orders']['Row']

export type DeliveryReport = {
  rangeDays: number
  totalOrders: number
  deliveredOrders: number
  revenue: number // soma do total dos pedidos entregues
  avgTicket: number
  acceptRate: number // confirmados / (confirmados + recusados)
  cancelRate: number // (cancelados+recusados) / total
  avgPrepMinutes: number | null // criação → pronto/saiu
  byDay: Array<{ day: string; orders: number; revenue: number }>
  byHour: Array<{ hour: number; orders: number }>
  topItems: Array<{ name: string; qty: number; revenue: number }>
  byType: { delivery: number; pickup: number; table: number }
  byPayment: Array<{ method: string; orders: number }>
}

type OrderForReport = Pick<
  OrderRow,
  | 'id'
  | 'status'
  | 'order_type'
  | 'total'
  | 'payment_method'
  | 'created_at'
  | 'confirmed_at'
  | 'dispatched_at'
  | 'delivered_at'
>

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  card_on_delivery: 'Cartão na entrega',
  whatsapp: 'Combinar',
}

const REVENUE_STATUSES = new Set(['delivered', 'dispatched', 'ready', 'preparing', 'confirmed'])

export async function getDeliveryReport(businessId: string, rangeDays = 30): Promise<DeliveryReport> {
  const supabase = await createClient()
  const since = new Date(Date.now() - rangeDays * 86_400_000).toISOString()

  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, status, order_type, total, payment_method, created_at, confirmed_at, dispatched_at, delivered_at',
    )
    .eq('business_id', businessId)
    .gte('created_at', since)

  const rows = (orders ?? []) as OrderForReport[]

  const empty: DeliveryReport = {
    rangeDays,
    totalOrders: 0,
    deliveredOrders: 0,
    revenue: 0,
    avgTicket: 0,
    acceptRate: 0,
    cancelRate: 0,
    avgPrepMinutes: null,
    byDay: [],
    byHour: [],
    topItems: [],
    byType: { delivery: 0, pickup: 0, table: 0 },
    byPayment: [],
  }
  if (rows.length === 0) return empty

  // Faturamento conta pedidos que não foram recusados/cancelados.
  const revenueRows = rows.filter((o) => REVENUE_STATUSES.has(o.status))
  const revenue = revenueRows.reduce((s, o) => s + Number(o.total), 0)
  const delivered = rows.filter((o) => o.status === 'delivered')
  const confirmed = rows.filter((o) => o.status !== 'pending' && o.status !== 'rejected').length
  const rejected = rows.filter((o) => o.status === 'rejected').length
  const cancelled = rows.filter((o) => o.status === 'cancelled' || o.status === 'rejected').length

  // Por dia
  const dayMap = new Map<string, { orders: number; revenue: number }>()
  for (const o of rows) {
    const day = (o.created_at ?? '').slice(0, 10)
    const cur = dayMap.get(day) ?? { orders: 0, revenue: 0 }
    cur.orders += 1
    if (REVENUE_STATUSES.has(o.status)) cur.revenue += Number(o.total)
    dayMap.set(day, cur)
  }
  const byDay = Array.from(dayMap.entries())
    .map(([day, v]) => ({ day, ...v }))
    .sort((a, b) => a.day.localeCompare(b.day))

  // Por hora (America/Sao_Paulo)
  const hourCounts = new Array(24).fill(0)
  for (const o of rows) {
    const h = Number(
      new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(
        new Date(o.created_at ?? ''),
      ),
    )
    if (!Number.isNaN(h)) hourCounts[h % 24] += 1
  }
  const byHour = hourCounts.map((orders, hour) => ({ hour, orders })).filter((h) => h.orders > 0)

  // Tempo de preparo médio (criação → pronto/saiu/entregue)
  const prepDurations: number[] = []
  for (const o of rows) {
    const end = o.dispatched_at ?? o.delivered_at
    if (end) {
      const mins = (new Date(end).getTime() - new Date(o.created_at ?? '').getTime()) / 60000
      if (mins > 0 && mins < 24 * 60) prepDurations.push(mins)
    }
  }
  const avgPrepMinutes =
    prepDurations.length > 0
      ? Math.round(prepDurations.reduce((s, m) => s + m, 0) / prepDurations.length)
      : null

  // Por tipo
  const byType = { delivery: 0, pickup: 0, table: 0 }
  for (const o of rows) byType[o.order_type] += 1

  // Por pagamento
  const payMap = new Map<string, number>()
  for (const o of rows) {
    const label = o.payment_method ? (PAYMENT_LABEL[o.payment_method] ?? o.payment_method) : 'Não informado'
    payMap.set(label, (payMap.get(label) ?? 0) + 1)
  }
  const byPayment = Array.from(payMap.entries())
    .map(([method, orders]) => ({ method, orders }))
    .sort((a, b) => b.orders - a.orders)

  // Itens mais pedidos (consulta agregada nos order_items do período)
  const orderIds = rows.map((o) => o.id)
  const { data: items } = await supabase
    .from('order_items')
    .select('name, qty, subtotal, order_id')
    .in('order_id', orderIds)

  const itemMap = new Map<string, { qty: number; revenue: number }>()
  for (const it of items ?? []) {
    const cur = itemMap.get(it.name) ?? { qty: 0, revenue: 0 }
    cur.qty += it.qty
    cur.revenue += Number(it.subtotal)
    itemMap.set(it.name, cur)
  }
  const topItems = Array.from(itemMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)

  return {
    rangeDays,
    totalOrders: rows.length,
    deliveredOrders: delivered.length,
    revenue,
    avgTicket: revenueRows.length > 0 ? revenue / revenueRows.length : 0,
    acceptRate: confirmed + rejected > 0 ? confirmed / (confirmed + rejected) : 0,
    cancelRate: rows.length > 0 ? cancelled / rows.length : 0,
    avgPrepMinutes,
    byDay,
    byHour,
    topItems,
    byType,
    byPayment,
  }
}

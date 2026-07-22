'use client'

// Fila de pedidos do comerciante com atualização em tempo real (Supabase Realtime).
// Recebe os pedidos iniciais do servidor (SSR) e assina mudanças em `orders`
// filtradas por business_id; toca um som quando um pedido novo chega.

import { useEffect, useRef, useState } from 'react'
import { Check, Clock, RefreshCw } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

import { changeOrderStatusAction } from '../delivery/actions'

export type QueueOrder = {
  id: string
  code: string | null
  status: string
  order_type: string
  total: number
  customer_name: string | null
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Novo',
  confirmed: 'Aceito',
  preparing: 'Em preparo',
  ready: 'Pronto',
  dispatched: 'A caminho',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  rejected: 'Recusado',
}

const NEXT: Record<string, { status: string; label: string } | undefined> = {
  pending: { status: 'confirmed', label: 'Aceitar' },
  confirmed: { status: 'preparing', label: 'Iniciar preparo' },
  preparing: { status: 'ready', label: 'Marcar pronto' },
  ready: { status: 'dispatched', label: 'Saiu para entrega' },
  dispatched: { status: 'delivered', label: 'Marcar entregue' },
}

const OPEN = ['pending', 'confirmed', 'preparing', 'ready', 'dispatched']

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function OrderQueueLive({ businessId, initial }: { businessId: string; initial: QueueOrder[] }) {
  const [orders, setOrders] = useState<QueueOrder[]>(initial)
  const [now, setNow] = useState(Date.now)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`orders:${businessId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        (payload) => {
          const row = payload.new as QueueOrder
          setOrders((prev) => [row, ...prev.filter((o) => o.id !== row.id)])
          audioRef.current?.play().catch(() => {})
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        (payload) => {
          const row = payload.new as QueueOrder
          setOrders((prev) => prev.map((o) => (o.id === row.id ? { ...o, ...row } : o)))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId])

  const open = orders.filter((o) => OPEN.includes(o.status))

  return (
    <div className="grid gap-3">
      {/* Beep curto em base64 (sem asset externo) */}
      <audio
        ref={audioRef}
        preload="auto"
        src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
      />

      {open.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-200 bg-paper p-6 text-center text-sm text-muted-foreground">
          Nenhum pedido em aberto. Novos pedidos aparecem aqui automaticamente.
        </p>
      ) : (
        open.map((order) => {
          const next = NEXT[order.status]
          const mins = Math.max(0, Math.round((now - new Date(order.created_at).getTime()) / 60000))
          return (
            <article key={order.id} className="rounded-xl border border-ink-100 bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">#{order.code}</span>
                  <span className="rounded-full bg-clay-50 px-2 py-0.5 text-xs font-semibold text-clay-700">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {order.order_type === 'delivery' ? '🛵 Entrega' : order.order_type === 'pickup' ? '📦 Retirada' : '🍽️ Mesa'}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  há {mins}min
                </span>
              </div>

              <p className="mt-2 text-sm">
                {order.customer_name ? <span className="font-medium">{order.customer_name} · </span> : null}
                <span className="font-semibold">{brl(Number(order.total))}</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {next ? (
                  <form action={changeOrderStatusAction}>
                    <input type="hidden" name="business_id" value={businessId} />
                    <input type="hidden" name="order_id" value={order.id} />
                    <input type="hidden" name="status" value={next.status} />
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      <Check className="size-4" aria-hidden="true" />
                      {next.label}
                    </button>
                  </form>
                ) : null}
                {order.status === 'pending' ? (
                  <form action={changeOrderStatusAction}>
                    <input type="hidden" name="business_id" value={businessId} />
                    <input type="hidden" name="order_id" value={order.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-semibold hover:bg-muted"
                    >
                      Recusar
                    </button>
                  </form>
                ) : null}
                <a
                  href={`/painel/comercio/${businessId}/fila/${order.id}`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm hover:bg-muted hover:no-underline"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Detalhes
                </a>
              </div>
            </article>
          )
        })
      )}
    </div>
  )
}

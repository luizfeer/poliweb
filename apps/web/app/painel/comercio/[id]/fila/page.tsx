import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Link } from '@/components/navigation/link'
import { requireRole } from '@/lib/auth'
import { getCurrentCity } from '@/lib/cities'
import { createClient } from '@/lib/supabase/server'

import { BusinessTabs } from '../business-tabs'
import { OrderQueueLive, type QueueOrder } from './order-queue-live'

type PageProps = { params: Promise<{ id: string }> }

export default async function BusinessQueuePage({ params }: PageProps) {
  const [{ id }, city] = await Promise.all([params, getCurrentCity()])
  if (!city) return null

  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] })
  const supabase = await createClient()
  const { data: can } = await supabase.rpc('manages_business', { p_business_id: id })

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', id)
    .eq('city_id', city.id)
    .single()
  if (!business || !can) notFound()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, code, status, order_type, total, customer_name, created_at')
    .eq('business_id', id)
    .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'dispatched'])
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-ink-100 bg-card p-4 shadow-card md:p-5">
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-clay-700 hover:no-underline"
          href={`/painel/comercio/${business.id}`}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para ficha
        </Link>
        <h1 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">Fila de pedidos</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Pedidos chegam aqui em tempo real. Você também pode operar pelo WhatsApp com os botões de cada pedido.
        </p>
      </header>

      <BusinessTabs businessId={business.id} active="fila" />

      <OrderQueueLive businessId={business.id} initial={(orders ?? []) as QueueOrder[]} />
    </div>
  )
}

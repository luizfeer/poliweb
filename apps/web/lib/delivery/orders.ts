// Leituras de delivery para RSC (Server Components). NÃO é Server Action:
// o pedido é gravado direto no Supabase via RPC `create_order` (ver
// `create-order.ts`), e a notificação ao operador é enfileirada por trigger no
// banco — o caminho do pedido não passa pelo Vercel. Ver plano 06.

import { createClient } from '@/lib/supabase/server'

export type OrderingStore = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  coverUrl: string | null
  deliveryEnabled: boolean
  pickupEnabled: boolean
  deliveryFee: number | null
  deliveryTimeMin: number | null
  isOnline: boolean
  busyMode: boolean
}

type BusinessRow = {
  id: string
  slug: string
  name: string
  logo_url: string | null
  cover_url: string | null
  delivery_enabled: boolean
  pickup_enabled: boolean
  delivery_fee: number | null
  delivery_time_min: number | null
}

const SELECT =
  'id, slug, name, logo_url, cover_url, city_id, status, delivery_enabled, pickup_enabled, delivery_fee, delivery_time_min'

/**
 * Lojas para a página "Faça Pedidos": todas com delivery/retirada habilitado e
 * publicadas na cidade, ordenadas pelas que estão ONLINE primeiro. Quem está
 * online vem com `isOnline=true` (aceita pedido agora); as demais aparecem como
 * "fechada agora".
 */
export async function getOrderingStores(cityId: string): Promise<OrderingStore[]> {
  const supabase = await createClient()

  const [{ data: businesses }, { data: presence }] = await Promise.all([
    supabase
      .from('businesses')
      .select(SELECT)
      .eq('city_id', cityId)
      .eq('status', 'published')
      .or('delivery_enabled.eq.true,pickup_enabled.eq.true'),
    supabase.from('business_delivery_status').select('business_id, is_online, busy_mode').eq('is_online', true),
  ])

  if (!businesses) return []

  const onlineById = new Map((presence ?? []).map((p) => [p.business_id, p.busy_mode]))

  return (businesses as BusinessRow[])
    .map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      logoUrl: b.logo_url,
      coverUrl: b.cover_url,
      deliveryEnabled: b.delivery_enabled,
      pickupEnabled: b.pickup_enabled,
      deliveryFee: b.delivery_fee,
      deliveryTimeMin: b.delivery_time_min,
      isOnline: onlineById.has(b.id),
      busyMode: onlineById.get(b.id) ?? false,
    }))
    .sort((a, b) => Number(b.isOnline) - Number(a.isOnline) || a.name.localeCompare(b.name))
}

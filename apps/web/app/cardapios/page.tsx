import { Clock, ShoppingBag, Truck } from 'lucide-react'

import { AppFrame, Band, TabBar } from '@/components/carmo'
import { Link } from '@/components/navigation/link'
import { getCurrentCity } from '@/lib/cities'
import { getOrderingStores, type OrderingStore } from '@/lib/delivery/orders'

export const metadata = {
  title: 'Faça Pedidos · Portal Carmelitano',
  description: 'Peça delivery e retirada dos comércios de Carmo do Rio Claro pelo portal.',
}

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default async function CardapiosPage() {
  const city = await getCurrentCity()
  if (!city) return null

  let stores: OrderingStore[] = []
  try {
    stores = await getOrderingStores(city.id)
  } catch {
    // schema de delivery ainda não aplicado — página renderiza vazia
  }

  const online = stores.filter((s) => s.isOnline)
  const offline = stores.filter((s) => !s.isOnline)

  return (
    <AppFrame>
      <Band>
        <div className="px-1 pb-1 pt-4">
          <h1 className="font-display text-2xl font-extrabold leading-tight text-ink-900">Faça Pedidos</h1>
          <p className="mt-1 text-sm text-ink-600">
            Restaurantes e comércios de {city.name} que estão recebendo pedidos pelo portal.
          </p>
        </div>
      </Band>

      {stores.length === 0 ? (
        <Band>
          <div className="rounded-2xl border border-dashed border-ink-200 bg-paper p-8 text-center">
            <ShoppingBag className="mx-auto size-8 text-ink-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-ink-700">Nenhum comércio recebendo pedidos agora.</p>
            <p className="mt-1 text-xs text-ink-500">
              Volte mais tarde — as lojas abrem nos horários de funcionamento.
            </p>
          </div>
        </Band>
      ) : (
        <>
          {online.length > 0 && (
            <Band>
              <h2 className="px-1 pb-2 pt-2 text-sm font-bold uppercase tracking-wider text-ink-600">
                Abertos agora
              </h2>
              <div className="grid gap-3">
                {online.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            </Band>
          )}

          {offline.length > 0 && (
            <Band>
              <h2 className="px-1 pb-2 pt-2 text-sm font-bold uppercase tracking-wider text-ink-600">
                Fechados no momento
              </h2>
              <div className="grid gap-3 opacity-70">
                {offline.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            </Band>
          )}
        </>
      )}

      <TabBar active="comercio" />
    </AppFrame>
  )
}

function StoreCard({ store }: { store: OrderingStore }) {
  return (
    <Link
      href={`/comercio/negocio/${store.slug}/cardapio`}
      className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-card transition-colors hover:bg-paper-tint hover:no-underline"
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-clay-300 to-clay-700">
        {store.coverUrl || store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.coverUrl ?? store.logoUrl ?? ''} alt="" className="size-full object-cover" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-bold text-ink-900">{store.name}</span>
          {store.isOnline ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
              <span className="size-1.5 rounded-full bg-green-500" /> Aberto
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
              Fechado
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-600">
          {store.deliveryEnabled && (
            <span className="inline-flex items-center gap-1">
              <Truck className="size-3.5" aria-hidden="true" />
              {store.deliveryFee != null
                ? store.deliveryFee > 0
                  ? brl(store.deliveryFee)
                  : 'Frete grátis'
                : 'Delivery'}
            </span>
          )}
          {store.deliveryTimeMin != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />~{store.deliveryTimeMin} min
            </span>
          )}
          {store.pickupEnabled && <span className="inline-flex items-center gap-1">📦 Retirada</span>}
          {store.busyMode && <span className="text-amber-600">Alta demanda</span>}
        </div>
      </div>
    </Link>
  )
}

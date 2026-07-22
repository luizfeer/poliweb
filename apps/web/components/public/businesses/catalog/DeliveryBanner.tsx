import { CreditCard, Package, Truck } from 'lucide-react'
import { brl } from '@/lib/businesses/cart'
import type { DeliverySettings } from '@/lib/businesses/catalog-types'
import { cn } from '@/lib/utils'

type DeliveryBannerProps = {
  delivery: DeliverySettings
  className?: string
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_entrega: 'Cartão na entrega',
}

export function DeliveryBanner({ delivery, className }: DeliveryBannerProps) {
  const paymentMethods = [
    'pix',
    ...(delivery.acceptsCardOnDelivery ? ['cartao_entrega'] : []),
    'dinheiro',
  ]

  return (
    <div className={cn('bg-white border-b border-ink-100', className)}>
      <div className="px-3.5 py-3 flex flex-col gap-2.5">
        {/* Delivery + pickup pills */}
        <div className="flex gap-2 flex-wrap">
          {delivery.deliveryEnabled && (
            <div className="flex items-center gap-1.5 bg-clay-50 rounded-full px-3 py-1.5">
              <Truck size={14} className="text-clay-600" strokeWidth={2} />
              <span className="text-[12px] font-semibold text-clay-700">
                Entrega em ~{delivery.deliveryTimeMin} min
              </span>
              {delivery.deliveryFee !== undefined && delivery.deliveryFee > 0 && (
                <span className="text-[12px] text-clay-500">· {brl(delivery.deliveryFee)}</span>
              )}
              {delivery.deliveryFee === 0 && (
                <span className="text-[11px] font-bold text-cerrado-600 uppercase tracking-wide">GRÁTIS</span>
              )}
            </div>
          )}
          {delivery.pickupEnabled && (
            <div className="flex items-center gap-1.5 bg-cerrado-50 rounded-full px-3 py-1.5">
              <Package size={14} className="text-cerrado-600" strokeWidth={2} />
              <span className="text-[12px] font-semibold text-cerrado-700">
                Retirada em ~{delivery.pickupTimeMin} min
              </span>
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="flex items-center gap-3 text-[12px] text-ink-600 flex-wrap">
          {delivery.deliveryMinOrder && delivery.deliveryMinOrder > 0 && (
            <span>
              Pedido mín.{' '}
              <span className="font-semibold text-ink-800">{brl(delivery.deliveryMinOrder)}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <CreditCard size={12} strokeWidth={2} />
            {paymentMethods.map((m) => PAYMENT_LABELS[m]).join(' · ')}
          </span>
        </div>

        {delivery.orderInstructions && (
          <p className="text-[11px] text-ink-500 leading-snug m-0 border-t border-ink-100 pt-2">
            {delivery.orderInstructions}
          </p>
        )}
      </div>
    </div>
  )
}

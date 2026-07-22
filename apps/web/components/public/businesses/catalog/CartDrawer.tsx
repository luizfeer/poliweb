'use client'

import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { brl } from '@/lib/businesses/cart'
import type { DeliverySettings } from '@/lib/businesses/catalog-types'
import { cn } from '@/lib/utils'
import { useCartContext } from './CartProvider'

type CartDrawerProps = {
  isOpen: boolean
  onClose: () => void
  onCheckout: () => void
  delivery: DeliverySettings
}

export function CartDrawer({ isOpen, onClose, onCheckout, delivery }: CartDrawerProps) {
  const { items, count, itemsTotal, removeItem, updateQty, clearCart } = useCartContext()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      requestAnimationFrame(() => setVisible(false))
    }
  }, [isOpen])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const fee = delivery.deliveryEnabled ? (delivery.deliveryFee ?? 0) : 0
  const total = itemsTotal + fee
  const meetsMinOrder = !delivery.deliveryMinOrder || itemsTotal >= delivery.deliveryMinOrder

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[90] bg-ink-900/50 transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={handleClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed bottom-0 inset-x-0 z-[90]',
          'max-w-[430px] mx-auto',
          'bg-white rounded-t-2xl',
          'flex flex-col max-h-[90svh]',
          'transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          visible ? 'translate-y-0' : 'translate-y-full',
        )}
        role="dialog"
        aria-modal
        aria-label="Sacola"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} strokeWidth={2} className="text-clay-500" />
            <h2 className="text-[17px] font-bold text-ink-900 m-0">
              Sacola{count > 0 ? ` · ${count} ${count === 1 ? 'item' : 'itens'}` : ''}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={() => clearCart()}
                className="text-[12px] text-ink-400 hover:text-destructive transition-colors flex items-center gap-1"
                aria-label="Limpar sacola"
              >
                <Trash2 size={13} strokeWidth={2} />
                Limpar
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-paper-deep flex items-center justify-center hover:bg-paper-tint transition-colors"
              aria-label="Fechar sacola"
            >
              <X size={16} strokeWidth={2} className="text-ink-700" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-ink-100 mx-4" />

        {/* Item list */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <ShoppingBag size={48} strokeWidth={1} className="text-ink-300" />
            <p className="text-[14px] text-ink-500 m-0">
              Sua sacola está vazia.<br />Escolha itens do cardápio para começar.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {items.map((item) => (
              <div key={item.cartItemId} className="px-4 py-3.5 border-b border-ink-100">
                {/* Item name + remove */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[14px] font-semibold text-ink-900 leading-snug flex-1">
                    {item.name}
                  </span>
                  <button
                    onClick={() => removeItem(item.cartItemId)}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-destructive/10 text-ink-400 hover:text-destructive transition-colors"
                    aria-label={`Remover ${item.name}`}
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>

                {/* Options */}
                {item.options.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {item.options.map((opt) => (
                      <p key={`${opt.groupId}-${opt.valueId}`} className="text-[12px] text-ink-500 m-0">
                        {opt.groupName}: <span className="text-ink-700">{opt.valueName}</span>
                        {opt.priceAdd > 0 && (
                          <span className="text-ink-400"> +{brl(opt.priceAdd)}</span>
                        )}
                      </p>
                    ))}
                  </div>
                )}

                {item.notes && (
                  <p className="text-[12px] text-ink-400 italic m-0 mt-1">Obs.: {item.notes}</p>
                )}

                {/* Qty + price */}
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-2 bg-paper-deep rounded-full px-1 py-0.5">
                    <button
                      onClick={() => updateQty(item.cartItemId, -1)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      aria-label="Diminuir"
                    >
                      <Minus size={14} strokeWidth={2.5} className="text-ink-700" />
                    </button>
                    <span className="text-[13px] font-bold text-ink-900 w-4 text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.cartItemId, 1)}
                      className="w-7 h-7 rounded-full bg-clay-500 flex items-center justify-center hover:bg-clay-600 transition-colors"
                      aria-label="Aumentar"
                    >
                      <Plus size={14} strokeWidth={2.5} className="text-white" />
                    </button>
                  </div>
                  <span className="text-[14px] font-bold text-ink-900">{brl(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer: totals + CTA */}
        {items.length > 0 && (
          <div className="flex-shrink-0 bg-white border-t border-ink-100">
            {/* Totals */}
            <div className="px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-[13px]">
                <span className="text-ink-600">Subtotal</span>
                <span className="font-semibold text-ink-900">{brl(itemsTotal)}</span>
              </div>
              {fee > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-ink-600">Frete estimado</span>
                  <span className="font-semibold text-ink-900">{brl(fee)}</span>
                </div>
              )}
              <div className="flex justify-between text-[15px] pt-1 border-t border-ink-100">
                <span className="font-bold text-ink-900">Total</span>
                <span className="font-bold text-ink-900">{brl(total)}</span>
              </div>
            </div>

            {/* Min order warning */}
            {!meetsMinOrder && delivery.deliveryMinOrder && (
              <div className="mx-4 mb-2 px-3 py-2 bg-sun-100 rounded-lg">
                <p className="text-[12px] text-ink-700 m-0">
                  Pedido mínimo para delivery:{' '}
                  <span className="font-semibold">{brl(delivery.deliveryMinOrder)}</span>
                  {' '}— faltam{' '}
                  <span className="font-semibold">{brl(delivery.deliveryMinOrder - itemsTotal)}</span>.
                </p>
              </div>
            )}

            {/* Checkout button */}
            <div className="px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-1">
              <button
                type="button"
                onClick={() => {
                  handleClose()
                  setTimeout(onCheckout, 320)
                }}
                disabled={!meetsMinOrder}
                className={cn(
                  'w-full flex items-center justify-between',
                  'bg-clay-500 hover:bg-clay-600 active:bg-clay-700',
                  'disabled:bg-ink-300 disabled:cursor-default',
                  'text-white font-bold text-[14px]',
                  'rounded-2xl px-4 py-3.5 transition-colors duration-150',
                )}
              >
                <span>Finalizar pedido</span>
                <span>{brl(total)}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

'use client'

import { ShoppingCart } from 'lucide-react'
import { brl } from '@/lib/businesses/cart'
import { cn } from '@/lib/utils'
import { useCartContext } from './CartProvider'

type CartBarProps = {
  deliveryFee?: number
  onOpenCart: () => void
}

export function CartBar({ onOpenCart }: CartBarProps) {
  const { count, itemsTotal, hydrated } = useCartContext()

  if (!hydrated || count === 0) return null

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 flex justify-center md:bottom-0',
        'pb-[max(12px,env(safe-area-inset-bottom))] px-3',
        'pointer-events-none',
      )}
    >
      <button
        type="button"
        onClick={onOpenCart}
        className={cn(
          'pointer-events-auto w-full max-w-[400px]',
          'flex items-center gap-3 px-4 py-3.5',
          'bg-clay-500 hover:bg-clay-600 active:bg-clay-700',
          'rounded-2xl shadow-[0_4px_20px_rgba(224,86,27,0.4)]',
          'transition-colors duration-150',
        )}
      >
        {/* Cart icon + badge */}
        <div className="relative flex-shrink-0">
          <ShoppingCart size={22} strokeWidth={2} className="text-white" />
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-sun-500 text-[10px] font-bold text-ink-900 flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        </div>

        <span className="flex-1 text-[14px] font-bold text-white text-left">Ver sacola</span>

        <span className="text-[14px] font-bold text-white">{brl(itemsTotal)}</span>
      </button>
    </div>
  )
}

'use client'

import { createContext, useContext } from 'react'
import { useCart } from '@/lib/businesses/cart'

type CartContextValue = ReturnType<typeof useCart>

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({
  businessId,
  children,
}: {
  businessId: string
  children: React.ReactNode
}) {
  const cart = useCart(businessId)
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartContext must be inside CartProvider')
  return ctx
}

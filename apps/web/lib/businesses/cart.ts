'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CartItem, CartItemOption, CatalogItem, CheckoutFormData, DeliverySettings } from './catalog-types'

export const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function cartKey(businessId: string) {
  return `carmo_cart_${businessId}`
}

function calcItemSubtotal(unitPrice: number, options: CartItemOption[], qty: number) {
  const optionsTotal = options.reduce((s, o) => s + o.priceAdd, 0)
  return (unitPrice + optionsTotal) * qty
}

export function buildCartItem(
  item: CatalogItem,
  qty: number,
  options: CartItemOption[],
  notes?: string,
): CartItem {
  const unitPrice = item.promotionalPrice ?? item.price
  return {
    cartItemId: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    catalogItemId: item.id,
    name: item.name,
    unitPrice,
    qty,
    options,
    subtotal: calcItemSubtotal(unitPrice, options, qty),
    notes: notes?.trim() || undefined,
    photoUrl: item.photoUrl,
  }
}

export function buildWhatsAppMessage(
  businessName: string,
  businessWhatsapp: string,
  items: CartItem[],
  form: CheckoutFormData,
  delivery: DeliverySettings,
): string {
  const fee = form.orderType === 'delivery' ? (delivery.deliveryFee ?? 0) : 0
  const itemsTotal = items.reduce((s, i) => s + i.subtotal, 0)
  const total = itemsTotal + fee

  const lines: string[] = [
    `*Pedido via Portal Carmelitano — ${businessName}*`,
    ``,
  ]

  for (const item of items) {
    lines.push(`${item.qty}× ${item.name}`)
    for (const opt of item.options) {
      if (opt.priceAdd > 0) {
        lines.push(`   ${opt.groupName}: ${opt.valueName} (+${brl(opt.priceAdd)})`)
      } else {
        lines.push(`   ${opt.groupName}: ${opt.valueName}`)
      }
    }
    if (item.notes) lines.push(`   Obs.: ${item.notes}`)
    lines.push(`   ${brl(item.subtotal)}`)
    lines.push(``)
  }

  lines.push(`----------------------------`)
  lines.push(`Subtotal: ${brl(itemsTotal)}`)
  if (fee > 0) lines.push(`Frete: ${brl(fee)}`)
  lines.push(`*Total: ${brl(total)}*`)
  lines.push(``)
  lines.push(`Tipo: ${form.orderType === 'delivery' ? 'Delivery' : 'Retirada no local'}`)
  if (form.orderType === 'delivery' && form.address) {
    lines.push(`Endereço: ${form.address}`)
  }

  const paymentLabels: Record<string, string> = {
    pix: `PIX${delivery.pixKey ? ` (chave: ${delivery.pixKey})` : ''}`,
    dinheiro: 'Dinheiro',
    cartao_entrega: 'Cartão na entrega',
  }
  lines.push(`Pagamento: ${paymentLabels[form.paymentChoice] ?? form.paymentChoice}`)
  if (form.paymentChoice === 'dinheiro' && form.changeFor) {
    lines.push(`Troco para: R$ ${form.changeFor}`)
  }
  if (form.notes.trim()) lines.push(`Obs. geral: ${form.notes.trim()}`)
  lines.push(``)
  lines.push(`_Enviado pelo carmorc.com.br_`)

  return lines.join('\n')
}

// ── Hook ─────────────────────────────────────────────────────────────────────

type UseCartReturn = {
  items: CartItem[]
  count: number
  itemsTotal: number
  hydrated: boolean
  addItem: (item: CartItem) => void
  removeItem: (cartItemId: string) => void
  updateQty: (cartItemId: string, delta: number) => void
  clearCart: () => void
}

export function useCart(businessId: string): UseCartReturn {
  const [hydrated, setHydrated] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])
  const skipPersist = useRef(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(cartKey(businessId))
      if (raw) {
        requestAnimationFrame(() => setItems(JSON.parse(raw)))
      }
    } catch {
      // ignore
    }
    requestAnimationFrame(() => setHydrated(true))
    skipPersist.current = false
  }, [businessId])

  useEffect(() => {
    if (skipPersist.current) return
    try {
      localStorage.setItem(cartKey(businessId), JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items, businessId])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item])
  }, [])

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId))
  }, [])

  const updateQty = useCallback((cartItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.cartItemId !== cartItemId) return i
          const newQty = i.qty + delta
          if (newQty <= 0) return null
          return { ...i, qty: newQty, subtotal: calcItemSubtotal(i.unitPrice, i.options, newQty) }
        })
        .filter(Boolean) as CartItem[],
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const itemsTotal = items.reduce((s, i) => s + i.subtotal, 0)
  const count = items.reduce((s, i) => s + i.qty, 0)

  return { items, count, itemsTotal, hydrated, addItem, removeItem, updateQty, clearCart }
}

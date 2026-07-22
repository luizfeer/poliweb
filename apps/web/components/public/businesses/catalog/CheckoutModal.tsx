'use client'

import { ChevronLeft, Loader2, Package, Send, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { brl, buildWhatsAppMessage } from '@/lib/businesses/cart'
import type { CheckoutFormData, DeliverySettings } from '@/lib/businesses/catalog-types'
import { createOrder } from '@/lib/delivery/create-order'
import { cn } from '@/lib/utils'
import { useCartContext } from './CartProvider'

type CheckoutModalProps = {
  isOpen: boolean
  onClose: () => void
  businessId: string
  businessName: string
  businessWhatsapp: string
  delivery: DeliverySettings
  /** Pro/trial: pedido nativo (createOrder). Free: vai direto pelo WhatsApp. */
  isPro: boolean
}

const PAYMENT_MAP = {
  pix: 'pix',
  dinheiro: 'cash',
  cartao_entrega: 'card_on_delivery',
} as const

function RadioOption({
  checked,
  onChange,
  label,
  description,
  icon,
}: {
  checked: boolean
  onChange: () => void
  label: string
  description?: string
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-colors duration-150',
        checked ? 'border-clay-500 bg-clay-50' : 'border-ink-200 bg-white hover:bg-paper-tint',
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors duration-150',
          checked ? 'border-clay-500 bg-clay-500' : 'border-ink-300 bg-white',
        )}
      >
        {checked && <div className="w-2 h-2 rounded-full bg-white mx-auto mt-[3px]" />}
      </div>
      <div className="flex-shrink-0 text-clay-600">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-[14px] font-semibold text-ink-900">{label}</span>
        {description && (
          <p className="text-[12px] text-ink-500 m-0 mt-0.5 leading-snug">{description}</p>
        )}
      </div>
    </button>
  )
}

export function CheckoutModal({
  isOpen,
  onClose,
  businessId,
  businessName,
  businessWhatsapp,
  delivery,
  isPro,
}: CheckoutModalProps) {
  const { items, itemsTotal, clearCart } = useCartContext()
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState<CheckoutFormData>({
    orderType: delivery.deliveryEnabled ? 'delivery' : 'pickup',
    address: '',
    paymentChoice: 'pix',
    changeFor: '',
    notes: '',
  })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [orderCode, setOrderCode] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setSent(false)
        setError(null)
        setOrderCode(null)
        requestAnimationFrame(() => setVisible(true))
      })
    } else {
      requestAnimationFrame(() => setVisible(false))
    }
  }, [isOpen])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  function setField<K extends keyof CheckoutFormData>(key: K, value: CheckoutFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const fee = form.orderType === 'delivery' ? (delivery.deliveryFee ?? 0) : 0
  const total = itemsTotal + fee

  const canSend =
    items.length > 0 &&
    (form.orderType === 'pickup' || (form.orderType === 'delivery' && form.address.trim().length > 5))

  function openWhatsAppFallback() {
    if (!businessWhatsapp) return
    const phone = businessWhatsapp.replace(/\D/g, '')
    const message = buildWhatsAppMessage(businessName, phone, items, form, delivery)
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener')
  }

  async function handleSend() {
    if (!canSend || sending) return

    // Free: pedido vai pelo WhatsApp (não grava no banco — sem relatórios).
    if (!isPro) {
      if (!businessWhatsapp) {
        setError('Este estabelecimento não configurou o WhatsApp para pedidos.')
        return
      }
      openWhatsAppFallback()
      setSent(true)
      clearCart()
      setTimeout(handleClose, 1200)
      return
    }

    setSending(true)
    setError(null)

    const result = await createOrder({
      businessId,
      orderType: form.orderType,
      items: items.map((i) => ({
        catalogItemId: i.catalogItemId,
        qty: i.qty,
        notes: i.notes,
        options: i.options.map((o) => ({ groupId: o.groupId, valueId: o.valueId })),
      })),
      paymentMethod: PAYMENT_MAP[form.paymentChoice],
      deliveryAddress: form.orderType === 'delivery' ? { text: form.address } : null,
      notes: form.notes.trim() || undefined,
      changeFor: form.paymentChoice === 'dinheiro' && form.changeFor ? Number(form.changeFor) : null,
      channel: 'web',
    })

    setSending(false)

    if (result.ok) {
      setOrderCode(result.code)
      setSent(true)
      clearCart()
      setTimeout(handleClose, 2400)
      return
    }

    // Falha (loja offline, sem catálogo migrado, etc.): cai pro WhatsApp se houver número.
    if (businessWhatsapp) {
      openWhatsAppFallback()
      setSent(true)
      clearCart()
      setTimeout(handleClose, 1200)
    } else {
      setError(result.error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[90] bg-ink-900/60 transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={handleClose}
        aria-hidden
      />

      {/* Full-height modal (from top, not bottom) */}
      <div
        className={cn(
          'fixed inset-0 z-[90] flex items-end justify-center',
          'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'pointer-events-auto',
            'w-full max-w-[430px] h-[100svh]',
            'bg-paper flex flex-col',
            'transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
            visible ? 'translate-y-0' : 'translate-y-full',
          )}
          role="dialog"
          aria-modal
          aria-label="Finalizar pedido"
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-ink-100 flex items-center gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3">
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-paper-deep flex items-center justify-center hover:bg-paper-tint transition-colors"
              aria-label="Voltar"
            >
              <ChevronLeft size={20} strokeWidth={2} className="text-ink-700" />
            </button>
            <h1 className="text-[17px] font-bold text-ink-900 m-0">Finalizar pedido</h1>
          </div>

          {/* Scrollable form */}
          <div className="flex-1 overflow-y-auto overscroll-contain pb-6">
            {/* ── Order type ─── */}
            <div className="px-4 pt-5 pb-2">
              <h2 className="text-[13px] font-bold text-ink-600 uppercase tracking-wider mb-3">
                Tipo de pedido
              </h2>
              <div className="space-y-2">
                {delivery.deliveryEnabled && (
                  <RadioOption
                    checked={form.orderType === 'delivery'}
                    onChange={() => setField('orderType', 'delivery')}
                    label="Delivery"
                    description={`Entrega em ~${delivery.deliveryTimeMin} min · ${fee > 0 ? brl(fee) + ' de frete' : 'frete grátis'}`}
                    icon={<Truck size={18} strokeWidth={2} />}
                  />
                )}
                {delivery.pickupEnabled && (
                  <RadioOption
                    checked={form.orderType === 'pickup'}
                    onChange={() => setField('orderType', 'pickup')}
                    label="Retirada no local"
                    description={`Pronto em ~${delivery.pickupTimeMin} min · sem frete`}
                    icon={<Package size={18} strokeWidth={2} />}
                  />
                )}
              </div>
            </div>

            {/* ── Address ─── */}
            {form.orderType === 'delivery' && (
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-[13px] font-bold text-ink-600 uppercase tracking-wider mb-3">
                  Endereço de entrega
                </h2>
                <textarea
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Rua, número, bairro, ponto de referência"
                  rows={3}
                  className={cn(
                    'w-full text-[14px] text-ink-900 placeholder:text-ink-400',
                    'border rounded-xl px-3.5 py-3 resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-clay-500/30 focus:border-clay-500',
                    form.address.trim().length > 0 && form.address.trim().length <= 5
                      ? 'border-discount'
                      : 'border-ink-200',
                  )}
                />
                {form.address.trim().length > 0 && form.address.trim().length <= 5 && (
                  <p className="text-[12px] text-discount m-0 mt-1">
                    Informe o endereço completo para continuar.
                  </p>
                )}
              </div>
            )}

            {/* ── Payment ─── */}
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-[13px] font-bold text-ink-600 uppercase tracking-wider mb-3">
                Forma de pagamento
              </h2>
              <div className="space-y-2">
                <RadioOption
                  checked={form.paymentChoice === 'pix'}
                  onChange={() => setField('paymentChoice', 'pix')}
                  label="PIX"
                  description={delivery.pixKey ? `Chave: ${delivery.pixKey}` : undefined}
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/>
                    </svg>
                  }
                />
                <RadioOption
                  checked={form.paymentChoice === 'dinheiro'}
                  onChange={() => setField('paymentChoice', 'dinheiro')}
                  label="Dinheiro"
                  description="Pagamento na entrega"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                    </svg>
                  }
                />
                {delivery.acceptsCardOnDelivery && (
                  <RadioOption
                    checked={form.paymentChoice === 'cartao_entrega'}
                    onChange={() => setField('paymentChoice', 'cartao_entrega')}
                    label="Cartão na entrega"
                    description="Débito ou crédito"
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                      </svg>
                    }
                  />
                )}
              </div>
            </div>

            {/* ── Change ─── */}
            {form.paymentChoice === 'dinheiro' && (
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-[13px] font-bold text-ink-600 uppercase tracking-wider mb-2">
                  Troco para quanto?
                </h2>
                <input
                  type="number"
                  value={form.changeFor}
                  onChange={(e) => setField('changeFor', e.target.value)}
                  placeholder={`Ex.: ${Math.ceil(total / 10) * 10},00 (opcional)`}
                  className="w-full text-[14px] text-ink-900 placeholder:text-ink-400 border border-ink-200 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-clay-500/30 focus:border-clay-500"
                />
              </div>
            )}

            {/* ── Notes ─── */}
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-[13px] font-bold text-ink-600 uppercase tracking-wider mb-2">
                Observações gerais
              </h2>
              <textarea
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Sem glúten, alergia, portão azul…"
                rows={2}
                maxLength={300}
                className="w-full text-[14px] text-ink-900 placeholder:text-ink-400 border border-ink-200 rounded-xl px-3.5 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-clay-500/30 focus:border-clay-500"
              />
            </div>

            {/* ── Summary ─── */}
            <div className="mx-4 mt-4 rounded-xl bg-white border border-ink-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-ink-100">
                <h2 className="text-[13px] font-bold text-ink-900 m-0">Resumo</h2>
              </div>
              <div className="px-4 py-3 space-y-2">
                {items.map((item) => (
                  <div key={item.cartItemId} className="flex justify-between text-[13px]">
                    <span className="text-ink-700">
                      {item.qty}× {item.name}
                    </span>
                    <span className="font-semibold text-ink-900">{brl(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-ink-100 space-y-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-ink-600">Subtotal</span>
                  <span className="text-ink-900">{brl(itemsTotal)}</span>
                </div>
                {fee > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ink-600">Frete</span>
                    <span className="text-ink-900">{brl(fee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[15px] font-bold pt-1 border-t border-ink-100">
                  <span>Total</span>
                  <span className="text-clay-600">{brl(total)}</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            {delivery.orderInstructions && (
              <p className="px-4 pt-3 text-[12px] text-ink-500 m-0">{delivery.orderInstructions}</p>
            )}
          </div>

          {/* Footer CTA */}
          <div className="flex-shrink-0 bg-white border-t border-ink-100 px-4 py-3 pb-[max(16px,env(safe-area-inset-bottom))]">
            {error && (
              <p className="mb-2 text-center text-[13px] font-medium text-discount">{error}</p>
            )}
            {sent ? (
              <div className="w-full flex flex-col items-center justify-center gap-1 bg-cerrado-500 text-white font-bold text-[14px] rounded-2xl px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                  Pedido enviado!
                </div>
                {orderCode != null && (
                  <span className="text-[12px] font-medium opacity-90">
                    Pedido #{orderCode} · acompanhe o status pelo app
                  </span>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend || sending}
                className={cn(
                  'w-full flex items-center justify-between',
                  'bg-clay-600 hover:bg-clay-700 active:bg-clay-700',
                  'disabled:bg-ink-300 disabled:cursor-default',
                  'text-white font-bold text-[14px]',
                  'rounded-2xl px-4 py-3.5 transition-colors duration-150',
                )}
              >
                <div className="flex items-center gap-2">
                  {sending ? (
                    <Loader2 size={18} strokeWidth={2.2} className="animate-spin" />
                  ) : (
                    <Send size={18} strokeWidth={2.2} />
                  )}
                  <span>{sending ? 'Enviando…' : 'Fazer pedido'}</span>
                </div>
                <span>{brl(total)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, ChevronLeft, MapPin, Star } from 'lucide-react'
import { useState } from 'react'
import type { Business } from '@/lib/businesses/types'
import {
  businessPublicMetricsIncludeGoogle,
  GOOGLE_PUBLIC_METRICS_TOOLTIP,
} from '@/lib/businesses/google-public-metrics'
import type { Catalog, CatalogItem, DeliverySettings } from '@/lib/businesses/catalog-types'
import { CartBar } from './CartBar'
import { CartDrawer } from './CartDrawer'
import { CartProvider } from './CartProvider'
import { CatalogNav } from './CatalogNav'
import { CatalogSection } from './CatalogSection'
import { CheckoutModal } from './CheckoutModal'
import { DeliveryBanner } from './DeliveryBanner'
import { ItemDetailModal } from './ItemDetailModal'
import { cn } from '@/lib/utils'

type CatalogShellProps = {
  business: Business
  catalog: Catalog
  delivery: DeliverySettings
  backHref: string
  /** Pro/trial: checkout cria pedido nativo. Free: vai pelo WhatsApp. Default false. */
  isPro?: boolean
}

function CatalogShellInner({
  business,
  catalog,
  delivery,
  backHref,
  isPro = false,
}: CatalogShellProps) {
  const [activeItem, setActiveItem] = useState<CatalogItem | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const googleTip = businessPublicMetricsIncludeGoogle(business) ? GOOGLE_PUBLIC_METRICS_TOOLTIP : undefined

  return (
    <>
      {/* ── Sticky top nav ───────────────────────────────── */}
      <div
        data-hide-in-embedded-app
        className="sticky top-0 z-40 flex items-center gap-2 border-b border-ink-100 bg-white px-3 py-2.5 shadow-[0_1px_3px_rgba(25,25,25,0.06)]"
      >
        <Link
          href={backHref}
          className="w-9 h-9 rounded-full bg-paper-deep flex items-center justify-center flex-shrink-0 hover:bg-paper-tint transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft size={20} strokeWidth={2} className="text-ink-700" />
        </Link>
        <div className="flex-1 min-w-0">
          <span className="text-[14px] font-semibold text-ink-900 truncate block">
            {business.name}
          </span>
          <span className="text-[11px] text-ink-500">{catalog.name}</span>
        </div>
      </div>

      {/* ── Business hero ────────────────────────────────── */}
      <div className="bg-white">
        {/* Cover */}
        <div className="relative h-[200px] bg-gradient-to-br from-clay-300 to-clay-700 overflow-hidden">
          {business.coverUrl && (
            <Image
              src={business.coverUrl}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="430px"
              priority
            />
          )}
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* Category / rating badge overlaid on cover */}
          {business.rating !== undefined && (
            <div
              className={cn(
                'absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 shadow backdrop-blur-sm',
                googleTip && 'cursor-help',
              )}
              title={googleTip}
            >
              <Star size={12} className="fill-sun-500 text-sun-500" strokeWidth={3} />
              <span className="text-[12px] font-bold text-ink-900">{business.rating.toFixed(1)}</span>
              {business.reviewsCount ? (
                <span className="text-[11px] text-ink-500">({business.reviewsCount})</span>
              ) : null}
            </div>
          )}
        </div>

        {/* Business info */}
        <div className="px-4 pt-3.5 pb-3">
          <h1 className="font-display font-extrabold text-[22px] leading-tight text-ink-900 m-0 flex items-center gap-1.5">
            {business.name}
            {business.verified && (
              <BadgeCheck size={20} className="text-sky-700" strokeWidth={2.4} />
            )}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-[13px] text-ink-600 flex-wrap">
            {business.categories[0] && (
              <span className="text-clay-600 font-semibold capitalize">
                {business.categories[0].replace(/-/g, ' ')}
              </span>
            )}
            {business.district && (
              <span className="flex items-center gap-0.5">
                <MapPin size={12} strokeWidth={2.2} />
                {business.district}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Delivery info ────────────────────────────────── */}
      <DeliveryBanner delivery={delivery} />

      {/* ── Section nav (sticky below top nav) ──────────── */}
      <CatalogNav sections={catalog.sections} />

      {/* ── Catalog content ──────────────────────────────── */}
      <div className="pb-[100px]">
        {catalog.sections.map((section) => (
          <CatalogSection
            key={section.id}
            section={section}
            onItemPress={(item) => setActiveItem(item)}
          />
        ))}

        {/* Footer note */}
        <div className="px-4 py-6 text-center">
          <p className="text-[12px] text-ink-400 m-0 leading-relaxed">
            Os preços e a disponibilidade dos itens podem variar.<br />
            Pedido enviado diretamente ao {business.name}.
          </p>
        </div>
      </div>

      {/* ── Floating cart bar ────────────────────────────── */}
      <CartBar
        deliveryFee={delivery.deliveryFee}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* ── Modals ───────────────────────────────────────── */}
      <ItemDetailModal
        item={activeItem}
        onClose={() => setActiveItem(null)}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => setCheckoutOpen(true)}
        delivery={delivery}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        businessId={business.id}
        businessName={business.name}
        businessWhatsapp={business.whatsapp ?? ''}
        delivery={delivery}
        isPro={isPro}
      />
    </>
  )
}

export function CatalogShell(props: CatalogShellProps) {
  return (
    <CartProvider businessId={props.business.id}>
      <CatalogShellInner {...props} />
    </CartProvider>
  )
}

'use client'

import Image from 'next/image'
import { Flame, Leaf, Plus, Sparkles, Star, Wheat } from 'lucide-react'
import { brl } from '@/lib/businesses/cart'
import type { CatalogItem, ItemTag } from '@/lib/businesses/catalog-types'
import { cn } from '@/lib/utils'

const TAG_CONFIG: Record<ItemTag, { label: string; icon: React.ReactNode; className: string }> = {
  vegano: {
    label: 'Vegano',
    icon: <Leaf size={10} strokeWidth={2.2} />,
    className: 'bg-cerrado-100 text-cerrado-700',
  },
  vegetariano: {
    label: 'Vegetariano',
    icon: <Leaf size={10} strokeWidth={2.2} />,
    className: 'bg-cerrado-50 text-cerrado-600',
  },
  sem_gluten: {
    label: 'Sem glúten',
    icon: <Wheat size={10} strokeWidth={2.2} />,
    className: 'bg-sun-100 text-ink-700',
  },
  picante: {
    label: 'Picante',
    icon: <Flame size={10} strokeWidth={2.2} />,
    className: 'bg-discount/10 text-discount',
  },
  destaque: {
    label: 'Destaque',
    icon: <Star size={10} strokeWidth={2.2} className="fill-current" />,
    className: 'bg-sun-100 text-ink-700',
  },
  novo: {
    label: 'Novo',
    icon: <Sparkles size={10} strokeWidth={2.2} />,
    className: 'bg-sky-100 text-sky-700',
  },
  mais_pedido: {
    label: 'Mais pedido',
    icon: <Star size={10} strokeWidth={2.2} className="fill-current" />,
    className: 'bg-clay-50 text-clay-600',
  },
}

/** Placeholder colorido baseado no nome do item quando não há foto. */
function PhotoPlaceholder({ name }: { name: string }) {
  const code = name.charCodeAt(0) % 6
  const gradients = [
    'from-clay-300 to-clay-500',
    'from-cerrado-300 to-cerrado-500',
    'from-sun-300 to-clay-300',
    'from-sky-500 to-cerrado-500',
    'from-clay-200 to-sun-300',
    'from-cerrado-200 to-sky-500',
  ]
  return (
    <div className={cn('w-full h-full bg-gradient-to-br', gradients[code])} aria-hidden />
  )
}

type CatalogItemCardProps = {
  item: CatalogItem
  onPress: (item: CatalogItem) => void
}

export function CatalogItemCard({ item, onPress }: CatalogItemCardProps) {
  const activePrice = item.promotionalPrice ?? item.price
  const hasPromo = item.promotionalPrice !== undefined && item.promotionalPrice < item.price
  const discountPct = hasPromo
    ? Math.round(((item.price - item.promotionalPrice!) / item.price) * 100)
    : 0

  return (
    <button
      type="button"
      onClick={() => item.available && onPress(item)}
      disabled={!item.available}
      className={cn(
        'w-full text-left flex items-start gap-3 px-3.5 py-3.5',
        'border-b border-ink-100 last:border-0',
        'bg-white transition-colors duration-100',
        item.available
          ? 'active:bg-paper-tint hover:bg-paper-tint cursor-pointer'
          : 'opacity-50 cursor-default',
      )}
      aria-label={`${item.name}, ${brl(activePrice)}${!item.available ? ', indisponível' : ''}`}
    >
      {/* Text content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {item.tags.slice(0, 2).map((tag) => {
              const cfg = TAG_CONFIG[tag]
              if (!cfg) return null
              return (
                <span
                  key={tag}
                  className={cn(
                    'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                    cfg.className,
                  )}
                >
                  {cfg.icon}
                  {cfg.label}
                </span>
              )
            })}
          </div>
        )}

        <span className="text-[14px] font-semibold text-ink-900 leading-snug">{item.name}</span>

        {item.description && (
          <p className="text-[12px] text-ink-600 leading-snug line-clamp-2 m-0">
            {item.description}
          </p>
        )}

        {item.serves && (
          <span className="text-[11px] text-ink-400">{item.serves}</span>
        )}

        {/* Price row */}
        <div className="flex items-center gap-2 mt-1">
          {hasPromo && (
            <span className="text-[11px] text-ink-400 line-through">{brl(item.price)}</span>
          )}
          <span className="text-[15px] font-bold text-ink-900">{brl(activePrice)}</span>
          {hasPromo && discountPct > 0 && (
            <span className="text-[10px] font-bold text-white bg-discount rounded-sm px-1 py-0.5 uppercase">
              -{discountPct}%
            </span>
          )}
        </div>
      </div>

      {/* Photo + add button */}
      <div className="relative flex-shrink-0 w-[88px] h-[88px] rounded-lg overflow-hidden bg-paper-deep">
        {item.photoUrl ? (
          <Image src={item.photoUrl} alt="" fill unoptimized className="object-cover" sizes="88px" />
        ) : (
          <PhotoPlaceholder name={item.name} />
        )}

        {!item.available && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-[10px] font-bold text-ink-600 text-center px-1">Indisponível</span>
          </div>
        )}

        {item.available && (
          <div className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-clay-500 flex items-center justify-center shadow-md">
            <Plus size={16} strokeWidth={2.5} className="text-white" />
          </div>
        )}
      </div>
    </button>
  )
}

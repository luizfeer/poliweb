'use client'

import Image from 'next/image'
import { Minus, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { buildCartItem, brl } from '@/lib/businesses/cart'
import type { CartItemOption, CatalogItem, OptionGroup } from '@/lib/businesses/catalog-types'
import { cn } from '@/lib/utils'
import { useCartContext } from './CartProvider'

type ItemDetailModalProps = {
  item: CatalogItem | null
  onClose: () => void
}

function OptionGroupSelector({
  group,
  selected,
  onChange,
}: {
  group: OptionGroup
  selected: Record<string, string[]>
  onChange: (groupId: string, valueIds: string[]) => void
}) {
  const isSingle = group.maxChoices === 1
  const required = group.minChoices > 0
  const current = selected[group.id] ?? []

  function toggle(valueId: string) {
    if (isSingle) {
      onChange(group.id, [valueId])
    } else {
      if (current.includes(valueId)) {
        onChange(group.id, current.filter((id) => id !== valueId))
      } else if (current.length < group.maxChoices) {
        onChange(group.id, [...current, valueId])
      }
    }
  }

  return (
    <div className="border-t border-ink-100">
      <div className="px-4 py-3 bg-paper-deep">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-bold text-ink-900">{group.name}</span>
          <span
            className={cn(
              'text-[11px] font-semibold px-2 py-0.5 rounded-full',
              required ? 'bg-clay-100 text-clay-700' : 'bg-paper text-ink-500',
            )}
          >
            {required ? 'Obrigatório' : 'Opcional'}
          </span>
        </div>
        {group.description && (
          <p className="text-[12px] text-ink-500 m-0 mt-0.5">{group.description}</p>
        )}
      </div>

      <div className="bg-white">
        {group.values
          .filter((v) => v.available)
          .map((v) => {
            const isChecked = current.includes(v.id)
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => toggle(v.id)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3.5',
                  'border-b border-ink-100 last:border-0',
                  'transition-colors duration-100',
                  isChecked ? 'bg-clay-50' : 'hover:bg-paper-tint active:bg-paper-tint',
                )}
              >
                <span className="text-[14px] text-ink-900 text-left">{v.name}</span>
                <div className="flex items-center gap-3">
                  {v.priceAdd > 0 && (
                    <span className="text-[13px] text-ink-600">+{brl(v.priceAdd)}</span>
                  )}
                  {/* Radio / Checkbox indicator */}
                  <div
                    className={cn(
                      'flex-shrink-0 transition-colors duration-100',
                      isSingle
                        ? cn(
                            'w-5 h-5 rounded-full border-2',
                            isChecked
                              ? 'border-clay-500 bg-clay-500'
                              : 'border-ink-300 bg-white',
                          )
                        : cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center',
                            isChecked
                              ? 'border-clay-500 bg-clay-500'
                              : 'border-ink-300 bg-white',
                          ),
                    )}
                  >
                    {isChecked && isSingle && (
                      <div className="w-2 h-2 rounded-full bg-white mx-auto mt-[3px]" />
                    )}
                    {isChecked && !isSingle && (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
      </div>
    </div>
  )
}

export function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const { addItem } = useCartContext()
  const [visible, setVisible] = useState(false)
  const [qty, setQty] = useState(1)
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [notes, setNotes] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const isOpen = item !== null

  // Animação: abre/fecha
  useEffect(() => {
    if (item === null) return
    // Pré-seleciona a primeira opção de grupos obrigatórios
    const defaults: Record<string, string[]> = {}
    item.optionGroups.forEach((g) => {
      if (g.minChoices > 0 && g.values.length > 0) {
        defaults[g.id] = [g.values.find((v) => v.available)?.id ?? ''].filter(Boolean)
      }
    })
    requestAnimationFrame(() => {
      setSelected(defaults)
      setQty(1)
      setNotes('')
      requestAnimationFrame(() => setVisible(true))
    })
  }, [isOpen, item])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  if (item === null) return null

  // Preço total dinâmico
  const unitPrice = item.promotionalPrice ?? item.price
  const optionsExtra = Object.entries(selected).reduce((acc, [groupId, valueIds]) => {
    const group = item.optionGroups.find((g) => g.id === groupId)
    if (!group) return acc
    return acc + valueIds.reduce((s, vid) => {
      const v = group.values.find((v) => v.id === vid)
      return s + (v?.priceAdd ?? 0)
    }, 0)
  }, 0)
  const lineTotal = (unitPrice + optionsExtra) * qty

  // Valida obrigatórios
  const allRequired = item.optionGroups
    .filter((g) => g.minChoices > 0)
    .every((g) => (selected[g.id]?.length ?? 0) >= g.minChoices)

  function handleAdd() {
    if (!allRequired || !item) return
    const options: CartItemOption[] = []
    item.optionGroups.forEach((g) => {
      const valueIds = selected[g.id] ?? []
      valueIds.forEach((vid) => {
        const v = g.values.find((v) => v.id === vid)
        if (v) {
          options.push({
            groupId: g.id,
            groupName: g.name,
            valueId: v.id,
            valueName: v.name,
            priceAdd: v.priceAdd,
          })
        }
      })
    })
    addItem(buildCartItem(item, qty, options, notes))
    handleClose()
  }

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

      {/* Bottom sheet */}
      <div
        className={cn(
          'fixed bottom-0 inset-x-0 z-[90] flex flex-col',
          'max-w-[430px] mx-auto bg-white rounded-t-2xl overflow-hidden',
          'max-h-[92svh]',
          'transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          visible ? 'translate-y-0' : 'translate-y-full',
        )}
        role="dialog"
        aria-modal
        aria-label={item.name}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-ink-200" />
        </div>

        {/* Scrollable content */}
        <div ref={contentRef} className="overflow-y-auto flex-1 overscroll-contain">
          {/* Photo */}
          <div className="relative w-full h-[200px] bg-paper-deep overflow-hidden">
            {item.photoUrl ? (
              <Image src={item.photoUrl} alt={item.name} fill unoptimized className="object-cover" sizes="430px" />
            ) : (
              <div
                className={cn(
                  'w-full h-full bg-gradient-to-br',
                  ['from-clay-300 to-clay-500', 'from-cerrado-300 to-cerrado-500', 'from-sun-300 to-clay-300'][
                    item.name.charCodeAt(0) % 3
                  ],
                )}
              />
            )}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow"
              aria-label="Fechar"
            >
              <X size={18} strokeWidth={2} className="text-ink-700" />
            </button>
          </div>

          {/* Item info */}
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-[20px] font-bold text-ink-900 m-0 leading-tight">{item.name}</h2>
            {item.description && (
              <p className="text-[14px] text-ink-600 leading-relaxed mt-2 m-0">{item.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-[12px] text-ink-500">
              {item.serves && <span>{item.serves}</span>}
              {item.prepTimeMin && <span>~{item.prepTimeMin} min</span>}
            </div>
            {/* Price */}
            <div className="flex items-baseline gap-2 mt-2">
              {item.promotionalPrice !== undefined && (
                <span className="text-[13px] text-ink-400 line-through">{brl(item.price)}</span>
              )}
              <span className="text-[18px] font-bold text-ink-900">{brl(unitPrice)}</span>
            </div>
          </div>

          {/* Option groups */}
          {item.optionGroups.map((group) => (
            <OptionGroupSelector
              key={group.id}
              group={group}
              selected={selected}
              onChange={(groupId, valueIds) =>
                setSelected((prev) => ({ ...prev, [groupId]: valueIds }))
              }
            />
          ))}

          {/* Notes */}
          <div className="border-t border-ink-100 px-4 py-4">
            <label className="block text-[13px] font-semibold text-ink-700 mb-2">
              Alguma observação?
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: sem cebola, ponto da carne, etc."
              maxLength={200}
              rows={2}
              className="w-full text-[13px] text-ink-900 placeholder:text-ink-400 border border-ink-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-clay-500/30 focus:border-clay-500"
            />
          </div>

          {/* Bottom padding for sticky button */}
          <div className="h-[100px]" />
        </div>

        {/* Sticky bottom bar */}
        <div className="flex-shrink-0 bg-white border-t border-ink-100 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            {/* Qty control */}
            <div className="flex items-center gap-2 bg-paper-deep rounded-full px-1 py-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-paper active:bg-white"
                aria-label="Diminuir"
              >
                <Minus size={16} strokeWidth={2.5} className="text-ink-700" />
              </button>
              <span className="text-[15px] font-bold text-ink-900 w-5 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 rounded-full bg-clay-500 flex items-center justify-center hover:bg-clay-600 active:bg-clay-700 transition-colors"
                aria-label="Aumentar"
              >
                <Plus size={16} strokeWidth={2.5} className="text-white" />
              </button>
            </div>

            {/* Add to cart */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={!allRequired}
              className={cn(
                'flex-1 flex items-center justify-between',
                'bg-clay-500 hover:bg-clay-600 active:bg-clay-700',
                'disabled:bg-ink-300 disabled:cursor-default',
                'text-white font-bold text-[14px]',
                'rounded-full px-4 py-2.5 transition-colors duration-150',
              )}
            >
              <span>Adicionar</span>
              <span>{brl(lineTotal)}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

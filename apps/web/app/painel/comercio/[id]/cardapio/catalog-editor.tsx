'use client'

// Editor de cardápio: árvore Seção → Item, com modal de item (dados, foto, opções).
// Usa as Server Actions de ./actions via <form action=...>. Estado local só controla
// quais painéis/modais estão abertos — os dados vêm do servidor (revalidatePath).

import { useState } from 'react'
import { ChevronDown, ImageOff, Pencil, Plus, Trash2 } from 'lucide-react'

import { ImageUploadField } from '@/components/admin/media/image-upload-field'

import {
  deleteItemAction,
  deleteOptionGroupAction,
  deleteOptionValueAction,
  deleteSectionAction,
  toggleItemAvailabilityAction,
  upsertItemAction,
  upsertOptionGroupAction,
  upsertOptionValueAction,
  upsertSectionAction,
} from './actions'

const ITEM_TAGS = ['vegano', 'vegetariano', 'sem_gluten', 'picante', 'destaque', 'novo', 'mais_pedido'] as const

type OptionValue = { id: string; name: string; priceAdd: number; available: boolean }
type OptionGroup = { id: string; name: string; minChoices: number; maxChoices: number; values: OptionValue[] }
type Item = {
  id: string
  name: string
  description?: string
  price: number
  promotionalPrice?: number
  available: boolean
  photoUrl?: string
  serves?: string
  prepTimeMin?: number
  tags: string[]
  optionGroups: OptionGroup[]
}
type Section = { id: string; name: string; description?: string; items: Item[] }

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function CatalogEditor({
  businessId,
  catalogId,
  sections,
}: {
  businessId: string
  catalogId: string
  sections: Section[]
}) {
  const [editingItem, setEditingItem] = useState<{ sectionId: string; item: Item | null } | null>(null)

  return (
    <div className="grid gap-4">
      {sections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-200 bg-paper p-4 text-sm text-muted-foreground">
          Nenhuma seção ainda. Crie a primeira (ex.: “Pizzas”, “Bebidas”).
        </p>
      ) : (
        sections.map((section) => (
          <SectionBlock
            key={section.id}
            businessId={businessId}
            section={section}
            onAddItem={() => setEditingItem({ sectionId: section.id, item: null })}
            onEditItem={(item) => setEditingItem({ sectionId: section.id, item })}
          />
        ))
      )}

      {/* Nova seção */}
      <form
        action={upsertSectionAction}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-ink-200 p-3"
      >
        <input type="hidden" name="business_id" value={businessId} />
        <input type="hidden" name="catalog_id" value={catalogId} />
        <input type="hidden" name="display_order" value={sections.length} />
        <label className="grid flex-1 gap-1 text-xs font-medium">
          Nova seção
          <input className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="name" placeholder="Ex.: Pizzas salgadas" required />
        </label>
        <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-clay-600">
          <Plus className="size-4" aria-hidden="true" />
          Adicionar seção
        </button>
      </form>

      {editingItem ? (
        <ItemModal
          businessId={businessId}
          sectionId={editingItem.sectionId}
          item={editingItem.item}
          onClose={() => setEditingItem(null)}
        />
      ) : null}
    </div>
  )
}

function SectionBlock({
  businessId,
  section,
  onAddItem,
  onEditItem,
}: {
  businessId: string
  section: Section
  onAddItem: () => void
  onEditItem: (item: Item) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <section className="rounded-xl border border-ink-100 bg-card shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-ink-100 p-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-left">
          <ChevronDown className={`size-4 transition-transform ${open ? '' : '-rotate-90'}`} aria-hidden="true" />
          <span className="font-semibold">{section.name}</span>
          <span className="text-xs text-muted-foreground">({section.items.length})</span>
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onAddItem} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-muted">
            <Plus className="size-3.5" aria-hidden="true" />
            Item
          </button>
          <form action={deleteSectionAction}>
            <input type="hidden" name="business_id" value={businessId} />
            <input type="hidden" name="section_id" value={section.id} />
            <button type="submit" className="inline-flex items-center text-red-600 hover:text-red-700" aria-label="Remover seção">
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      {open ? (
        <div className="grid gap-2 p-3">
          {section.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem itens nesta seção.</p>
          ) : (
            section.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-ink-100 bg-white p-2">
                <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photoUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-ink-300">
                      <ImageOff className="size-5" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.promotionalPrice != null ? (
                      <>
                        <span className="line-through">{brl(item.price)}</span> {brl(item.promotionalPrice)}
                      </>
                    ) : (
                      brl(item.price)
                    )}
                    {item.optionGroups.length > 0 ? ` · ${item.optionGroups.length} grupo(s) de opção` : ''}
                  </p>
                </div>
                <form action={toggleItemAvailabilityAction}>
                  <input type="hidden" name="business_id" value={businessId} />
                  <input type="hidden" name="item_id" value={item.id} />
                  <input type="hidden" name="available" value={item.available ? 'false' : 'true'} />
                  <button
                    type="submit"
                    className={
                      item.available
                        ? 'rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700'
                        : 'rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-500'
                    }
                  >
                    {item.available ? 'Disponível' : 'Esgotado'}
                  </button>
                </form>
                <button type="button" onClick={() => onEditItem(item)} className="text-ink-500 hover:text-clay-700" aria-label="Editar item">
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <form action={deleteItemAction}>
                  <input type="hidden" name="business_id" value={businessId} />
                  <input type="hidden" name="item_id" value={item.id} />
                  <button type="submit" className="text-red-600 hover:text-red-700" aria-label="Remover item">
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      ) : null}
    </section>
  )
}

function ItemModal({
  businessId,
  sectionId,
  item,
  onClose,
}: {
  businessId: string
  sectionId: string
  item: Item | null
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-paper p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{item ? 'Editar item' : 'Novo item'}</h2>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-ink-700">
            Fechar
          </button>
        </div>

        {/* Dados do item */}
        <form action={upsertItemAction} className="grid gap-3">
          {item ? <input type="hidden" name="id" value={item.id} /> : null}
          <input type="hidden" name="business_id" value={businessId} />
          <input type="hidden" name="section_id" value={sectionId} />

          <label className="grid gap-1 text-xs font-medium">
            Nome
            <input className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="name" defaultValue={item?.name ?? ''} required />
          </label>
          <label className="grid gap-1 text-xs font-medium">
            Descrição
            <textarea className="min-h-16 rounded-lg border border-ink-200 px-3 py-2 text-sm" name="description" defaultValue={item?.description ?? ''} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-xs font-medium">
              Preço (R$)
              <input className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="price" type="number" step="0.01" min="0" defaultValue={item?.price ?? ''} required />
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Preço promocional (R$)
              <input className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="promotional_price" type="number" step="0.01" min="0" defaultValue={item?.promotionalPrice ?? ''} />
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Serve
              <input className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="serves" defaultValue={item?.serves ?? ''} placeholder="2–3 pessoas" />
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Tempo de preparo (min)
              <input className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="prep_time_min" type="number" min="0" defaultValue={item?.prepTimeMin ?? ''} />
            </label>
          </div>

          <fieldset className="grid gap-2 rounded-lg border border-ink-100 p-3">
            <legend className="px-1 text-xs font-semibold">Etiquetas</legend>
            <div className="flex flex-wrap gap-2">
              {ITEM_TAGS.map((tag) => (
                <label key={tag} className="flex items-center gap-1.5 rounded-lg border border-ink-100 px-2 py-1 text-xs">
                  <input type="checkbox" name="tags" value={tag} defaultChecked={item?.tags.includes(tag)} />
                  {tag.replace('_', ' ')}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="available" defaultChecked={item?.available ?? true} />
            Disponível
          </label>

          <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-clay-600">
            {item ? 'Salvar item' : 'Criar item'}
          </button>
        </form>

        {/* Foto + opções só existem após o item ser criado (precisa de id) */}
        {item ? (
          <div className="mt-4 grid gap-4">
            <ImageUploadField
              entityType="catalog_item"
              entityId={item.id}
              role="cover"
              label="Foto do item"
              currentUrl={item.photoUrl ?? null}
              revalidatePath={`/painel/comercio/${businessId}/cardapio`}
              helpText="Aparece no cardápio público. Use uma foto boa e bem iluminada."
            />

            <OptionGroupsEditor businessId={businessId} item={item} />
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Salve o item para adicionar foto e opções (tamanho, borda, adicionais…).
          </p>
        )}
      </div>
    </div>
  )
}

function OptionGroupsEditor({ businessId, item }: { businessId: string; item: Item }) {
  return (
    <section className="grid gap-3 rounded-lg border border-ink-100 p-3">
      <p className="text-sm font-semibold">Opções e customizações</p>

      {item.optionGroups.map((group) => (
        <div key={group.id} className="rounded-lg border border-ink-100 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {group.name}{' '}
              <span className="text-xs text-muted-foreground">
                ({group.minChoices === 0 ? 'opcional' : 'obrigatório'} · escolhe {group.maxChoices > 1 ? `até ${group.maxChoices}` : '1'})
              </span>
            </p>
            <form action={deleteOptionGroupAction}>
              <input type="hidden" name="business_id" value={businessId} />
              <input type="hidden" name="group_id" value={group.id} />
              <button type="submit" className="text-red-600 hover:text-red-700" aria-label="Remover grupo">
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>

          <div className="mt-2 grid gap-1.5">
            {group.values.map((value) => (
              <div key={value.id} className="flex items-center justify-between gap-2 rounded-md bg-paper px-2 py-1 text-sm">
                <span>
                  {value.name} {value.priceAdd > 0 ? <span className="text-muted-foreground">(+{brl(value.priceAdd)})</span> : null}
                </span>
                <form action={deleteOptionValueAction}>
                  <input type="hidden" name="business_id" value={businessId} />
                  <input type="hidden" name="value_id" value={value.id} />
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    remover
                  </button>
                </form>
              </div>
            ))}
          </div>

          {/* Novo valor */}
          <form action={upsertOptionValueAction} className="mt-2 flex flex-wrap items-end gap-2">
            <input type="hidden" name="business_id" value={businessId} />
            <input type="hidden" name="group_id" value={group.id} />
            <input className="flex-1 rounded-lg border border-ink-200 px-2 py-1.5 text-sm" name="name" placeholder="Ex.: Grande" required />
            <input className="w-24 rounded-lg border border-ink-200 px-2 py-1.5 text-sm" name="price_add" type="number" step="0.01" min="0" placeholder="+R$" />
            <input type="hidden" name="available" value="true" />
            <button type="submit" className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-semibold hover:bg-muted">
              + valor
            </button>
          </form>
        </div>
      ))}

      {/* Novo grupo */}
      <form action={upsertOptionGroupAction} className="grid gap-2 rounded-lg border border-dashed border-ink-200 p-3 sm:grid-cols-[1fr_90px_90px_auto] sm:items-end">
        <input type="hidden" name="business_id" value={businessId} />
        <input type="hidden" name="item_id" value={item.id} />
        <label className="grid gap-1 text-xs font-medium">
          Novo grupo
          <input className="rounded-lg border border-ink-200 px-2 py-1.5 text-sm" name="name" placeholder="Ex.: Tamanho" required />
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Mín.
          <input className="rounded-lg border border-ink-200 px-2 py-1.5 text-sm" name="min_choices" type="number" min="0" defaultValue={0} />
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Máx.
          <input className="rounded-lg border border-ink-200 px-2 py-1.5 text-sm" name="max_choices" type="number" min="1" defaultValue={1} />
        </label>
        <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-clay-600">
          + grupo
        </button>
      </form>
    </section>
  )
}

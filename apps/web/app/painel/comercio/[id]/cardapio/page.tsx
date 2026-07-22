import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Link } from '@/components/navigation/link'
import { requireRole } from '@/lib/auth'
import { getCurrentCity } from '@/lib/cities'
import { getCatalogWithItems } from '@/lib/delivery/catalog'
import { createClient } from '@/lib/supabase/server'

import { BusinessTabs } from '../business-tabs'
import { CatalogEditor } from './catalog-editor'
import { ensureCatalogAction } from './ensure-catalog'

type PageProps = { params: Promise<{ id: string }> }

export default async function BusinessCatalogPage({ params }: PageProps) {
  const [{ id }, city] = await Promise.all([params, getCurrentCity()])
  if (!city) return null

  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] })
  const supabase = await createClient()
  const { data: can } = await supabase.rpc('manages_business', { p_business_id: id })

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, slug')
    .eq('id', id)
    .eq('city_id', city.id)
    .single()
  if (!business || !can) notFound()

  // Garante que existe 1 catálogo "food_menu" pro negócio (cria sob demanda).
  const { data: catalogs } = await supabase
    .from('business_catalogs')
    .select('id, name, catalog_type')
    .eq('business_id', id)
    .order('display_order', { ascending: true })

  let catalogId = catalogs?.[0]?.id as string | undefined
  if (!catalogId) {
    catalogId = await ensureCatalogAction(id)
  }

  // Árvore completa (inclui indisponíveis para o painel)
  const catalog = catalogId ? await getCatalogWithItems(id, { includeUnavailable: true }) : null

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-ink-100 bg-card p-4 shadow-card md:p-5">
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-clay-700 hover:no-underline"
          href={`/painel/comercio/${business.id}`}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para ficha
        </Link>
        <h1 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">Cardápio</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Monte as seções e itens de {business.name}. As fotos e opções aparecem direto na página de pedidos.
        </p>
      </header>

      <BusinessTabs businessId={business.id} active="cardapio" />

      <CatalogEditor
        businessId={business.id}
        catalogId={catalogId ?? ''}
        sections={(catalog?.sections ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          items: s.items.map((i) => ({
            id: i.id,
            name: i.name,
            description: i.description,
            price: i.price,
            promotionalPrice: i.promotionalPrice,
            available: i.available,
            photoUrl: i.photoUrl,
            serves: i.serves,
            prepTimeMin: i.prepTimeMin,
            tags: i.tags ?? [],
            optionGroups: i.optionGroups.map((g) => ({
              id: g.id,
              name: g.name,
              minChoices: g.minChoices,
              maxChoices: g.maxChoices,
              values: g.values.map((v) => ({ id: v.id, name: v.name, priceAdd: v.priceAdd, available: v.available })),
            })),
          })),
        }))}
      />
    </div>
  )
}

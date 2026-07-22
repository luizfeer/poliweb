// Leituras do catálogo (Server Components / Server Actions de leitura).
// Mapeia as linhas snake_case do Supabase para os tipos camelCase de
// `@/lib/businesses/catalog-types`, usados pelos componentes do cardápio.

import type {
  Catalog,
  CatalogItem,
  CatalogSection,
  DeliverySettings,
  ItemTag,
  OptionGroup,
  OptionValue,
} from '@/lib/businesses/catalog-types'
import { createClient } from '@/lib/supabase/server'

import type { Database } from '@/lib/supabase/database.types'

type CatalogItemRow = Database['public']['Tables']['catalog_items']['Row']
type CatalogOptionGroupRow = Database['public']['Tables']['catalog_item_option_groups']['Row']
type CatalogOptionValueRow = Database['public']['Tables']['catalog_item_option_values']['Row']
type CatalogSectionRow = Database['public']['Tables']['catalog_sections']['Row']

function mapOptionValue(row: CatalogOptionValueRow): OptionValue {
  return { id: row.id, name: row.name, priceAdd: Number(row.price_add), available: row.available }
}

function mapOptionGroup(row: CatalogOptionGroupRow, values: CatalogOptionValueRow[]): OptionGroup {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    minChoices: row.min_choices,
    maxChoices: row.max_choices,
    values: values
      .filter((v) => v.group_id === row.id)
      .sort((a, b) => a.display_order - b.display_order)
      .map(mapOptionValue),
  }
}

function mapItem(
  row: CatalogItemRow,
  groups: CatalogOptionGroupRow[],
  values: CatalogOptionValueRow[],
): CatalogItem {
  return {
    id: row.id,
    sectionId: row.section_id,
    businessId: row.business_id,
    name: row.name,
    description: row.description ?? undefined,
    price: Number(row.price),
    promotionalPrice: row.promotional_price != null ? Number(row.promotional_price) : undefined,
    promoValidUntil: row.promo_valid_until ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    serves: row.serves ?? undefined,
    prepTimeMin: row.prep_time_min ?? undefined,
    calories: row.calories ?? undefined,
    tags: (row.tags ?? []) as ItemTag[],
    available: row.available,
    displayOrder: row.display_order,
    optionGroups: groups
      .filter((g) => g.item_id === row.id)
      .sort((a, b) => a.display_order - b.display_order)
      .map((g) => mapOptionGroup(g, values)),
  }
}

function mapSection(row: CatalogSectionRow, items: CatalogItem[]): CatalogSection {
  return {
    id: row.id,
    catalogId: row.catalog_id,
    name: row.name,
    description: row.description ?? undefined,
    displayOrder: row.display_order,
    items: items
      .filter((i) => i.sectionId === row.id)
      .sort((a, b) => a.displayOrder - b.displayOrder),
  }
}

type GetCatalogOptions = { includeUnavailable?: boolean }

/**
 * Catálogo ativo de um negócio com seções, itens, grupos e valores de opção,
 * já montado em árvore para o `CatalogShell`. Retorna `null` se não houver.
 */
export async function getCatalogWithItems(
  businessId: string,
  opts: GetCatalogOptions = {},
): Promise<Catalog | null> {
  const db = await createClient()

  const { data: catalogs } = await db
    .from('business_catalogs')
    .select('*')
    .eq('business_id', businessId)
    .eq('active', true)
    .order('display_order', { ascending: true })
    .limit(1)

  const catalog = catalogs?.[0]
  if (!catalog) return null

  const { data: sections } = await db
    .from('catalog_sections')
    .select('*')
    .eq('catalog_id', catalog.id)
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (!sections || sections.length === 0) {
    return {
      id: catalog.id,
      businessId,
      name: catalog.name,
      catalogType: catalog.catalog_type as Catalog['catalogType'],
      sections: [],
    }
  }

  let itemsQuery = db.from('catalog_items').select('*').eq('business_id', businessId)
  if (!opts.includeUnavailable) itemsQuery = itemsQuery.eq('available', true)
  const { data: itemRows } = await itemsQuery.order('display_order', { ascending: true })

  const items = itemRows ?? []
  const itemIds = items.map((i) => i.id)

  const { data: groups } = itemIds.length
    ? await db.from('catalog_item_option_groups').select('*').in('item_id', itemIds)
    : { data: [] as CatalogOptionGroupRow[] }

  const groupIds = (groups ?? []).map((g) => g.id)
  const { data: values } = groupIds.length
    ? await db.from('catalog_item_option_values').select('*').in('group_id', groupIds)
    : { data: [] as CatalogOptionValueRow[] }

  const mappedItems = items.map((row) => mapItem(row, groups ?? [], values ?? []))

  return {
    id: catalog.id,
    businessId,
    name: catalog.name,
    catalogType: catalog.catalog_type as Catalog['catalogType'],
    sections: sections
      .map((s) => mapSection(s, mappedItems))
      .filter((s) => s.items.length > 0 || opts.includeUnavailable),
  }
}

type BusinessDeliveryRow = {
  delivery_enabled: boolean
  pickup_enabled: boolean
  table_service_enabled: boolean
  delivery_fee: number | null
  delivery_min_order: number | null
  delivery_time_min: number | null
  pickup_time_min: number | null
  delivery_radius_km: number | null
  pix_key: string | null
  accepts_card_on_delivery: boolean
  order_instructions: string | null
}

/** Configurações de delivery de um negócio (campos da tabela businesses). */
export async function getDeliverySettings(businessId: string): Promise<DeliverySettings> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('businesses')
    .select(
      'delivery_enabled, pickup_enabled, table_service_enabled, delivery_fee, delivery_min_order, delivery_time_min, pickup_time_min, delivery_radius_km, pix_key, accepts_card_on_delivery, order_instructions',
    )
    .eq('id', businessId)
    .single<BusinessDeliveryRow>()

  return {
    deliveryEnabled: data?.delivery_enabled ?? false,
    pickupEnabled: data?.pickup_enabled ?? false,
    tableServiceEnabled: data?.table_service_enabled ?? false,
    deliveryFee: data?.delivery_fee != null ? Number(data.delivery_fee) : undefined,
    deliveryMinOrder: data?.delivery_min_order != null ? Number(data.delivery_min_order) : undefined,
    deliveryTimeMin: data?.delivery_time_min ?? undefined,
    pickupTimeMin: data?.pickup_time_min ?? undefined,
    deliveryRadiusKm: data?.delivery_radius_km != null ? Number(data.delivery_radius_km) : undefined,
    pixKey: data?.pix_key ?? undefined,
    acceptsCardOnDelivery: data?.accepts_card_on_delivery ?? false,
    orderInstructions: data?.order_instructions ?? undefined,
  }
}

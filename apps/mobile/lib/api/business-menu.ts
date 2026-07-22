import { cachedJson } from '@/lib/api/cached-json';
import { supabase } from '@/lib/supabase';
import type {
  Catalog,
  CatalogSection,
  DeliverySettings,
  OptionGroup,
  OptionValue,
} from '@/lib/businesses/catalog-types';

const MENU_TTL_MS = 5 * 60 * 1000;
const DELIVERY_TTL_MS = 5 * 60 * 1000;

type SectionRow = {
  id: string;
  catalog_id: string;
  name: string;
  description: string | null;
  display_order: number;
};

type ItemRow = {
  id: string;
  business_id: string;
  section_id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  photo_url: string | null;
  serves: string | null;
  prep_time_min: number | null;
  tags: string[] | null;
  available: boolean;
  display_order: number;
};

type OptionGroupRow = {
  id: string;
  item_id: string;
  name: string;
  description: string | null;
  min_choices: number;
  max_choices: number;
  display_order: number;
};

type OptionValueRow = {
  id: string;
  group_id: string;
  name: string;
  price_add: number;
  available: boolean;
  display_order: number;
};

type DeliveryRow = {
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  table_service_enabled: boolean;
  delivery_fee: number | null;
  delivery_min_order: number | null;
  delivery_time_min: number | null;
  pickup_time_min: number | null;
  pix_key: string | null;
  accepts_card_on_delivery: boolean;
  order_instructions: string | null;
};

/** Espelha `apps/web/lib/delivery/catalog.ts` — getCatalogWithItems. */
async function fetchBusinessMenuRemote(businessId: string): Promise<Catalog | null> {
  try {
    const { data: catalogRows } = await supabase
      .from('business_catalogs')
      .select('id, name, catalog_type')
      .eq('business_id', businessId)
      .eq('active', true)
      .order('display_order', { ascending: true })
      .limit(1);

    const catalog = catalogRows?.[0] as
      | { id: string; name: string; catalog_type: Catalog['catalogType'] }
      | undefined;
    if (!catalog) return null;

    const { data: sectionRows } = await supabase
      .from('catalog_sections')
      .select('id, catalog_id, name, description, display_order')
      .eq('catalog_id', catalog.id)
      .eq('active', true)
      .order('display_order', { ascending: true });

    const sections = (sectionRows ?? []) as SectionRow[];
    if (sections.length === 0) return null;

    const { data: itemRows } = await supabase
      .from('catalog_items')
      .select('id, business_id, section_id, name, description, price, promotional_price, photo_url, serves, prep_time_min, tags, available, display_order')
      .eq('business_id', businessId)
      .eq('available', true)
      .order('display_order', { ascending: true });

    const items = (itemRows ?? []) as ItemRow[];
    const itemIds = items.map((i) => i.id);

    let groups: OptionGroupRow[] = [];
    let values: OptionValueRow[] = [];

    if (itemIds.length > 0) {
      const { data: groupRows } = await supabase
        .from('catalog_item_option_groups')
        .select('id, item_id, name, description, min_choices, max_choices, display_order')
        .in('item_id', itemIds)
        .order('display_order', { ascending: true });
      groups = (groupRows ?? []) as OptionGroupRow[];

      const groupIds = groups.map((g) => g.id);
      if (groupIds.length > 0) {
        const { data: valueRows } = await supabase
          .from('catalog_item_option_values')
          .select('id, group_id, name, price_add, available, display_order')
          .in('group_id', groupIds)
          .eq('available', true)
          .order('display_order', { ascending: true });
        values = (valueRows ?? []) as OptionValueRow[];
      }
    }

    const catalogSections: CatalogSection[] = sections.map((section) => ({
      id: section.id,
      catalogId: section.catalog_id,
      name: section.name,
      description: section.description ?? undefined,
      displayOrder: section.display_order,
      items: items
        .filter((item) => item.section_id === section.id)
        .map((item) => {
          const itemGroups = groups.filter((g) => g.item_id === item.id);
          const optionGroups: OptionGroup[] = itemGroups.map((g) => ({
            id: g.id,
            name: g.name,
            description: g.description ?? undefined,
            minChoices: g.min_choices,
            maxChoices: g.max_choices,
            values: values
              .filter((v) => v.group_id === g.id)
              .map((v): OptionValue => ({
                id: v.id,
                name: v.name,
                priceAdd: Number(v.price_add),
                available: v.available,
              })),
          }));

          return {
            id: item.id,
            sectionId: item.section_id,
            businessId: item.business_id,
            name: item.name,
            description: item.description ?? undefined,
            price: Number(item.price),
            promotionalPrice: item.promotional_price != null ? Number(item.promotional_price) : undefined,
            photoUrl: item.photo_url ?? undefined,
            serves: item.serves ?? undefined,
            prepTimeMin: item.prep_time_min ?? undefined,
            tags: (item.tags ?? []) as CatalogSection['items'][0]['tags'],
            available: item.available,
            displayOrder: item.display_order,
            optionGroups,
          };
        }),
    }));

    return {
      id: catalog.id,
      businessId,
      name: catalog.name,
      catalogType: catalog.catalog_type,
      sections: catalogSections,
    };
  } catch {
    return null;
  }
}

async function fetchDeliverySettingsRemote(businessId: string): Promise<DeliverySettings> {
  try {
    const { data } = await supabase
      .from('businesses')
      .select(
        'delivery_enabled, pickup_enabled, table_service_enabled, delivery_fee, delivery_min_order, delivery_time_min, pickup_time_min, pix_key, accepts_card_on_delivery, order_instructions',
      )
      .eq('id', businessId)
      .single<DeliveryRow>();

    return {
      deliveryEnabled: data?.delivery_enabled ?? false,
      pickupEnabled: data?.pickup_enabled ?? false,
      tableServiceEnabled: data?.table_service_enabled ?? false,
      deliveryFee: data?.delivery_fee != null ? Number(data.delivery_fee) : undefined,
      deliveryMinOrder: data?.delivery_min_order != null ? Number(data.delivery_min_order) : undefined,
      deliveryTimeMin: data?.delivery_time_min ?? undefined,
      pickupTimeMin: data?.pickup_time_min ?? undefined,
      pixKey: data?.pix_key ?? undefined,
      acceptsCardOnDelivery: data?.accepts_card_on_delivery ?? false,
      orderInstructions: data?.order_instructions ?? undefined,
    };
  } catch {
    return {
      deliveryEnabled: false,
      pickupEnabled: true,
      tableServiceEnabled: false,
      acceptsCardOnDelivery: false,
    };
  }
}

export async function getBusinessMenu(businessId: string): Promise<Catalog | null> {
  return cachedJson<Catalog>(
    `business:menu:${businessId}`,
    () => fetchBusinessMenuRemote(businessId),
    { ttlMs: MENU_TTL_MS },
  );
}

const DEFAULT_DELIVERY: DeliverySettings = {
  deliveryEnabled: false,
  pickupEnabled: true,
  tableServiceEnabled: false,
  acceptsCardOnDelivery: false,
};

export async function getDeliverySettings(businessId: string): Promise<DeliverySettings> {
  const result = await cachedJson<DeliverySettings>(
    `business:delivery:${businessId}`,
    () => fetchDeliverySettingsRemote(businessId),
    { ttlMs: DELIVERY_TTL_MS },
  );
  return result ?? DEFAULT_DELIVERY;
}

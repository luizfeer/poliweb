import type { createServiceClient } from './supabase.js';

export type EntityType =
  | 'business'
  | 'restaurant'
  | 'accommodation'
  | 'attraction'
  | 'emergency_contact'
  | 'health_facility'
  | 'tourism_guide'
  | 'tour_package'
  | 'fishing_guide'
  | 'fishing_spot'
  | 'event'
  | 'property'
  | 'classified';

export type EntitySummary = {
  entity_type: EntityType;
  entity_id: string;
  name: string;
  slug: string | null;
  score?: number | undefined;
  url: string | null;
  cover_url: string | null;
};

type Supabase = ReturnType<typeof createServiceClient>;

const ENTITY_TABLES: Record<EntityType, string> = {
  business: 'businesses',
  restaurant: 'restaurants',
  accommodation: 'accommodations',
  attraction: 'attractions',
  emergency_contact: 'emergency_contacts',
  health_facility: 'health_facilities',
  tourism_guide: 'tourism_guides',
  tour_package: 'tour_packages',
  fishing_guide: 'fishing_guides',
  fishing_spot: 'fishing_spots',
  event: 'events',
  property: 'properties',
  classified: 'classifieds',
};

/**
 * Caminho público das fichas. Quando a entidade não tem página de detalhe
 * própria (ex.: tour_package, classified), aponta pra listagem.
 */
const PUBLIC_PATHS: Partial<Record<EntityType, string>> = {
  business: '/comercio/negocio',
  restaurant: '/comercio/negocio',
  accommodation: '/turismo/onde-ficar',
  attraction: '/turismo/o-que-fazer',
  tourism_guide: '/turismo/guias',
  tour_package: '/turismo/roteiros',
  fishing_guide: '/turismo/pesca/guias',
  fishing_spot: '/turismo/pesca/pontos',
  event: '/comunidade/agenda',
  property: '/imoveis',
};

/** Coluna que guarda o nome/título exibível em cada tabela. */
const NAME_COLUMN: Record<EntityType, string> = {
  business: 'name',
  restaurant: 'name',
  accommodation: 'name',
  attraction: 'name',
  emergency_contact: 'name',
  health_facility: 'name',
  tourism_guide: 'name',
  tour_package: 'title',
  fishing_guide: 'full_name',
  fishing_spot: 'name',
  event: 'title',
  property: 'title',
  classified: 'title',
};

/** Coluna usada como capa em cada tabela (algumas usam photo_url). */
const COVER_COLUMN: Record<EntityType, string | null> = {
  business: 'cover_url',
  restaurant: 'cover_url',
  accommodation: 'cover_url',
  attraction: 'cover_url',
  emergency_contact: null,
  health_facility: null,
  tourism_guide: 'cover_url',
  tour_package: 'cover_url',
  fishing_guide: 'photo_url',
  fishing_spot: 'cover_url',
  event: 'cover_url',
  property: 'cover_url',
  classified: 'cover_url',
};

export function getEntityTable(type: EntityType): string {
  return ENTITY_TABLES[type];
}

export function getEntityNameColumn(type: EntityType): string {
  return NAME_COLUMN[type];
}

export function getEntityCoverColumn(type: EntityType): string | null {
  return COVER_COLUMN[type];
}

export function getEntityPublicPath(type: EntityType): string | null {
  return PUBLIC_PATHS[type] ?? null;
}

export function isEntityType(value: string): value is EntityType {
  return value in ENTITY_TABLES;
}

export const ALL_ENTITY_TYPES: EntityType[] = Object.keys(ENTITY_TABLES) as EntityType[];

export async function getCityBySlug(
  supabase: Supabase,
  slug: string,
): Promise<{ id: string; name: string; slug: string } | null> {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (
    !data ||
    typeof data.id !== 'string' ||
    typeof data.name !== 'string' ||
    typeof data.slug !== 'string'
  ) {
    return null;
  }

  return { id: data.id, name: data.name, slug: data.slug };
}

export async function getEntitySummary(
  supabase: Supabase,
  type: EntityType,
  id: string,
  cityId: string,
  score?: number,
): Promise<EntitySummary | null> {
  const table = ENTITY_TABLES[type];
  const nameCol = NAME_COLUMN[type];
  const coverCol = COVER_COLUMN[type];
  const cols = ['id', 'city_id', `name:${nameCol}`, 'slug'];
  if (coverCol) cols.push(`cover_url:${coverCol}`);
  const { data, error } = await supabase
    .from(table)
    .select(cols.join(', '))
    .eq('id', id)
    .eq('city_id', cityId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || typeof (data as any).id !== 'string' || typeof (data as any).name !== 'string') {
    return null;
  }

  const slug = 'slug' in data && typeof (data as any).slug === 'string' ? (data as any).slug : null;
  const coverUrl =
    'cover_url' in data && typeof (data as any).cover_url === 'string'
      ? (data as any).cover_url
      : null;
  const basePath = PUBLIC_PATHS[type];
  const url = basePath ? (slug ? `${basePath}/${slug}` : basePath) : null;

  return {
    entity_type: type,
    entity_id: (data as any).id,
    name: (data as any).name,
    slug,
    score,
    url,
    cover_url: coverUrl,
  };
}

export async function getEntityDetails(
  supabase: Supabase,
  type: EntityType,
  id: string,
  cityId: string,
) {
  const table = ENTITY_TABLES[type];
  const nameCol = NAME_COLUMN[type];
  // Tipos sem contato direto (tour_package, event, property, classified, etc.)
  // — só pega id/name/slug pra evitar erro de coluna inexistente.
  const HAS_FULL_CONTACT: Partial<Record<EntityType, boolean>> = {
    business: true,
    restaurant: true,
    accommodation: true,
    attraction: true,
  };
  const HAS_BASIC_CONTACT: Partial<Record<EntityType, boolean>> = {
    fishing_guide: true,
    tourism_guide: true,
  };
  const cols = HAS_FULL_CONTACT[type]
    ? `id, name:${nameCol}, slug, phone, whatsapp, address, instagram, attributes`
    : HAS_BASIC_CONTACT[type]
      ? `id, name:${nameCol}, slug, phone, whatsapp`
      : `id, name:${nameCol}, slug`;
  const { data, error } = await supabase
    .from(table)
    .select(cols)
    .eq('id', id)
    .eq('city_id', cityId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || typeof (data as any).id !== 'string' || typeof (data as any).name !== 'string') {
    return null;
  }

  const { data: services } = await supabase
    .from('entity_services')
    .select('name, description, price_cents, duration_min, requirements')
    .eq('city_id', cityId)
    .eq('entity_type', type)
    .eq('entity_id', id)
    .eq('active', true)
    .order('sort_order', { ascending: true });

  return {
    name: (data as any).name,
    slug:
      'slug' in (data as any) && typeof (data as any).slug === 'string' ? (data as any).slug : null,
    contact: {
      phone:
        'phone' in (data as any) && typeof (data as any).phone === 'string'
          ? (data as any).phone
          : null,
      whatsapp:
        'whatsapp' in (data as any) && typeof (data as any).whatsapp === 'string'
          ? (data as any).whatsapp
          : null,
      address:
        'address' in (data as any) && typeof (data as any).address === 'string'
          ? (data as any).address
          : null,
      instagram:
        'instagram' in (data as any) && typeof (data as any).instagram === 'string'
          ? (data as any).instagram
          : null,
    },
    attributes:
      'attributes' in (data as any) &&
      (data as any).attributes &&
      typeof (data as any).attributes === 'object'
        ? (data as any).attributes
        : {},
    services: Array.isArray(services) ? services.slice(0, 8) : [],
  };
}

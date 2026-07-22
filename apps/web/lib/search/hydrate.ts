import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { MatchEmbeddingRow, SearchEntityType, SearchHit } from './types';

type HydratableRow = {
  id: string;
  slug?: string | null;
  title?: string | null;
  subtitle?: string | null;
  name?: string | null;
  full_name?: string | null;
  about?: string | null;
  short_description?: string | null;
  description?: string | null;
  tagline?: string | null;
  type?: string | null;
  category_label?: string | null;
  location?: string | null;
  address?: string | null;
  address_street?: string | null;
  cover_url?: string | null;
  photo_url?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  secondary_phone?: string | null;
  hours_legacy_text?: string | null;
  short_dial?: string | null;
  when_to_use?: string | null;
  url?: string | null;
  active?: boolean | null;
  status?: string | null;
  review_status?: string | null;
  expires_at?: string | null;
};

type HydratableTable =
  | 'businesses'
  | 'accommodations'
  | 'restaurants'
  | 'tourism_guides'
  | 'fishing_guides'
  | 'events'
  | 'classifieds'
  | 'properties'
  | 'attractions'
  | 'tour_packages'
  | 'emergency_contacts'
  | 'health_facilities'
  | 'site_pages';

type EntityConfig = {
  table: HydratableTable;
  select: string;
  url: (row: HydratableRow) => string;
  subtitle: (row: HydratableRow) => string | null;
};

const ENTITY_CONFIG: Partial<Record<SearchEntityType, EntityConfig>> = {
  business: {
    table: 'businesses',
    select: 'id,slug,name,short_description,description,address,cover_url,phone,whatsapp,status',
    url: (row) => `/comercio/negocio/${row.slug ?? row.id}`,
    subtitle: (row) => row.short_description ?? row.address ?? 'Comércio local',
  },
  accommodation: {
    table: 'accommodations',
    select: 'id,slug,name,type,short_description,description,address,cover_url,status',
    url: (row) => `/turismo/onde-ficar/${row.slug ?? row.id}`,
    subtitle: (row) => row.short_description ?? row.type ?? 'Hospedagem',
  },
  restaurant: {
    table: 'restaurants',
    select: 'id,slug,name,description,address,cover_url,status',
    url: () => '/turismo/onde-comer',
    subtitle: (row) => row.address ?? 'Onde comer',
  },
  tourism_guide: {
    table: 'tourism_guides',
    select: 'id,slug,name,tagline,description,cover_url,status',
    url: (row) => `/turismo/guias/${row.slug ?? row.id}`,
    subtitle: (row) => row.tagline ?? row.description ?? 'Guia turístico',
  },
  fishing_guide: {
    table: 'fishing_guides',
    select: 'id,slug,full_name,about,photo_url,status',
    url: (row) => `/turismo/pesca/guias/${row.slug ?? row.id}`,
    subtitle: (row) => row.about ?? 'Guia de pesca',
  },
  event: {
    table: 'events',
    select: 'id,slug,title,description,location,address,cover_url,status',
    url: (row) => `/comunidade/agenda/${row.slug ?? row.id}`,
    subtitle: (row) => row.location ?? row.address ?? 'Agenda',
  },
  classified: {
    table: 'classifieds',
    select: 'id,slug,title,description,type,category_label,cover_url,status,review_status,expires_at',
    url: (row) => classifiedUrl(row),
    subtitle: (row) => row.category_label ?? row.type ?? 'Classificado',
  },
  property: {
    table: 'properties',
    select: 'id,slug,title,description,property_type,address_street,cover_url,status',
    url: (row) => `/imoveis/${row.slug ?? row.id}`,
    subtitle: (row) => row.address_street ?? row.type ?? 'Imóvel',
  },
  attraction: {
    table: 'attractions',
    select: 'id,slug,name,type,description,address,cover_url,status',
    url: (row) => `/turismo/o-que-fazer/${row.slug ?? row.id}`,
    subtitle: (row) => row.address ?? row.type ?? 'Atração',
  },
  tour_package: {
    table: 'tour_packages',
    select: 'id,slug,title,description,cover_url,status',
    url: () => '/turismo/pacotes',
    subtitle: () => 'Pacote turístico',
  },
  emergency_contact: {
    table: 'emergency_contacts',
    select: 'id,name,phone,whatsapp,short_dial,description,when_to_use,active',
    url: () => '/servicos/telefones',
    subtitle: (row) => row.phone ?? row.short_dial ?? 'Telefone útil',
  },
  health_facility: {
    table: 'health_facilities',
    select: 'id,name,phone,secondary_phone,whatsapp,hours_legacy_text,active',
    url: () => '/servicos/saude',
    subtitle: (row) => row.phone ?? row.secondary_phone ?? 'Saúde pública',
  },
  site_page: {
    table: 'site_pages',
    select: 'id,title,subtitle,description,url,active',
    url: (row) => row.url ?? '/',
    subtitle: (row) => row.subtitle ?? 'Página',
  },
};

export async function hydrateHits(
  hits: MatchEmbeddingRow[],
  cityId: string,
  source: SearchHit['source'],
): Promise<SearchHit[]> {
  const supabase = await createClient();
  const byType = new Map<SearchEntityType, MatchEmbeddingRow[]>();
  for (const hit of hits) {
    const group = byType.get(hit.entity_type) ?? [];
    group.push(hit);
    byType.set(hit.entity_type, group);
  }

  const rowsByKey = new Map<string, HydratableRow>();
  await Promise.all(
    Array.from(byType.entries()).map(async ([entityType, groupedHits]) => {
      const config = ENTITY_CONFIG[entityType];
      if (!config) return;
      const ids = groupedHits.map((hit) => hit.entity_id);
      const { data, error } = await supabase
        .from(config.table)
        .select(config.select)
        .eq('city_id', cityId)
        .in('id', ids);

      if (error) return;
      for (const row of (data ?? []) as unknown as HydratableRow[]) {
        if (!isPublicRow(entityType, row)) continue;
        rowsByKey.set(`${entityType}:${row.id}`, row);
      }
    }),
  );

  return hits.flatMap((hit) => {
    const row = rowsByKey.get(`${hit.entity_type}:${hit.entity_id}`);
    if (!row) return [];
    const config = ENTITY_CONFIG[hit.entity_type];
    if (!config) return [];
    const title = row.title ?? row.name ?? row.full_name ?? 'Resultado';

    return [{
      entityType: hit.entity_type,
      entityId: hit.entity_id,
      score: hit.score,
      title,
      subtitle: config.subtitle(row),
      description: row.when_to_use ?? row.description ?? row.short_description ?? row.hours_legacy_text ?? null,
      url: config.url(row),
      coverUrl: row.cover_url ?? row.photo_url ?? null,
      phone: row.phone ?? row.secondary_phone ?? null,
      whatsapp: row.whatsapp ?? null,
      source,
    }];
  });
}

function isPublicRow(entityType: SearchEntityType, row: HydratableRow): boolean {
  if (entityType === 'emergency_contact') return row.active === true;
  if (entityType === 'health_facility') return row.active === true;
  if (entityType === 'site_page') return row.active === true;

  if (entityType === 'classified') {
    const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : null;
    const isExpired = expiresAt !== null && Number.isFinite(expiresAt) && expiresAt < Date.now();
    return row.status === 'published' && row.review_status === 'approved' && !isExpired;
  }

  return ['active', 'approved', 'published'].includes(row.status ?? '');
}

function classifiedUrl(row: HydratableRow): string {
  const slug = row.slug ?? row.id;
  if (row.type === 'vehicle') return `/classificados/veiculos/${slug}`;
  if (row.type === 'job') return `/classificados/vagas/${slug}`;
  if (row.type === 'service') return `/classificados/servicos/${slug}`;
  if (row.type === 'item') return `/classificados/itens/${slug}`;
  return `/classificados`;
}

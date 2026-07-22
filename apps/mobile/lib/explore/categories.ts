import { Ionicons } from '@expo/vector-icons';

import { palette } from '@/lib/theme/tokens';
import type { MapPinKind } from '@/lib/api/map-layers';

export type ExploreCategory = {
  key: string;
  label: string;
  short: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  /** Layers (kinds) to fetch. */
  kinds: MapPinKind[];
  /** Optional business sub-category slug (e.g., 'alimentacao') — filters comercios. */
  businessCategorySlug?: string;
};

/**
 * Top-level cross-table (sempre visíveis nos chips — não vêm do DB porque cruzam
 * tabelas/lógicas diferentes: 'tudo' une tudo, 'pousadas' usa helper, 'atracoes'
 * é outra tabela, 'comercios' é todos os business sem filtro de subcategoria).
 */
export const EXPLORE_TOP_CATEGORIES: ExploreCategory[] = [
  { key: 'tudo',      label: 'Tudo',        short: 'Tudo',      icon: 'apps',       color: palette.ink900,     kinds: ['pousada', 'comercio', 'atracao'] },
  { key: 'pousadas',  label: 'Pousadas',    short: 'Pousadas',  icon: 'bed',        color: palette.cerrado700, kinds: ['pousada'] },
  { key: 'atracoes',  label: 'O que fazer', short: 'Atrações',  icon: 'map',        color: palette.sky500,     kinds: ['atracao'] },
  { key: 'comercios', label: 'Comércios',   short: 'Comércios', icon: 'storefront', color: palette.clay500,    kinds: ['comercio'] },
];

export function findCategory(
  key: string | null | undefined,
  extra: ExploreCategory[] = [],
): ExploreCategory {
  if (!key) return EXPLORE_TOP_CATEGORIES[0]!;
  const pool = [...EXPLORE_TOP_CATEGORIES, ...extra];
  return pool.find((c) => c.key === key) ?? EXPLORE_TOP_CATEGORIES[0]!;
}

export function cacheKeyForCategory(citySlug: string, category: ExploreCategory): string {
  const subset = category.kinds.slice().sort().join('+');
  const sub = category.businessCategorySlug ?? 'all';
  return `explore:${citySlug}:${subset}:${sub}`;
}

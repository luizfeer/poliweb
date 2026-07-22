import type { LucideIcon } from 'lucide-react';
import {
  Binoculars,
  CalendarDays,
  Church,
  Fish,
  Store,
  Utensils,
  BedDouble,
  Map,
} from 'lucide-react';

export type MapCategoryId =
  | 'atracao'
  | 'igreja'
  | 'pousada'
  | 'restaurante'
  | 'pesca'
  | 'guia'
  | 'comercio'
  | 'evento';

export type MapPoint = {
  id: string;
  category: MapCategoryId;
  name: string;
  slug: string;
  href: string;
  lat: number;
  lng: number;
  thumb?: string;
  badge?: string;
  description?: string;
  meta?: string;
};

export type MapCategory = {
  id: MapCategoryId;
  label: string;
  shortLabel: string;
  color: string;
  moduleKey: string;
  icon: LucideIcon;
};

export const MAP_CATEGORIES = [
  {
    id: 'atracao',
    label: 'Atrações',
    shortLabel: 'Atrações',
    color: '#e0561b',
    moduleKey: 'tourism',
    icon: Binoculars,
  },
  {
    id: 'igreja',
    label: 'Igrejas',
    shortLabel: 'Igrejas',
    color: '#8b5cf6',
    moduleKey: 'tourism',
    icon: Church,
  },
  {
    id: 'pousada',
    label: 'Onde ficar',
    shortLabel: 'Ficar',
    color: '#3c6b36',
    moduleKey: 'tourism',
    icon: BedDouble,
  },
  {
    id: 'restaurante',
    label: 'Onde comer',
    shortLabel: 'Comer',
    color: '#c81e4a',
    moduleKey: 'tourism',
    icon: Utensils,
  },
  {
    id: 'pesca',
    label: 'Pesca',
    shortLabel: 'Pesca',
    color: '#2e78c2',
    moduleKey: 'tourism',
    icon: Fish,
  },
  {
    id: 'guia',
    label: 'Guias',
    shortLabel: 'Guias',
    color: '#0f4c81',
    moduleKey: 'tourism',
    icon: Map,
  },
  {
    id: 'comercio',
    label: 'Comércios',
    shortLabel: 'Comércio',
    color: '#f4b73a',
    moduleKey: 'businesses',
    icon: Store,
  },
  {
    id: 'evento',
    label: 'Eventos',
    shortLabel: 'Eventos',
    color: '#0f766e',
    moduleKey: 'events',
    icon: CalendarDays,
  },
] as const satisfies readonly MapCategory[];

export const MAP_CATEGORY_IDS = MAP_CATEGORIES.map((category) => category.id);

export const MAP_CATEGORY_BY_ID = Object.fromEntries(
  MAP_CATEGORIES.map((category) => [category.id, category]),
) as Record<MapCategoryId, MapCategory>;

export function getEnabledMapCategories(modules: string[]): MapCategory[] {
  const enabledModules = new Set(modules);
  return MAP_CATEGORIES.filter((category) => enabledModules.has(category.moduleKey));
}

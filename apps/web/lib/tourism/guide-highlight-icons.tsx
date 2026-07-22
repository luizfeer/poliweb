import {
  Anchor,
  Camera,
  Church,
  Fish,
  Landmark,
  MapPin,
  Mountain,
  Ship,
  Star,
  Sun,
  TreePine,
  Utensils,
  Waves,
  type LucideIcon,
} from 'lucide-react';

export const GUIDE_HIGHLIGHT_ICON_KEYS = [
  'waves',
  'church',
  'ship',
  'camera',
  'mountain',
  'fish',
  'sun',
  'utensils',
  'tree',
  'landmark',
  'anchor',
  'pin',
] as const;

export type GuideHighlightIconKey = (typeof GUIDE_HIGHLIGHT_ICON_KEYS)[number];

export const GUIDE_HIGHLIGHT_ICON_MAP: Record<string, LucideIcon> = {
  waves: Waves,
  church: Church,
  ship: Ship,
  camera: Camera,
  mountain: Mountain,
  fish: Fish,
  sun: Sun,
  utensils: Utensils,
  tree: TreePine,
  landmark: Landmark,
  anchor: Anchor,
  pin: MapPin,
};

export function resolveGuideHighlightIcon(key: string): LucideIcon {
  return GUIDE_HIGHLIGHT_ICON_MAP[key] ?? Star;
}

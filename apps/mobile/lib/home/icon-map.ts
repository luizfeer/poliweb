import type { Ionicons } from '@expo/vector-icons';

import { palette } from '@/lib/theme/tokens';

type IonName = keyof typeof Ionicons.glyphMap;

/** Lucide (admin) → Ionicons (app). */
const LUCIDE_TO_ION: Record<string, IonName> = {
  Trash2: 'trash-outline',
  HeartPulse: 'medkit-outline',
  PhoneCall: 'call-outline',
  CloudSun: 'partly-sunny-outline',
  Church: 'business-outline',
  MessageCircleQuestion: 'help-circle-outline',
  Landmark: 'library-outline',
  Zap: 'flash-outline',
  Droplet: 'water-outline',
  BookOpen: 'book-outline',
  Fish: 'fish-outline',
  Store: 'storefront-outline',
  House: 'home-outline',
  CalendarDays: 'calendar-outline',
  Calendar: 'calendar-outline',
  Sparkles: 'sparkles-outline',
  Tag: 'pricetag-outline',
  Users: 'people-outline',
  Pill: 'bandage-outline',
  MapPinned: 'map-outline',
  Compass: 'compass-outline',
  BedDouble: 'bed-outline',
  Mountain: 'image-outline',
  ShieldCheck: 'shield-checkmark-outline',
  Megaphone: 'megaphone-outline',
  Gift: 'gift-outline',
  Mail: 'mail-outline',
  List: 'list-outline',
  LayoutGrid: 'grid-outline',
  GalleryHorizontal: 'images-outline',
};

export function lucideToIonicon(name: string | undefined): IonName {
  if (!name) return 'ellipse-outline';
  if (name in LUCIDE_TO_ION) return LUCIDE_TO_ION[name]!;
  const normalized = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  const guess = `${normalized}-outline` as IonName;
  return guess;
}

export function categoryToneToMobile(
  tone?: string,
): 'cerrado' | 'sky' | 'clay' | 'sun' | 'paperDeep' {
  switch (tone) {
    case 'clay':
      return 'clay';
    case 'sky':
      return 'sky';
    case 'sun':
      return 'sun';
    case 'paper-deep':
      return 'paperDeep';
    case 'cerrado':
    default:
      return 'cerrado';
  }
}

export function featureToneToMobile(tone?: string): 'clay' | 'cerrado' | 'sky' | 'sun' {
  switch (tone) {
    case 'clay':
      return 'clay';
    case 'sky':
      return 'sky';
    case 'sun':
      return 'sun';
    case 'paper-deep':
    case 'cerrado':
    default:
      return 'cerrado';
  }
}

export function ctaToneToMobile(tone?: string): 'sun' | 'clay' | 'cerrado' | 'sky' {
  switch (tone) {
    case 'sun':
      return 'sun';
    case 'clay':
      return 'clay';
    case 'sky':
      return 'sky';
    case 'cerrado':
    default:
      return 'cerrado';
  }
}

const SERVICE_ICON_BG: Record<string, string> = {
  paper: palette.paperDeep,
  'clay-50': palette.clay50,
  'cerrado-100': palette.cerrado100,
  'sky-100': palette.sky100,
  'sun-100': palette.sun100,
};

const SERVICE_ICON_FG: Record<string, string> = {
  'ink-900': palette.ink900,
  'clay-600': palette.clay600,
  'cerrado-700': palette.cerrado700,
  'sky-700': palette.sky700,
};

/** Cores do bloco `service_list` (espelha ListItem do web). */
export function serviceListIconColors(
  iconBg?: string,
  iconFg?: string,
): { bg: string; fg: string } {
  return {
    bg: SERVICE_ICON_BG[iconBg ?? 'paper'] ?? palette.paperDeep,
    fg: SERVICE_ICON_FG[iconFg ?? 'ink-900'] ?? palette.ink900,
  };
}

/** Ícone mais adequado por serviço público comum. */
export function serviceListIonicon(icon: string, title: string): IonName {
  const t = title.toLowerCase();
  if (t.includes('lixo') || t.includes('coleta')) return 'trash-outline';
  if (t.includes('farmácia') || t.includes('plantão')) return 'bandage-outline';
  if (t.includes('alerta')) return 'alert-circle-outline';
  if (t.includes('telefone')) return 'call-outline';
  return lucideToIonicon(icon);
}

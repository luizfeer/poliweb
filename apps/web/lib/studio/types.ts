import { z } from 'zod';
import { seedSlideContent, type RamoCopy, type SlideContent } from './copy';

// ── Modelo de documento (fonte de verdade da arte) ──────────────────────────
export const RAMO_IDS = ['restaurante', 'loja', 'servicos', 'pousada'] as const;
export const FORMAT_IDS = ['feed-45', 'feed-11', 'story'] as const;
export const THEME_IDS = ['paper', 'ink', 'primary', 'accent'] as const;
export const KIND_IDS = [
  'hero',
  'oferta',
  'vitrine',
  'ficha',
  'horario',
  'pix',
  'depoimento',
  'novidade',
  'roteiro',
  'cta',
] as const;

export type RamoId = (typeof RAMO_IDS)[number];
export type FormatId = (typeof FORMAT_IDS)[number];
export type ThemeId = (typeof THEME_IDS)[number];
export type KindId = (typeof KIND_IDS)[number];

export type Slide = {
  id: string;
  kind: KindId;
  theme: ThemeId;
  format: FormatId;
  photo: string | null;
  /**
   * Conteúdo específico deste card (sobrescreve o copy padrão do ramo). É o que
   * carrega os dados reais do comércio e o texto gerado por IA. Fica salvo no
   * documento, então reels e capturas renderizam fielmente sem o contexto vivo.
   */
  content?: SlideContent;
};

// ── Contexto real do comércio (alimenta defaults e a IA) ─────────────────────
export type StudioProduct = {
  id: string;
  name: string;
  price?: string;
  meta?: string;
  photoUrl?: string | null;
};

export type StudioReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
};

export type BusinessContext = {
  businessId: string;
  name: string;
  ramo: RamoId;
  hasInstagram: boolean;
  /** '@handle' real ou, na falta, derivado do nome (sem exemplo fixo). */
  handle: string;
  instagram: string | null;
  cidade: string;
  district: string | null;
  category: string | null;
  description: string | null;
  /** Endereço público (rua/bairro) — nunca número/complemento sensível. */
  address: string | null;
  hoursText: { day: string; hours: string }[];
  hoursNote: string | null;
  phone: string | null;
  whatsapp: string | null;
  payments: string[];
  amenities: string[];
  coverUrl: string | null;
  logoUrl: string | null;
  photos: string[];
  products: StudioProduct[];
  reviews: StudioReview[];
  pixKey: string | null;
};

// ── Intenção do post (briefing antes de gerar) ───────────────────────────────
export const POST_INTENTS = [
  { id: 'promo', label: 'Divulgar uma promoção', icon: 'Tag' },
  { id: 'lancamento', label: 'Anunciar novidade ou lançamento', icon: 'Megaphone' },
  { id: 'cardapio', label: 'Mostrar produtos ou cardápio', icon: 'LayoutGrid' },
  { id: 'horario', label: 'Avisar o horário de funcionamento', icon: 'Clock' },
  { id: 'depoimento', label: 'Destacar avaliação de cliente', icon: 'Star' },
  { id: 'institucional', label: 'Apresentar o negócio', icon: 'Store' },
] as const;
export const POST_INTENT_IDS = POST_INTENTS.map((i) => i.id) as [PostIntentId, ...PostIntentId[]];
export type PostIntentId = (typeof POST_INTENTS)[number]['id'];

/** Carrossel sugerido por intenção (fallback sem IA e ponto de partida da IA). */
export const INTENT_CAROUSELS: Record<PostIntentId, KindId[]> = {
  promo: ['hero', 'oferta', 'cta'],
  lancamento: ['hero', 'novidade', 'cta'],
  cardapio: ['hero', 'vitrine', 'oferta', 'cta'],
  horario: ['hero', 'horario', 'cta'],
  depoimento: ['hero', 'depoimento', 'cta'],
  institucional: ['hero', 'ficha', 'horario', 'cta'],
};

export type ArtDocument = {
  slides: Slide[];
};

export type ArtPiece = {
  id: string;
  cityId: string;
  businessId: string;
  name: string;
  ramo: RamoId;
  format: FormatId;
  document: ArtDocument;
  createdAt: string;
  updatedAt: string;
};

// ── Validação da fonte da foto (anti-SSRF) ──────────────────────────────────
// A foto vira `<img src>`/`background: url()` renderizado num Chromium headless
// no media-processor. Sem restrição, um comerciante apontaria pra URL interna
// (metadata da cloud, serviços privados). Só aceitamos:
//   - data:image/... (upload local via FileReader no editor)
//   - https do host do CDN/R2 (cdnUrl do upload processado)
const R2_HOST = (() => {
  try {
    const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ?? process.env.R2_PUBLIC_BASE_URL;
    return base ? new URL(base).host : null;
  } catch {
    return null;
  }
})();

export function isAllowedPhotoSource(value: string): boolean {
  if (value.startsWith('data:image/')) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && R2_HOST != null && u.host === R2_HOST;
  } catch {
    return false;
  }
}

// ── Zod (input das server actions) ──────────────────────────────────────────
export const slideSchema = z.object({
  id: z.string().min(1).max(40),
  kind: z.enum(KIND_IDS),
  theme: z.enum(THEME_IDS),
  format: z.enum(FORMAT_IDS),
  photo: z
    .string()
    .max(2_000_000)
    .refine(isAllowedPhotoSource, 'Foto deve ser upload local ou do CDN.')
    .nullable(), // data URL ou cdnUrl
  // Conteúdo do card é JSON livre (texto editável/IA). Limitado em tamanho via
  // serialização no documento; aqui só garantimos que é um objeto.
  content: z.record(z.string(), z.unknown()).optional(),
});

export const artDocumentSchema = z.object({
  slides: z.array(slideSchema).min(1).max(12),
});

// ── Metadados de UI ─────────────────────────────────────────────────────────
export type RamoMeta = { id: RamoId; label: string; icon: string };
export const RAMOS: RamoMeta[] = [
  { id: 'restaurante', label: 'Restaurante', icon: 'UtensilsCrossed' },
  { id: 'loja', label: 'Loja', icon: 'Store' },
  { id: 'servicos', label: 'Serviços', icon: 'Wrench' },
  { id: 'pousada', label: 'Pousada', icon: 'BedDouble' },
];

export type FormatMeta = { id: FormatId; label: string; w: number; h: number; hint: string };
export const FORMATS: FormatMeta[] = [
  { id: 'feed-45', label: 'Feed 4:5', w: 1080, h: 1350, hint: 'Post no feed' },
  { id: 'feed-11', label: 'Feed 1:1', w: 1080, h: 1080, hint: 'Quadrado' },
  { id: 'story', label: 'Story 9:16', w: 1080, h: 1920, hint: 'Story e status' },
];

export type ThemeMeta = { id: ThemeId; label: string; swatch: string; text: string };
export const THEMES: ThemeMeta[] = [
  { id: 'paper', label: 'Areia', swatch: '#FAF6EF', text: '#191919' },
  { id: 'ink', label: 'Carvão', swatch: '#1A1612', text: '#F6EFE3' },
  { id: 'primary', label: 'Telha', swatch: '#E0561B', text: '#FFF6EE' },
  { id: 'accent', label: 'Canastra', swatch: '#1F4A2C', text: '#F1F7EE' },
];

export type KindMeta = { id: KindId; label: string; sub: string; icon: string };
export const SLIDE_KINDS: KindMeta[] = [
  { id: 'hero', label: 'Capa', sub: 'Foto, selo e chamada', icon: 'Image' },
  { id: 'oferta', label: 'Oferta', sub: 'De/por, % e validade', icon: 'Tag' },
  { id: 'vitrine', label: 'Vitrine', sub: 'Grade com nome e preço', icon: 'LayoutGrid' },
  { id: 'ficha', label: 'Ficha', sub: 'Ícones e informações', icon: 'StickyNote' },
  { id: 'horario', label: 'Horário', sub: 'Dias e horas de funcionamento', icon: 'Clock' },
  { id: 'pix', label: 'Plaquinha Pix', sub: 'Chave Pix em destaque', icon: 'CreditCard' },
  { id: 'depoimento', label: 'Depoimento', sub: 'Avaliação de cliente', icon: 'Star' },
  { id: 'novidade', label: 'Recado', sub: 'Aviso curto e direto', icon: 'Megaphone' },
  { id: 'roteiro', label: 'Roteiro', sub: 'Passos numerados', icon: 'ListOrdered' },
  { id: 'cta', label: 'Fechamento', sub: 'Pílulas e botão', icon: 'MessageCircle' },
];

export const CAROUSELS: Record<RamoId, KindId[]> = {
  restaurante: ['hero', 'vitrine', 'oferta', 'cta'],
  loja: ['hero', 'vitrine', 'oferta', 'cta'],
  servicos: ['hero', 'vitrine', 'ficha', 'cta'],
  pousada: ['hero', 'vitrine', 'roteiro', 'cta'],
};

export const KINDS_BY_RAMO: Record<RamoId, KindId[]> = {
  restaurante: ['hero', 'oferta', 'vitrine', 'ficha', 'horario', 'pix', 'depoimento', 'novidade', 'cta'],
  loja: ['hero', 'oferta', 'vitrine', 'ficha', 'horario', 'pix', 'depoimento', 'novidade', 'cta'],
  servicos: ['hero', 'oferta', 'vitrine', 'ficha', 'horario', 'pix', 'depoimento', 'novidade', 'cta'],
  pousada: ['hero', 'oferta', 'vitrine', 'ficha', 'horario', 'pix', 'depoimento', 'roteiro', 'novidade', 'cta'],
};

export function kindMeta(id: KindId): KindMeta {
  return SLIDE_KINDS.find((k) => k.id === id) ?? SLIDE_KINDS[0];
}
export function formatMeta(id: FormatId): FormatMeta {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0];
}

export function newSlideId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function makeSlide(
  kind: KindId,
  theme: ThemeId,
  format: FormatId,
  content?: SlideContent,
): Slide {
  return { id: newSlideId(), kind, theme, format, photo: null, content };
}

/** Tema alternado pra dar ritmo claro/escuro no carrossel. */
function themeFor(index: number): ThemeId {
  return index === 0 ? 'primary' : index % 2 === 0 ? 'paper' : 'ink';
}

export function buildSlides(ramo: RamoId, format: FormatId, copy?: RamoCopy): Slide[] {
  const kinds = CAROUSELS[ramo] ?? ['hero', 'cta'];
  return kinds.map((k, i) => makeSlide(k, i === 0 ? 'primary' : 'paper', format, seedSlideContent(k, copy)));
}

export function buildIntentSlides(
  ramo: RamoId,
  format: FormatId,
  intent: PostIntentId,
  copy?: RamoCopy,
): Slide[] {
  const kinds = INTENT_CAROUSELS[intent] ?? CAROUSELS[ramo] ?? ['hero', 'cta'];
  return kinds.map((k, i) => makeSlide(k, themeFor(i), format, seedSlideContent(k, copy)));
}

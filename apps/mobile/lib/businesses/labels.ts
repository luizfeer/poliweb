import type { Ionicons } from '@expo/vector-icons';

import type { Amenity, Business, Hours, PaymentMethod } from '@/lib/businesses/types';

type IoniconName = keyof typeof Ionicons.glyphMap;

export const HOURS_DAYS: { key: keyof Hours; label: string }[] = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

export const AMENITY_META: Record<Amenity, { icon: IoniconName; label: string }> = {
  estacionamento: { icon: 'car-outline', label: 'Estacionamento' },
  wifi: { icon: 'wifi-outline', label: 'Wi-Fi' },
  aceita_pet: { icon: 'paw-outline', label: 'Aceita pet' },
  delivery: { icon: 'bicycle-outline', label: 'Delivery' },
  retira_no_local: { icon: 'bag-handle-outline', label: 'Retira no local' },
  retirada: { icon: 'bag-handle-outline', label: 'Retirada' },
  consumo_local: { icon: 'restaurant-outline', label: 'Consumo no local' },
  area_externa: { icon: 'leaf-outline', label: 'Área externa' },
  banheiro: { icon: 'accessibility-outline', label: 'Banheiro' },
  pet_friendly: { icon: 'paw-outline', label: 'Aceita pet' },
  criancas: { icon: 'happy-outline', label: 'Bom para crianças' },
  grupos: { icon: 'people-outline', label: 'Bom para grupos' },
  reservas: { icon: 'calendar-outline', label: 'Aceita reservas' },
  musica_ao_vivo: { icon: 'musical-notes-outline', label: 'Música ao vivo' },
  acessivel: { icon: 'accessibility-outline', label: 'Acessível' },
  ar_condicionado: { icon: 'snow-outline', label: 'Ar-condicionado' },
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  credito: 'Crédito',
  debito: 'Débito',
  aproximacao: 'Aproximação',
  vale_refeicao: 'VR',
  vale_alimentacao: 'VA',
};

const DELIVERY_CATEGORY_SLUGS = new Set([
  'alimentacao',
  'restaurantes',
  'lanchonete',
  'pizzaria',
  'padaria',
  'acougue',
  'bar',
  'mercado',
  'sorveteria',
  'chocolateria',
  'disk-bebidas',
  'disk-gas',
  'conveniencia',
]);

/** Espelha `visibleBusinessAmenities` do web: esconde 'delivery' fora de alimentação. */
export function visibleBusinessAmenities(business: Business): Amenity[] {
  return (business.amenities ?? []).filter((amenity) => {
    if (amenity !== 'delivery') return true;
    return business.categories.some((slug) => DELIVERY_CATEGORY_SLUGS.has(slug));
  });
}

export function formatHoursRange(ranges: Hours[keyof Hours]): string {
  if (!ranges || ranges.length === 0) return 'Fechado';
  return ranges.map((r) => `${r.open}–${r.close}`).join(' · ');
}

export function normalizeInstagram(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutDomain = trimmed.replace(/^.*instagram\.com\//i, '');
  const handle = withoutDomain.replace(/^@/, '').split(/[/?#]/)[0]?.trim();
  return handle || null;
}

export function normalizeWebsite(value: string | undefined): { label: string; href: string } | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return {
    label: trimmed.replace(/^https?:\/\//i, ''),
    href: /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
  };
}

/** Dígitos do WhatsApp prontos pra `wa.me/55...`. */
export function whatsappDigits(value: string | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}

/** Detecta vídeo por extensão (espelha isVideoPhoto do web). */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url);
}

/** URLs na ordem do hero público: capa primeiro, depois `photos`, sem duplicatas. */
export function getBusinessDisplayPhotoUrls(
  business: Pick<Business, 'coverUrl' | 'photos'>,
): string[] {
  const raw = [
    ...(business.coverUrl ? [business.coverUrl] : []),
    ...(business.photos ? [...business.photos].reverse() : []),
  ];
  return Array.from(new Set(raw.filter((url): url is string => Boolean(url))));
}

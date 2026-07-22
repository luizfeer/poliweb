import type { SearchEntityType } from '@/lib/chat/types';
import { ONDE_FICAR_ROUTE } from '@/lib/navigation/onde-ficar';

export const SEARCH_PLACEHOLDERS = [
  'almoçar perto da praça',
  'encanador',
  'pousada com piscina',
  'eventos no fim de semana',
];

export const TRENDING_QUERIES = [
  'pousada',
  'farmácia',
  'restaurante',
  'encanador',
  'eventos',
  'imóveis',
];

export const QUICK_CATEGORIES: { label: string; href: string; icon: string }[] = [
  { label: 'Pousadas', href: ONDE_FICAR_ROUTE as string, icon: 'bed' },
  { label: 'Onde comer', href: '/webview/turismo-onde-comer', icon: 'restaurant' },
  { label: 'O que fazer', href: '/webview/turismo-o-que-fazer', icon: 'compass' },
  { label: 'Saúde', href: '/webview/servicos-saude', icon: 'medkit' },
  { label: 'Imóveis', href: '/webview/imoveis', icon: 'home' },
  { label: 'Comércio', href: '/webview/comercio', icon: 'storefront' },
];

export const SEARCH_FILTERS: { type: SearchEntityType; label: string }[] = [
  { type: 'business', label: 'Comércio' },
  { type: 'restaurant', label: 'Restaurantes' },
  { type: 'accommodation', label: 'Hospedagem' },
  { type: 'event', label: 'Eventos' },
  { type: 'classified', label: 'Classificados' },
  { type: 'property', label: 'Imóveis' },
  { type: 'attraction', label: 'Turismo' },
  { type: 'tourism_guide', label: 'Guias' },
  { type: 'site_page', label: 'Páginas' },
];

export const ENTITY_LABELS: Partial<Record<SearchEntityType, string>> = {
  business: 'Comércio',
  accommodation: 'Hospedagem',
  restaurant: 'Restaurante',
  tourism_guide: 'Guia',
  fishing_guide: 'Pesca',
  event: 'Evento',
  classified: 'Classificado',
  property: 'Imóvel',
  attraction: 'Turismo',
  tour_package: 'Passeio',
  site_page: 'Página',
  emergency_contact: 'Emergência',
  health_facility: 'Saúde',
};

export const ENTITY_ICONS: Partial<Record<SearchEntityType, string>> = {
  business: 'storefront',
  accommodation: 'bed',
  restaurant: 'restaurant',
  tourism_guide: 'book',
  fishing_guide: 'fish',
  event: 'calendar',
  classified: 'pricetag',
  property: 'home',
  attraction: 'map',
  tour_package: 'boat',
  site_page: 'document-text',
};

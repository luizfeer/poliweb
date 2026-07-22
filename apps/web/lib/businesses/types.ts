/**
 * Tipos do módulo `businesses` (guia comercial).
 *
 * Seguem o schema de Supabase em `supabase/migrations/20260429120200_businesses.sql`.
 * Em dev, dados vêm do mock em `lib/businesses/mock.ts`. Em prod, das queries
 * Supabase em `lib/businesses/queries.ts`.
 */

export type EntityStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';

export type Hours = {
  /** Dias da semana — chaves: mon..sun. Cada dia tem 0+ ranges (almoço/tarde/noite). */
  [day in 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun']?: Array<{
    open: string; // "08:00"
    close: string; // "18:00"
  }>;
};

export type Amenity =
  | 'estacionamento'
  | 'wifi'
  | 'aceita_pet'
  | 'delivery'
  | 'retira_no_local'
  | 'retirada'
  | 'consumo_local'
  | 'area_externa'
  | 'banheiro'
  | 'pet_friendly'
  | 'criancas'
  | 'grupos'
  | 'reservas'
  | 'musica_ao_vivo'
  | 'acessivel'
  | 'ar_condicionado';

export type PaymentMethod =
  | 'pix'
  | 'dinheiro'
  | 'credito'
  | 'debito'
  | 'aproximacao'
  | 'vale_refeicao'
  | 'vale_alimentacao';

export type GoogleImportSummary = {
  kind: 'editorial' | 'review' | 'generative';
  label: string;
  text: string;
};

export type GoogleImportReview = {
  id: string;
  authorName?: string;
  authorUrl?: string;
  rating?: number;
  text?: string;
  relativeTime?: string;
  publishedAt?: string;
};

export type GoogleImportSource = {
  placeId?: string;
  googleMapsUrl?: string;
  streetViewUrl?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  priceLevel?: string;
  priceRange?: string;
  openNow?: boolean;
  summaries?: GoogleImportSummary[];
  approvedReviews?: GoogleImportReview[];
};

export type BusinessCategory = {
  id?: string;
  cityId?: string | null;
  slug: string;
  name: string;
  /** Slug da categoria pai. Macro categorias não têm parent. */
  parent?: string;
  /** Nome do ícone Lucide (resolvido pelo `icon-map.ts`). */
  icon: string;
  /** Curta descrição para o hub. */
  blurb?: string;
};

export type Business = {
  id: string;
  cityId: string;
  citySlug: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;

  // contato
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  googleMapsUrl?: string;
  googleImportSource?: GoogleImportSource;

  // endereço
  address?: string;
  districtId?: string | null;
  district?: string;
  cep?: string;
  lat?: number;
  lng?: number;

  hours?: Hours;
  amenities?: Amenity[];
  paymentMethods?: PaymentMethod[];

  /** Slugs de categorias. A primeira é a primária. */
  categories: string[];
  categoryIds?: string[];

  // mídia
  coverUrl?: string;
  logoUrl?: string;
  ogImageUrl?: string;
  ogSquareImageUrl?: string;
  photos?: string[];

  // gestão
  status: EntityStatus;
  plan: 'free' | 'featured' | 'premium';
  featured?: boolean;
  verified?: boolean;
  /** Comerciante reivindicou a página. Quando false, mostra CTA "É seu? Reivindique". */
  claimed?: boolean;
  orderingEnabled?: boolean;

  // métricas (pra ordenação/destaque)
  viewsCount?: number;
  /** Nota média: combina avaliações publicadas no portal com dados do Google (import), quando existirem. */
  rating?: number;
  /** Total de referências de avaliação usado na vitrine (portal + Google, conforme import). */
  reviewsCount?: number;
  /** Só avaliações publicadas no portal (bloco #avaliacoes). */
  portalReviewsCount?: number;

  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BusinessSearchParams = {
  city_id?: string;
  category_id?: string;
  district_id?: string | null;
  page?: number;
  q?: string;
  /** Categoria (slug). Aceita macro ou folha. */
  category?: string;
  district?: string;
  amenity?: Amenity;
  hasWhatsapp?: boolean;
  /** "rating" | "name" | "recent" | "featured" */
  sort?: 'rating' | 'name' | 'recent' | 'featured';
  limit?: number;
  offset?: number;
};

export type BusinessPromotion = {
  id: string;
  businessId: string;
  title: string;
  description?: string;
  couponCode?: string;
  discountPercent?: number;
  validFrom?: string;
  validUntil?: string;
  active: boolean;
};

export type BusinessReview = {
  id: string;
  businessId: string;
  authorName?: string;
  rating: number;
  title?: string;
  comment?: string;
  photoUrl?: string;
  replyOwner?: string;
  replyAt?: string;
  createdAt?: string;
};

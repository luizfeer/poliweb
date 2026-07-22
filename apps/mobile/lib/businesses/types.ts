/**
 * Tipos do módulo `businesses` — porte fiel de `apps/web/lib/businesses/types.ts`.
 *
 * Mantém o mesmo shape do web para o app ler o Supabase direto sem divergir.
 * Veja a skill `web-mobile-parity` antes de alterar — esses tipos têm par no web.
 */

export type EntityStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';

export type Hours = {
  [day in 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun']?: {
    open: string;
    close: string;
  }[];
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

export type Business = {
  id: string;
  cityId: string;
  citySlug: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;

  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  googleMapsUrl?: string;
  googleImportSource?: GoogleImportSource;

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
  /** Nomes de exibição, alinhados por índice com `categories`. */
  categoryNames: string[];
  categoryIds?: string[];

  coverUrl?: string;
  logoUrl?: string;
  ogImageUrl?: string;
  ogSquareImageUrl?: string;
  photos?: string[];

  status: EntityStatus;
  plan: 'free' | 'featured' | 'premium';
  featured?: boolean;
  verified?: boolean;
  claimed?: boolean;
  orderingEnabled?: boolean;

  viewsCount?: number;
  rating?: number;
  reviewsCount?: number;
  portalReviewsCount?: number;

  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
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

/** Post de novidade de uma entidade (espelha apps/web/lib/posts/types.ts). */
export type EntityPost = {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
  pinned: boolean;
  publishedAt?: string | null;
  createdAt?: string | null;
};

/** Card leve de negócio relacionado. */
export type RelatedBusiness = {
  id: string;
  slug: string;
  name: string;
  coverUrl: string | null;
  district: string | null;
  categoryLabel: string | null;
  rating: number | null;
  reviewsCount: number | null;
};

/** Payload completo da tela de detalhe nativa. */
export type BusinessDetail = {
  business: Business;
  promotions: BusinessPromotion[];
  reviews: BusinessReview[];
  posts: EntityPost[];
  related: RelatedBusiness[];
};

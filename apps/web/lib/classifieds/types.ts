import type { Json } from '@/lib/supabase/database.types';

export type ClassifiedType = 'vehicle' | 'job' | 'service' | 'item' | 'other';
export type ClassifiedReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_changes';
export type ClassifiedPaymentStatus = 'not_required' | 'pending' | 'paid' | 'waived';

export type ClassifiedBase = {
  id: string;
  cityId: string;
  authorProfileId: string | null;
  slug: string;
  type: ClassifiedType;
  title: string;
  description: string | null;
  price: number | null;
  isNegotiable: boolean;
  categoryLabel: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  coverUrl: string | null;
  ogImageUrl?: string;
  ogSquareImageUrl?: string;
  photos: Json | null;
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
  reviewStatus: ClassifiedReviewStatus;
  paymentStatus: ClassifiedPaymentStatus;
  paymentAmountCents: number;
  rejectionReason: string | null;
  expiresAt: string | null;
  featuredUntil: string | null;
  flaggedCount: number;
  createdAt: string | null;
};

export type VehicleDetails = {
  marca: string | null;
  modelo: string | null;
  anoModelo: number | null;
  anoFabricacao: number | null;
  km: number | null;
  combustivel: string | null;
  cambio: string | null;
  cor: string | null;
  placaFinal: string | null;
};

export type JobDetails = {
  tipo: 'clt' | 'pj' | 'temporario' | null;
  faixaSalarial: string | null;
  modalidade: 'presencial' | 'remoto' | 'hibrido' | null;
  beneficios: Json | null;
  requisitos: string | null;
};

export type ServiceDetails = {
  areaAtuacao: string | null;
  atendeEmCasa: boolean | null;
  raioAtendimentoKm: number | null;
  faixaPreco: string | null;
};

export type ItemDetails = {
  condicao: 'novo' | 'seminovo' | 'usado' | null;
  marca: string | null;
  aceitaTroca: boolean | null;
  motivoVenda: string | null;
  isFreeItem: boolean;
};

export type ClassifiedDetails = {
  vehicle?: VehicleDetails;
  job?: JobDetails;
  service?: ServiceDetails;
  item?: ItemDetails;
};

export type Classified = ClassifiedBase & ClassifiedDetails;

export type ClassifiedCounts = Record<ClassifiedType, number>;

export type CityModuleConfig = {
  classifieds_payment_active?: boolean;
  pricing_cents?: Partial<Record<ClassifiedType, number>>;
};

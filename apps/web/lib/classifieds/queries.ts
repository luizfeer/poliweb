import 'server-only';

import { getCurrentCity } from '@/lib/cities';
import { searchTermsForBroadIlike } from '@/lib/search/query-tokens';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import type {
  Classified,
  ClassifiedCounts,
  ClassifiedReviewStatus,
  ClassifiedType,
  CityModuleConfig,
} from './types';

export type ClassifiedReport = {
  id: string;
  classifiedId: string;
  reason: string;
  notes: string | null;
  status: string;
  createdAt: string | null;
  classifiedTitle: string | null;
};

type ClassifiedRow = {
  id: string;
  city_id: string;
  author_profile_id: string | null;
  slug: string | null;
  type: ClassifiedType;
  title: string;
  description: string | null;
  price: number | null;
  is_negotiable: boolean | null;
  category_label: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  cover_url: string | null;
  og_image_url: string | null;
  og_square_image_url: string | null;
  photos: Json | null;
  status: Classified['status'] | null;
  review_status: ClassifiedReviewStatus | null;
  payment_status: Classified['paymentStatus'] | null;
  payment_amount_cents: number | null;
  rejection_reason: string | null;
  expires_at: string | null;
  featured_until: string | null;
  flagged_count: number | null;
  created_at: string | null;
  classified_vehicles?: VehicleRow | VehicleRow[] | null;
  classified_jobs?: JobRow | JobRow[] | null;
  classified_services?: ServiceRow | ServiceRow[] | null;
  classified_items?: ItemRow | ItemRow[] | null;
};

type VehicleRow = {
  marca: string | null;
  modelo: string | null;
  ano_modelo: number | null;
  ano_fabricacao: number | null;
  km: number | null;
  combustivel: string | null;
  cambio: string | null;
  cor: string | null;
  placa_final: string | null;
};

type JobRow = {
  tipo: Classified['job'] extends infer T ? T extends { tipo: infer K } ? K : never : never;
  faixa_salarial: string | null;
  modalidade: Classified['job'] extends infer T ? T extends { modalidade: infer K } ? K : never : never;
  beneficios: Json | null;
  requisitos: string | null;
};

type ServiceRow = {
  area_atuacao: string | null;
  atende_em_casa: boolean | null;
  raio_atendimento_km: number | null;
  faixa_preco: string | null;
};

type ItemRow = {
  condicao: Classified['item'] extends infer T ? T extends { condicao: infer K } ? K : never : never;
  marca: string | null;
  aceita_troca: boolean | null;
  motivo_venda: string | null;
  is_free_item: boolean | null;
};

type CityModuleRow = {
  config: Json | null;
};

async function getCityId(cityId?: string): Promise<string | null> {
  if (cityId) return cityId;
  const city = await getCurrentCity();
  return city?.id ?? null;
}

export async function getClassifiedsConfig(cityId: string): Promise<CityModuleConfig> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('city_modules')
    .select('config')
    .eq('city_id', cityId)
    .eq('module_key', 'classifieds')
    .maybeSingle();

  return parseConfig((data as CityModuleRow | null)?.config);
}

export async function listClassifiedsByType(params: {
  cityId?: string;
  type?: ClassifiedType;
  q?: string;
  limit?: number;
} = {}): Promise<Classified[]> {
  const cityId = await getCityId(params.cityId);
  if (!cityId) return [];

  const supabase = await createClient();
  let query = supabase
    .from('classifieds')
    .select(classifiedSelect)
    .eq('city_id', cityId)
    .eq('status', 'published')
    .eq('review_status', 'approved')
    .gt('expires_at', new Date().toISOString())
    .order('featured_until', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 60);

  if (params.type) query = query.eq('type', params.type);
  if (params.q) {
    const terms = searchTermsForBroadIlike(params.q);
    if (terms.length === 1) {
      query = query.or(`title.ilike.%${terms[0]}%,description.ilike.%${terms[0]}%`);
    } else if (terms.length > 1) {
      const ors = terms.flatMap((t) => [`title.ilike.%${t}%`, `description.ilike.%${t}%`]);
      query = query.or(ors.join(','));
    }
  }

  const { data, error } = await query;
  if (error) return [];
  return ((data ?? []) as unknown as ClassifiedRow[]).map(toClassified);
}

export async function getClassifiedBySlug(params: {
  cityId?: string;
  slug: string;
}): Promise<Classified | null> {
  const cityId = await getCityId(params.cityId);
  if (!cityId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('classifieds')
    .select(classifiedSelect)
    .eq('city_id', cityId)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .eq('review_status', 'approved')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return toClassified(data as unknown as ClassifiedRow);
}

export async function listMyClassifieds(cityId: string, profileId: string): Promise<Classified[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('classifieds')
    .select(classifiedSelect)
    .eq('city_id', cityId)
    .eq('author_profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return ((data ?? []) as unknown as ClassifiedRow[]).map(toClassified);
}

export async function listClassifiedsForReview(cityId: string): Promise<Classified[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('classifieds')
    .select(classifiedSelect)
    .eq('city_id', cityId)
    .eq('status', 'pending')
    .in('review_status', ['pending', 'needs_changes'])
    .order('created_at', { ascending: false });

  if (error) return [];
  return ((data ?? []) as unknown as ClassifiedRow[]).map(toClassified);
}

export async function countClassifiedsByType(cityId: string): Promise<ClassifiedCounts> {
  const counts: ClassifiedCounts = { vehicle: 0, job: 0, service: 0, item: 0, other: 0 };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('classifieds')
    .select('type')
    .eq('city_id', cityId)
    .eq('status', 'published')
    .eq('review_status', 'approved')
    .gt('expires_at', new Date().toISOString());

  if (error) return counts;
  for (const row of data ?? []) {
    counts[row.type as ClassifiedType] += 1;
  }
  return counts;
}

export async function listClassifiedReports(cityId: string): Promise<ClassifiedReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('classified_reports')
    .select('id, classified_id, reason, notes, status, created_at, classifieds(title)')
    .eq('city_id', cityId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return ((data ?? []) as unknown as Array<{
    id: string;
    classified_id: string;
    reason: string;
    notes: string | null;
    status: string;
    created_at: string | null;
    classifieds?: { title: string | null } | null;
  }>).map((row) => ({
    id: row.id,
    classifiedId: row.classified_id,
    reason: row.reason,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    classifiedTitle: row.classifieds?.title ?? null,
  }));
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toClassified(row: ClassifiedRow): Classified {
  const vehicle = first(row.classified_vehicles);
  const job = first(row.classified_jobs);
  const service = first(row.classified_services);
  const item = first(row.classified_items);

  return {
    id: row.id,
    cityId: row.city_id,
    authorProfileId: row.author_profile_id,
    slug: row.slug ?? row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    price: row.price,
    isNegotiable: row.is_negotiable ?? false,
    categoryLabel: row.category_label,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactWhatsapp: row.contact_whatsapp,
    coverUrl: row.cover_url,
    ogImageUrl: row.og_image_url ?? undefined,
    ogSquareImageUrl: row.og_square_image_url ?? undefined,
    photos: row.photos,
    status: row.status ?? 'draft',
    reviewStatus: row.review_status ?? 'pending',
    paymentStatus: row.payment_status ?? 'not_required',
    paymentAmountCents: row.payment_amount_cents ?? 0,
    rejectionReason: row.rejection_reason,
    expiresAt: row.expires_at,
    featuredUntil: row.featured_until,
    flaggedCount: row.flagged_count ?? 0,
    createdAt: row.created_at,
    vehicle: vehicle ? {
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      anoModelo: vehicle.ano_modelo,
      anoFabricacao: vehicle.ano_fabricacao,
      km: vehicle.km,
      combustivel: vehicle.combustivel,
      cambio: vehicle.cambio,
      cor: vehicle.cor,
      placaFinal: vehicle.placa_final,
    } : undefined,
    job: job ? {
      tipo: job.tipo,
      faixaSalarial: job.faixa_salarial,
      modalidade: job.modalidade,
      beneficios: job.beneficios,
      requisitos: job.requisitos,
    } : undefined,
    service: service ? {
      areaAtuacao: service.area_atuacao,
      atendeEmCasa: service.atende_em_casa,
      raioAtendimentoKm: service.raio_atendimento_km,
      faixaPreco: service.faixa_preco,
    } : undefined,
    item: item ? {
      condicao: item.condicao,
      marca: item.marca,
      aceitaTroca: item.aceita_troca,
      motivoVenda: item.motivo_venda,
      isFreeItem: item.is_free_item ?? false,
    } : undefined,
  };
}

function parseConfig(config: Json | null | undefined): CityModuleConfig {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return {};
  const data = config as Record<string, Json>;
  const pricing = data.pricing_cents;
  return {
    classifieds_payment_active: data.classifieds_payment_active === true,
    pricing_cents: pricing && typeof pricing === 'object' && !Array.isArray(pricing)
      ? Object.fromEntries(
          Object.entries(pricing).filter(([, value]) => typeof value === 'number'),
        ) as CityModuleConfig['pricing_cents']
      : undefined,
  };
}

const classifiedSelect = `
  id,
  city_id,
  author_profile_id,
  slug,
  type,
  title,
  description,
  price,
  is_negotiable,
  category_label,
  contact_name,
  contact_phone,
  contact_whatsapp,
  cover_url,
  og_image_url,
  og_square_image_url,
  photos,
  status,
  review_status,
  payment_status,
  payment_amount_cents,
  rejection_reason,
  expires_at,
  featured_until,
  flagged_count,
  created_at,
  classified_vehicles(marca, modelo, ano_modelo, ano_fabricacao, km, combustivel, cambio, cor, placa_final),
  classified_jobs(tipo, faixa_salarial, modalidade, beneficios, requisitos),
  classified_services(area_atuacao, atende_em_casa, raio_atendimento_km, faixa_preco),
  classified_items(condicao, marca, aceita_troca, motivo_venda, is_free_item)
`;

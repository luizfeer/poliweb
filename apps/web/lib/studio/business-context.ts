import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { getBusinessMenu } from '@/lib/businesses/menu-queries';
import type { BusinessContext, RamoId, StudioProduct, StudioReview } from './types';

// art_pieces/businesses lidos com cast permissivo onde o tipo gerado não cobre
// (ex.: payment_methods/amenities chegam como unknown).
type BusinessRow = {
  id: string;
  name: string;
  slug: string | null;
  instagram: string | null;
  description: string | null;
  short_description: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  hours: unknown;
  amenities: unknown;
  payment_methods: unknown;
  cover_url: string | null;
  logo_url: string | null;
  photos: unknown;
  districts?: { name: string | null } | null;
  business_category_assignments?: Array<{
    is_primary: boolean | null;
    business_categories: { slug: string | null; name: string | null } | null;
  }> | null;
};

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABEL: Record<(typeof DAY_ORDER)[number], string> = {
  mon: 'Seg',
  tue: 'Ter',
  wed: 'Qua',
  thu: 'Qui',
  fri: 'Sex',
  sat: 'Sáb',
  sun: 'Dom',
};

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  credito: 'Crédito',
  debito: 'Débito',
  aproximacao: 'Aproximação',
  vale_refeicao: 'Vale-refeição',
  vale_alimentacao: 'Vale-alimentação',
};

const AMENITY_LABEL: Record<string, string> = {
  estacionamento: 'Estacionamento',
  wifi: 'Wi-Fi',
  aceita_pet: 'Aceita pet',
  pet_friendly: 'Pet friendly',
  delivery: 'Delivery',
  retira_no_local: 'Retira no local',
  retirada: 'Retirada',
  consumo_local: 'Consumo no local',
  area_externa: 'Área externa',
  banheiro: 'Banheiro',
  criancas: 'Espaço kids',
  grupos: 'Grupos',
  reservas: 'Aceita reserva',
  reserva: 'Aceita reserva',
  musica_ao_vivo: 'Música ao vivo',
  acessivel: 'Acessível',
  ar_condicionado: 'Ar-condicionado',
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function hourRange(value: unknown): { open: string; close: string } | null {
  if (!value || typeof value !== 'object') return null;
  const open = (value as { open?: unknown }).open;
  const close = (value as { close?: unknown }).close;
  return typeof open === 'string' && typeof close === 'string' ? { open, close } : null;
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':');
  return m && m !== '00' ? `${h}h${m}` : `${h}h`;
}

/** Converte o objeto `hours` em linhas agrupadas (Seg a sex · 08h às 18h). */
function formatHours(hours: unknown): { day: string; hours: string }[] {
  if (!hours || typeof hours !== 'object') return [];
  const perDay = DAY_ORDER.map((day) => {
    const ranges = (hours as Record<string, unknown>)[day];
    if (!Array.isArray(ranges) || ranges.length === 0) return { day, label: 'Fechado' };
    const parts = ranges
      .map(hourRange)
      .filter((r): r is { open: string; close: string } => r !== null)
      .map((r) => `${fmtTime(r.open)} às ${fmtTime(r.close)}`);
    return { day, label: parts.length ? parts.join(' e ') : 'Fechado' };
  });

  const rows: { day: string; hours: string }[] = [];
  let i = 0;
  while (i < perDay.length) {
    let j = i;
    while (j + 1 < perDay.length && perDay[j + 1].label === perDay[i].label) j += 1;
    const from = DAY_LABEL[perDay[i].day];
    const to = DAY_LABEL[perDay[j].day];
    rows.push({ day: i === j ? from : `${from} a ${to}`, hours: perDay[i].label });
    i = j + 1;
  }
  return rows;
}

function slugHandle(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `@${slug || 'meunegocio'}`;
}

function normalizeHandle(instagram: string | null, name: string): { handle: string; instagram: string | null } {
  if (instagram && instagram.trim()) {
    const raw = instagram.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/+$/, '');
    const at = raw.startsWith('@') ? raw : `@${raw}`;
    return { handle: at, instagram: at };
  }
  return { handle: slugHandle(name), instagram: null };
}

function inferRamo(slug: string | null, label: string | null): RamoId {
  const hay = `${slug ?? ''} ${label ?? ''}`.toLowerCase();
  if (/(pousada|hotel|hosped|chal[eé]|camping|rancho|temporada)/.test(hay)) return 'pousada';
  if (/(restaurante|aliment|bar|lanch|pizz|comida|caf[eé]|padaria|sorvet|a[çc]a[ií]|gastr|food)/.test(hay)) return 'restaurante';
  if (/(servi[çc]o|sal[ãa]o|beleza|est[eé]tica|barbe|oficina|sa[uú]de|cl[ií]nica|advog|cont[aá]bil|manuten|conserto)/.test(hay)) return 'servicos';
  return 'loja';
}

function fmtBRL(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: value % 1 === 0 ? 0 : 2 }).format(value);
}

export async function gatherBusinessContext(
  cityId: string,
  citySlug: string,
  cityName: string,
  businessId: string,
): Promise<BusinessContext> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('businesses')
    .select(
      `id, name, slug, instagram, description, short_description, address, phone, whatsapp, hours, amenities, payment_methods, cover_url, logo_url, photos, districts(name), business_category_assignments(is_primary, business_categories(slug, name))`,
    )
    .eq('id', businessId)
    .eq('city_id', cityId)
    .maybeSingle();

  const row = (data ?? null) as BusinessRow | null;
  const name = row?.name ?? 'Meu negócio';

  const assignments = row?.business_category_assignments ?? [];
  const primary = assignments.find((a) => a.is_primary) ?? assignments[0];
  const category = primary?.business_categories?.name ?? null;
  const ramo = inferRamo(primary?.business_categories?.slug ?? null, category);

  const { handle, instagram } = normalizeHandle(row?.instagram ?? null, name);
  const hoursText = formatHours(row?.hours);

  const payments = asStringArray(row?.payment_methods).map((p) => PAYMENT_LABEL[p] ?? p);
  const amenities = asStringArray(row?.amenities).map((a) => AMENITY_LABEL[a] ?? a);
  const photos = asStringArray(row?.photos);

  // Produtos do cardápio/catálogo (quando houver).
  let products: StudioProduct[] = [];
  try {
    const menu = await getBusinessMenu(businessId);
    if (menu) {
      products = menu.sections
        .flatMap((section) => section.items)
        .filter((item) => item.available)
        .slice(0, 8)
        .map((item) => ({
          id: item.id,
          name: item.name,
          price: item.promotionalPrice != null ? fmtBRL(item.promotionalPrice * 100) : item.price != null ? fmtBRL(item.price * 100) : undefined,
          meta: item.serves ?? (item.description ? item.description.slice(0, 40) : undefined),
          photoUrl: item.photoUrl ?? null,
        }));
    }
  } catch {
    products = [];
  }

  // Avaliações publicadas (com comentário).
  let reviews: StudioReview[] = [];
  const { data: reviewRows } = await supabase
    .from('business_reviews')
    .select('id, rating, comment, status, profiles(full_name)')
    .eq('business_id', businessId)
    .eq('status', 'published')
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(8);
  reviews = ((reviewRows ?? []) as Array<{ id: string; rating: number | null; comment: string | null; profiles: { full_name?: string | null } | null }>)
    .filter((r) => r.comment && r.comment.trim())
    .map((r) => ({
      id: r.id,
      author: r.profiles?.full_name ?? 'Cliente',
      rating: r.rating ?? 5,
      comment: (r.comment ?? '').trim(),
    }));

  return {
    businessId,
    name,
    ramo,
    hasInstagram: instagram != null,
    handle,
    instagram,
    cidade: cityName,
    district: row?.districts?.name ?? null,
    category,
    description: row?.description ?? row?.short_description ?? null,
    address: row?.address ?? null,
    hoursText,
    hoursNote: null,
    phone: row?.phone ?? null,
    whatsapp: row?.whatsapp ?? null,
    payments,
    amenities,
    coverUrl: row?.cover_url ?? null,
    logoUrl: row?.logo_url ?? null,
    photos,
    products,
    reviews,
    pixKey: null,
  };
}

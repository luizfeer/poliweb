'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { getPaymentGateway } from '@/lib/payments';
import { notifyCityAdmins } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { uploadLinkedImage } from '@/lib/media/actions';
import { calculateFee, dateAfterDays, paymentStatusForFee, validityDaysForType } from '@/lib/classifieds/pricing';
import { getClassifiedsConfig } from '@/lib/classifieds/queries';
import type { ClassifiedType } from '@/lib/classifieds/types';

const uuid = z.string().uuid();
const textOptional = z.string().trim().max(5000).optional().transform((value) => value || null);
const phone = z.string().trim().min(8).max(32);

const baseSchema = z.object({
  city_id: uuid,
  type: z.enum(['vehicle', 'job', 'service', 'item', 'other']),
  title: z.string().trim().min(3).max(140),
  description: textOptional,
  price: z.coerce.number().nonnegative().optional().transform((value) => value ?? null),
  is_negotiable: z.boolean(),
  category_label: z.string().trim().max(80).optional().transform((value) => value || null),
  contact_name: z.string().trim().max(120).optional().transform((value) => value || null),
  contact_phone: phone,
  contact_whatsapp: z.string().trim().max(32).optional().transform((value) => value || null),
  cover_url: z.string().url().optional().or(z.literal('')).transform((value) => value || null),
  safety_terms_accepted: z.literal(true),
});

const vehicleSchema = baseSchema.extend({
  type: z.literal('vehicle'),
  marca: z.string().trim().min(1).max(80),
  modelo: z.string().trim().min(1).max(80),
  ano_modelo: z.coerce.number().int().min(1950).max(2100).optional(),
  ano_fabricacao: z.coerce.number().int().min(1950).max(2100).optional(),
  km: z.coerce.number().int().nonnegative().optional(),
  combustivel: z.string().trim().max(40).optional().transform((value) => value || null),
  cambio: z.string().trim().max(40).optional().transform((value) => value || null),
  cor: z.string().trim().max(40).optional().transform((value) => value || null),
  placa_final: z.string().trim().regex(/^[0-9]$/).optional().or(z.literal('')).transform((value) => value || null),
});

const jobSchema = baseSchema.extend({
  type: z.literal('job'),
  tipo: z.enum(['clt', 'pj', 'temporario']),
  faixa_salarial: z.string().trim().max(80).optional().transform((value) => value || null),
  modalidade: z.enum(['presencial', 'remoto', 'hibrido']),
  beneficios: z.string().trim().max(500).optional().transform((value) => value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []),
  requisitos: z.string().trim().max(2000).optional().transform((value) => value || null),
});

const serviceSchema = baseSchema.extend({
  type: z.literal('service'),
  area_atuacao: z.string().trim().min(2).max(120),
  atende_em_casa: z.boolean(),
  raio_atendimento_km: z.coerce.number().int().nonnegative().optional().transform((value) => value ?? null),
  faixa_preco: z.string().trim().max(80).optional().transform((value) => value || null),
});

const itemSchema = baseSchema.extend({
  type: z.literal('item'),
  condicao: z.enum(['novo', 'seminovo', 'usado']),
  marca: z.string().trim().max(80).optional().transform((value) => value || null),
  aceita_troca: z.boolean(),
  motivo_venda: z.string().trim().max(300).optional().transform((value) => value || null),
  is_free_item: z.boolean(),
});

const otherSchema = baseSchema.extend({
  type: z.literal('other'),
});

const classifiedSchema = z.discriminatedUnion('type', [
  vehicleSchema,
  jobSchema,
  serviceSchema,
  itemSchema,
  otherSchema,
]);

const idSchema = z.object({
  id: uuid,
});

type ActionSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ClassifiedSubmissionRow = {
  id: string;
  title: string;
  payment_amount_cents: number | null;
  payment_status: string | null;
  payment_provider_ref: string | null;
  status: string | null;
};

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function optional(formData: FormData, key: string): string | undefined {
  const value = text(formData, key);
  return value || undefined;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

function parseForm(formData: FormData) {
  return classifiedSchema.parse({
    city_id: formData.get('city_id'),
    type: formData.get('type'),
    title: formData.get('title'),
    description: optional(formData, 'description'),
    price: optional(formData, 'price'),
    is_negotiable: formData.get('is_negotiable') === 'on',
    category_label: optional(formData, 'category_label'),
    contact_name: optional(formData, 'contact_name'),
    contact_phone: formData.get('contact_phone'),
    contact_whatsapp: optional(formData, 'contact_whatsapp'),
    cover_url: optional(formData, 'cover_url'),
    safety_terms_accepted: formData.get('safety_terms_accepted') === 'on',
    marca: formData.get('type') === 'item' ? optional(formData, 'item_marca') : optional(formData, 'marca'),
    modelo: optional(formData, 'modelo'),
    ano_modelo: optional(formData, 'ano_modelo'),
    ano_fabricacao: optional(formData, 'ano_fabricacao'),
    km: optional(formData, 'km'),
    combustivel: optional(formData, 'combustivel'),
    cambio: optional(formData, 'cambio'),
    cor: optional(formData, 'cor'),
    placa_final: optional(formData, 'placa_final'),
    tipo: formData.get('tipo') || 'clt',
    faixa_salarial: optional(formData, 'faixa_salarial'),
    modalidade: formData.get('modalidade') || 'presencial',
    beneficios: optional(formData, 'beneficios'),
    requisitos: optional(formData, 'requisitos'),
    area_atuacao: optional(formData, 'area_atuacao'),
    atende_em_casa: formData.get('atende_em_casa') === 'on',
    raio_atendimento_km: optional(formData, 'raio_atendimento_km'),
    faixa_preco: optional(formData, 'faixa_preco'),
    condicao: formData.get('condicao') || 'usado',
    aceita_troca: formData.get('aceita_troca') === 'on',
    motivo_venda: optional(formData, 'motivo_venda'),
    is_free_item: formData.get('is_free_item') === 'on',
  });
}

export async function createClassifiedDraftAction(formData: FormData) {
  const auth = await requireProfile();
  const parsed = parseForm(formData);
  const city = await getCurrentCity();
  if (!city || city.id !== parsed.city_id) throw new Error('Cidade inválida.');

  const amountCents = parsed.type === 'item' && parsed.is_free_item
    ? 0
    : calculateFee(parsed.type, await getClassifiedsConfig(city.id));
  const slug = `${slugify(parsed.title)}-${crypto.randomUUID().slice(0, 8)}`;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('classifieds')
    .insert({
      city_id: city.id,
      author_profile_id: auth.profile.id,
      slug,
      type: parsed.type,
      title: parsed.title,
      description: parsed.description,
      price: parsed.price,
      is_negotiable: parsed.is_negotiable,
      category_label: parsed.category_label,
      contact_name: parsed.contact_name,
      contact_phone: parsed.contact_phone,
      contact_whatsapp: parsed.contact_whatsapp,
      cover_url: parsed.cover_url,
      status: 'draft',
      review_status: 'pending',
      payment_status: paymentStatusForFee(amountCents),
      payment_amount_cents: amountCents,
      expires_at: dateAfterDays(validityDaysForType(parsed.type)),
    })
    .select('id')
    .single();
  if (error || !data) throw error;

  const coverFile = formData.get('cover_file');
  const galleryFiles = formData.getAll('gallery_files');
  let hasCover = false;
  if (coverFile instanceof File && coverFile.size > 0) {
    await uploadLinkedImage({
      entityType: 'classified',
      entityId: data.id,
      role: 'cover',
      file: coverFile,
      altText: parsed.title,
      actorProfileId: auth.profile.id,
    });
    hasCover = true;
  }

  for (const file of galleryFiles) {
    if (!(file instanceof File) || file.size === 0) continue;
    if (!hasCover && file.type.startsWith('image/')) {
      await uploadLinkedImage({
        entityType: 'classified',
        entityId: data.id,
        role: 'cover',
        file,
        altText: parsed.title,
        actorProfileId: auth.profile.id,
      });
      hasCover = true;
    }
    await uploadLinkedImage({
      entityType: 'classified',
      entityId: data.id,
      role: 'gallery',
      file,
      altText: parsed.title,
      actorProfileId: auth.profile.id,
    });
  }

  await upsertDetails(data.id, parsed);
  await writeAudit('classified.create_draft', city.id, auth.profile.id, data.id, { type: parsed.type });
  const checkoutUrl = await submitExistingClassifiedForReview({
    classified: {
      id: data.id,
      title: parsed.title,
      payment_amount_cents: amountCents,
      payment_status: paymentStatusForFee(amountCents),
      payment_provider_ref: null,
      status: 'draft',
    },
    cityId: city.id,
    profileId: auth.profile.id,
    supabase,
  });
  revalidateClassifiedPaths();
  if (checkoutUrl) redirect(checkoutUrl);
  redirect('/painel/cidadao/classificados');
}

export async function submitForReviewAction(formData: FormData) {
  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city) return;
  const { id } = idSchema.parse({ id: formData.get('id') });
  const supabase = await createClient();
  const { data: classified, error } = await supabase
    .from('classifieds')
    .select('id, title, payment_amount_cents, payment_status, payment_provider_ref, status')
    .eq('city_id', city.id)
    .eq('author_profile_id', auth.profile.id)
    .eq('id', id)
    .maybeSingle();
  if (error || !classified) throw error ?? new Error('Classificado não encontrado.');

  const checkoutUrl = await submitExistingClassifiedForReview({
    classified,
    cityId: city.id,
    profileId: auth.profile.id,
    supabase,
  });
  revalidateClassifiedPaths();
  if (checkoutUrl) redirect(checkoutUrl);
}

async function submitExistingClassifiedForReview({
  classified,
  cityId,
  profileId,
  supabase,
}: {
  classified: ClassifiedSubmissionRow;
  cityId: string;
  profileId: string;
  supabase: ActionSupabaseClient;
}): Promise<string | null> {
  const shouldNotify = classified.status !== 'pending';
  const amountCents = classified.payment_amount_cents ?? 0;

  if (amountCents > 0 && classified.payment_status === 'pending') {
    if (classified.payment_provider_ref) {
      return null;
    }

    const gateway = getPaymentGateway();
    const session = await gateway.createCheckoutSession({
      cityId,
      entityType: 'classified',
      entityId: classified.id,
      amountCents,
      description: `Classificado: ${classified.title}`,
      successUrl: '/painel/cidadao/classificados',
      cancelUrl: '/painel/cidadao/classificados',
    });
    const { error } = await supabase
      .from('classifieds')
      .update({
        payment_provider_ref: session.providerReference,
        payment_status: session.status === 'paid' ? 'paid' : 'pending',
        status: 'pending',
        review_status: 'pending',
      })
      .eq('city_id', cityId)
      .eq('author_profile_id', profileId)
      .eq('id', classified.id);
    if (error) throw error;

    await writeReviewSubmissionSideEffects({
      classified,
      cityId,
      profileId,
      shouldNotify,
    });
    return session.checkoutUrl;
  }

  const { error } = await supabase
    .from('classifieds')
    .update({ status: 'pending', review_status: 'pending' })
    .eq('city_id', cityId)
    .eq('author_profile_id', profileId)
    .eq('id', classified.id);
  if (error) throw error;

  await writeReviewSubmissionSideEffects({
    classified,
    cityId,
    profileId,
    shouldNotify,
  });
  return null;
}

async function writeReviewSubmissionSideEffects({
  classified,
  cityId,
  profileId,
  shouldNotify,
}: {
  classified: Pick<ClassifiedSubmissionRow, 'id' | 'title'>;
  cityId: string;
  profileId: string;
  shouldNotify: boolean;
}) {
  await writeAudit('classified.submit_review', cityId, profileId, classified.id, {});
  if (!shouldNotify) return;

  await notifyCityAdmins({
    cityId,
    type: 'approval.pending',
    priority: 'normal',
    title: 'Classificado aguardando aprovação',
    body: classified.title,
    targetUrl: '/painel/cidade/classificados/aprovacao',
    entityType: 'classified',
    entityId: classified.id,
    metadata: { author_profile_id: profileId },
  });
}

export async function markAsSoldAction(formData: FormData) {
  await updateOwnStatus(formData, 'archived', 'classified.mark_sold', { sold_at: new Date().toISOString() });
}

export async function requestRenewalAction(formData: FormData) {
  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city) return;
  const { id } = idSchema.parse({ id: formData.get('id') });
  const supabase = await createClient();
  const { data: classified, error } = await supabase
    .from('classifieds')
    .select('id, type')
    .eq('city_id', city.id)
    .eq('author_profile_id', auth.profile.id)
    .eq('id', id)
    .maybeSingle();
  if (error || !classified) throw error ?? new Error('Classificado não encontrado.');

  const amountCents = calculateFee(classified.type as ClassifiedType, await getClassifiedsConfig(city.id));
  await supabase
    .from('classifieds')
    .update({
      status: 'draft',
      review_status: 'pending',
      payment_status: paymentStatusForFee(amountCents),
      payment_amount_cents: amountCents,
      expires_at: dateAfterDays(validityDaysForType(classified.type as ClassifiedType)),
    })
    .eq('id', id);
  await writeAudit('classified.renewal_requested', city.id, auth.profile.id, id, { amount_cents: amountCents });
  revalidateClassifiedPaths();
}

async function updateOwnStatus(
  formData: FormData,
  status: 'archived',
  action: string,
  extra: Record<string, string>,
) {
  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city) return;
  const { id } = idSchema.parse({ id: formData.get('id') });
  const supabase = await createClient();
  await supabase
    .from('classifieds')
    .update({ status, ...extra })
    .eq('city_id', city.id)
    .eq('author_profile_id', auth.profile.id)
    .eq('id', id);
  await writeAudit(action, city.id, auth.profile.id, id, {});
  revalidateClassifiedPaths();
}

async function upsertDetails(classifiedId: string, parsed: z.infer<typeof classifiedSchema>) {
  const supabase = await createClient();
  if (parsed.type === 'vehicle') {
    await supabase.from('classified_vehicles').upsert({
      classified_id: classifiedId,
      marca: parsed.marca,
      modelo: parsed.modelo,
      ano_modelo: parsed.ano_modelo ?? null,
      ano_fabricacao: parsed.ano_fabricacao ?? null,
      km: parsed.km ?? null,
      combustivel: parsed.combustivel,
      cambio: parsed.cambio,
      cor: parsed.cor,
      placa_final: parsed.placa_final,
    });
  }
  if (parsed.type === 'job') {
    await supabase.from('classified_jobs').upsert({
      classified_id: classifiedId,
      tipo: parsed.tipo,
      faixa_salarial: parsed.faixa_salarial,
      modalidade: parsed.modalidade,
      beneficios: parsed.beneficios as Json,
      requisitos: parsed.requisitos,
    });
  }
  if (parsed.type === 'service') {
    await supabase.from('classified_services').upsert({
      classified_id: classifiedId,
      area_atuacao: parsed.area_atuacao,
      atende_em_casa: parsed.atende_em_casa,
      raio_atendimento_km: parsed.raio_atendimento_km,
      faixa_preco: parsed.faixa_preco,
    });
  }
  if (parsed.type === 'item') {
    await supabase.from('classified_items').upsert({
      classified_id: classifiedId,
      condicao: parsed.condicao,
      marca: parsed.marca,
      aceita_troca: parsed.aceita_troca,
      motivo_venda: parsed.motivo_venda,
      is_free_item: parsed.is_free_item,
    });
  }
}

async function writeAudit(action: string, cityId: string, actorId: string, entityId: string, diff: Record<string, Json>) {
  const supabase = await createClient();
  await supabase.from('audit_log').insert({
    actor_id: actorId,
    city_id: cityId,
    action,
    entity_type: 'classified',
    entity_id: entityId,
    diff,
  });
}

function revalidateClassifiedPaths() {
  revalidatePath('/classificados');
  revalidatePath('/comunidade/classificados');
  revalidatePath('/painel/cidadao/classificados');
  revalidatePath('/painel/cidade/classificados');
}

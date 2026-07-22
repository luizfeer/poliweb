'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireProfile, requireRole } from '@/lib/auth';
import type { ProfileRole } from '@/lib/auth/types';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { uploadLinkedImage } from '@/lib/media/actions';
import { notifyPendingCommunityReview } from './notifications';
import type { ModerationEntityType } from './types';

export type CommunityGroupFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const uuid = z.string().uuid();
const nullableText = z.string().trim().max(5000).optional().transform((value) => value || null);
const phone = z.string().trim().min(8).max(32);

const eventSchema = z.object({
  city_id: uuid,
  title: z.string().trim().min(3).max(140),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).optional(),
  description: nullableText,
  start_at: z.string().min(1),
  end_at: z.string().optional().transform((value) => value || null),
  location: z.string().trim().max(200).optional().transform((value) => value || null),
  address: z.string().trim().max(300).optional().transform((value) => value || null),
  category_id: z.string().uuid().optional().transform((value) => value || null),
  organizer_name: z.string().trim().max(120).optional().transform((value) => value || null),
  is_free: z.boolean(),
  ticket_url: z.string().url().optional().or(z.literal('')).transform((value) => value || null),
  cover_url: z.string().url().optional().or(z.literal('')).transform((value) => value || null),
}).refine((data) => !data.end_at || new Date(data.end_at) > new Date(data.start_at), {
  message: 'A data de fim deve ser posterior ao inicio.',
  path: ['end_at'],
});

const classifiedSchema = z.object({
  city_id: uuid,
  type: z.enum(['vehicle', 'job', 'service', 'item', 'other']),
  title: z.string().trim().min(3).max(140),
  description: nullableText,
  price: z.coerce.number().nonnegative().optional().transform((value) => value ?? null),
  is_negotiable: z.boolean(),
  category_label: z.string().trim().max(80).optional().transform((value) => value || null),
  contact_name: z.string().trim().max(120).optional().transform((value) => value || null),
  contact_phone: phone,
  contact_whatsapp: z.string().trim().max(32).optional().transform((value) => value || null),
  cover_url: z.string().url().optional().or(z.literal('')).transform((value) => value || null),
});

const petSchema = z.object({
  city_id: uuid,
  status: z.enum(['lost', 'found']),
  pet_name: z.string().trim().max(120).optional().transform((value) => value || null),
  species: z.string().trim().min(2).max(60),
  breed: z.string().trim().max(80).optional().transform((value) => value || null),
  color: z.string().trim().max(80).optional().transform((value) => value || null),
  size: z.string().trim().max(40).optional().transform((value) => value || null),
  description: z.string().trim().min(10).max(2000),
  last_seen_at: z.string().optional().transform((value) => value || null),
  last_seen_location: z.string().trim().max(200).optional().transform((value) => value || null),
  contact_name: z.string().trim().min(2).max(120),
  contact_phone: phone,
  contact_whatsapp: z.string().trim().max(32).optional().transform((value) => value || null),
  cover_url: z.string().url().optional().or(z.literal('')).transform((value) => value || null),
});

const lostAndFoundSchema = z.object({
  city_id: uuid,
  type: z.enum(['lost', 'found']),
  item_description: z.string().trim().min(5).max(220),
  category: z.string().trim().max(80).optional().transform((value) => value || null),
  location: z.string().trim().max(200).optional().transform((value) => value || null),
  occurred_at: z.string().optional().transform((value) => value || null),
  contact_phone: phone,
  contact_whatsapp: z.string().trim().max(32).optional().transform((value) => value || null),
  cover_url: z.string().url().optional().or(z.literal('')).transform((value) => value || null),
});

const communityGroupSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: uuid,
  name: z.string().trim().min(3).max(140),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).optional(),
  type: z.enum(['collective', 'association', 'project', 'whatsapp_group']),
  category: z.string().trim().min(2).max(80),
  short_description: z.string().trim().max(180).optional().transform((value) => value || null),
  description: nullableText,
  contact_name: z.string().trim().max(120).optional().transform((value) => value || null),
  contact_phone: z.string().trim().max(32).optional().transform((value) => value || null),
  contact_whatsapp: z.string().trim().max(32).optional().transform((value) => value || null),
  contact_email: z.string().email().optional().or(z.literal('')).transform((value) => value || null),
  instagram_url: z.string().url().optional().or(z.literal('')).transform((value) => value || null),
  website_url: z.string().url().optional().or(z.literal('')).transform((value) => value || null),
  whatsapp_invite_url: z.string().url().optional().or(z.literal('')).transform((value) => value || null),
  neighborhood: z.string().trim().max(120).optional().transform((value) => value || null),
  participation_instructions: z.string().trim().max(1200).optional().transform((value) => value || null),
  group_rules: z.string().trim().max(1200).optional().transform((value) => value || null),
  member_estimate: z.coerce.number().int().nonnegative().optional().transform((value) => value ?? null),
  is_official: z.boolean().default(false),
  requires_approval: z.boolean().default(false),
  last_verified_at: z.string().optional().transform((value) => value || null),
}).refine((data) => data.type !== 'whatsapp_group' || Boolean(data.whatsapp_invite_url), {
  message: 'Informe o link do grupo de WhatsApp.',
  path: ['whatsapp_invite_url'],
});

const communityGroupPostSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: uuid,
  group_id: uuid,
  title: z.string().trim().min(3).max(140),
  body: z.string().trim().max(2000).optional().transform((value) => value || null),
  post_type: z.enum(['notice', 'request', 'donation', 'opportunity', 'announcement', 'lost_found']),
  contact_phone: z.string().trim().max(32).optional().transform((value) => value || null),
  contact_whatsapp: z.string().trim().max(32).optional().transform((value) => value || null),
  contact_email: z.string().email().optional().or(z.literal('')).transform((value) => value || null),
  external_url: z.string().url().optional().or(z.literal('')).transform((value) => value || null),
  starts_at: z.string().optional().transform((value) => value || null),
  ends_at: z.string().optional().transform((value) => value || null),
}).refine((data) => !data.ends_at || !data.starts_at || new Date(data.ends_at) >= new Date(data.starts_at), {
  message: 'A data final precisa ser posterior a inicial.',
  path: ['ends_at'],
});

const reportSchema = z.object({
  city_id: uuid,
  entity_type: z.enum(['event', 'classified', 'lost_pet', 'lost_and_found', 'community_group', 'community_group_post']),
  entity_id: uuid,
  reason: z.enum(['spam', 'inadequate', 'fake', 'match', 'other']),
  notes: z.string().trim().max(1000).optional().transform((value) => value || null),
});

const moderationSchema = z.object({
  entity_type: z.enum(['event', 'classified', 'lost_pet', 'lost_and_found', 'community_group', 'community_group_post']),
  entity_id: uuid,
  reason: z.string().trim().max(1000).optional().transform((value) => value || null),
});

const followCommunityGroupSchema = z.object({
  city_id: uuid,
  group_id: uuid,
  group_slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
});

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(120),
  icon: z.string().trim().max(80).optional().transform((value) => value || null),
  display_order: z.coerce.number().int().default(0),
});

const obituarySchema = z.object({
  id: z.string().uuid().optional(),
  city_id: uuid,
  full_name: z.string().trim().min(3).max(160),
  age: z.coerce.number().int().positive().optional().transform((value) => value ?? null),
  photo_url: z.string().url().optional().or(z.literal('')).transform((value) => value || null),
  death_date: z.string().min(1),
  wake_location: z.string().trim().max(200).optional().transform((value) => value || null),
  wake_at: z.string().optional().transform((value) => value || null),
  burial_at: z.string().optional().transform((value) => value || null),
  burial_location: z.string().trim().max(200).optional().transform((value) => value || null),
  mass_at: z.string().optional().transform((value) => value || null),
  mass_location: z.string().trim().max(200).optional().transform((value) => value || null),
  family_message: z.string().trim().max(1200).optional().transform((value) => value || null),
  funeral_home: z.string().trim().max(160).optional().transform((value) => value || null),
  status: z.enum(['draft', 'pending', 'published', 'rejected', 'archived']),
});

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
    .slice(0, 80);
}

async function assertCurrentCity(cityId: string) {
  const city = await getCurrentCity();
  if (!city || city.id !== cityId) throw new Error('Cidade invalida.');
  return city;
}

function isCityManager(
  roles: ProfileRole[],
  cityId: string,
): boolean {
  return roles.some((role) => (role.city_id === cityId || role.city_id === null) && ['moderator', 'city_admin', 'super_admin'].includes(role.role));
}

async function assertCanManageCommunityGroup(groupId: string, cityId: string, profileId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (supabase.from('community_groups' as any) as any)
    .select('id')
    .eq('id', groupId)
    .eq('city_id', cityId)
    .eq('owner_profile_id', profileId)
    .maybeSingle();
  if (group) return;

  const { data: manages } = await supabase.rpc('manages_entity', {
    p_entity_type: 'community_group',
    p_entity_id: groupId,
  });
  if (manages) return;

  await requireRole({ cityId, kinds: ['moderator', 'city_admin', 'super_admin'] });
}

async function insertAudit(action: string, cityId: string, entityType: string, entityId: string | null, diff: Json) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('audit_log').insert({
    actor_id: user.id,
    city_id: cityId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    diff,
  });
}

async function enqueueModeration(cityId: string, entityType: ModerationEntityType, entityId: string) {
  const supabase = await createClient();
  await supabase.from('ai_jobs').insert({
    city_id: cityId,
    job_type: 'moderate_ugc',
    status: 'queued',
    model: 'claude-haiku-4-5-20251001',
    input_ref: { entity_type: entityType, entity_id: entityId },
  });
  await supabase.functions.invoke('moderate-ugc', {
    body: { entity_type: entityType, entity_id: entityId },
  });
}

export async function submitEventAction(formData: FormData) {
  const auth = await requireProfile();
  const parsed = eventSchema.parse({
    city_id: formData.get('city_id'),
    title: formData.get('title'),
    slug: optional(formData, 'slug') ?? slugify(text(formData, 'title')),
    description: optional(formData, 'description'),
    start_at: formData.get('start_at'),
    end_at: optional(formData, 'end_at'),
    location: optional(formData, 'location'),
    address: optional(formData, 'address'),
    category_id: optional(formData, 'category_id'),
    organizer_name: optional(formData, 'organizer_name'),
    is_free: formData.get('is_free') !== 'off',
    ticket_url: optional(formData, 'ticket_url'),
    cover_url: optional(formData, 'cover_url'),
  });
  await assertCurrentCity(parsed.city_id);

  const supabase = await createClient();
  const eventPayload = {
    ...parsed,
    slug: parsed.slug ?? slugify(parsed.title),
    organizer_profile_id: auth.profile.id,
    status: 'pending' as const,
  };
  const { data, error } = await supabase
    .from('events')
    .insert(eventPayload)
    .select('id')
    .single();
  if (error || !data) throw error;

  await uploadOptionalCover(formData, 'event', data.id, auth.profile.id, parsed.title);
  await enqueueModeration(parsed.city_id, 'event', data.id);
  revalidatePath('/comunidade');
  revalidatePath('/comunidade/agenda');
  redirect('/painel/comunidade');
}

export async function submitClassifiedAction(formData: FormData) {
  const auth = await requireProfile();
  const parsed = classifiedSchema.parse({
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
  });
  await assertCurrentCity(parsed.city_id);

  const supabase = await createClient();
  const slug = `${slugify(parsed.title)}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase
    .from('classifieds')
    .insert({
      ...parsed,
      slug,
      author_profile_id: auth.profile.id,
      status: 'pending',
      review_status: 'pending',
      payment_status: 'not_required',
      payment_amount_cents: 0,
    })
    .select('id')
    .single();
  if (error || !data) throw error;

  await uploadOptionalCover(formData, 'classified', data.id, auth.profile.id, parsed.title);
  await enqueueModeration(parsed.city_id, 'classified', data.id);
  revalidatePath('/comunidade/classificados');
  redirect('/painel/comunidade');
}

export async function submitLostPetAction(formData: FormData) {
  const auth = await requireProfile();
  const parsed = petSchema.parse({
    city_id: formData.get('city_id'),
    status: formData.get('status'),
    pet_name: optional(formData, 'pet_name'),
    species: formData.get('species'),
    breed: optional(formData, 'breed'),
    color: optional(formData, 'color'),
    size: optional(formData, 'size'),
    description: formData.get('description'),
    last_seen_at: optional(formData, 'last_seen_at'),
    last_seen_location: optional(formData, 'last_seen_location'),
    contact_name: formData.get('contact_name'),
    contact_phone: formData.get('contact_phone'),
    contact_whatsapp: optional(formData, 'contact_whatsapp'),
    cover_url: optional(formData, 'cover_url'),
  });
  await assertCurrentCity(parsed.city_id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lost_pets')
    .insert({ ...parsed, author_profile_id: auth.profile.id, moderation_status: 'pending' })
    .select('id')
    .single();
  if (error || !data) throw error;

  await uploadOptionalCover(formData, 'lost_pet', data.id, auth.profile.id, parsed.pet_name ?? parsed.species);
  await enqueueModeration(parsed.city_id, 'lost_pet', data.id);
  revalidatePath('/comunidade/pets');
  redirect('/painel/comunidade');
}

export async function updatePetStatusAction(formData: FormData) {
  await requireProfile();
  const id = uuid.parse(formData.get('id'));
  const city = await getCurrentCity();
  if (!city) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('lost_pets')
    .update({ status: 'reunited' })
    .eq('id', id)
    .eq('city_id', city.id);
  if (error) throw error;
  revalidatePath('/comunidade/pets');
  revalidatePath('/painel/comunidade');
}

export async function submitLostAndFoundAction(formData: FormData) {
  const auth = await requireProfile();
  const parsed = lostAndFoundSchema.parse({
    city_id: formData.get('city_id'),
    type: formData.get('type'),
    item_description: formData.get('item_description'),
    category: optional(formData, 'category'),
    location: optional(formData, 'location'),
    occurred_at: optional(formData, 'occurred_at'),
    contact_phone: formData.get('contact_phone'),
    contact_whatsapp: optional(formData, 'contact_whatsapp'),
    cover_url: optional(formData, 'cover_url'),
  });
  await assertCurrentCity(parsed.city_id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lost_and_found')
    .insert({ ...parsed, author_profile_id: auth.profile.id, moderation_status: 'pending' })
    .select('id')
    .single();
  if (error || !data) throw error;

  await uploadOptionalCover(formData, 'lost_and_found', data.id, auth.profile.id, parsed.item_description);
  await enqueueModeration(parsed.city_id, 'lost_and_found', data.id);
  revalidatePath('/comunidade/achados');
  redirect('/painel/comunidade');
}

export async function resolveLostAndFoundAction(formData: FormData) {
  await requireProfile();
  const id = uuid.parse(formData.get('id'));
  const city = await getCurrentCity();
  if (!city) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('lost_and_found')
    .update({ status: 'resolved' })
    .eq('id', id)
    .eq('city_id', city.id);
  if (error) throw error;
  revalidatePath('/comunidade/achados');
  revalidatePath('/painel/comunidade');
}

export async function upsertCommunityGroupAction(formData: FormData) {
  await upsertCommunityGroup(formData);
}

export async function upsertCommunityGroupFormAction(
  _prevState: CommunityGroupFormState,
  formData: FormData,
): Promise<CommunityGroupFormState> {
  try {
    await upsertCommunityGroup(formData);
    return {};
  } catch (error) {
    if (isNextRedirect(error)) throw error;

    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.issues) {
        const key = String(issue.path[0] ?? 'form');
        fieldErrors[key] ??= issue.message;
      }
      return {
        error: 'Revise os campos destacados e tente novamente.',
        fieldErrors,
      };
    }

    return {
      error: error instanceof Error ? error.message : 'Nao foi possivel salvar o grupo agora.',
    };
  }
}

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

async function upsertCommunityGroup(formData: FormData) {
  const auth = await requireProfile();
  const city = await assertCurrentCity(String(formData.get('city_id') ?? ''));
  const parsed = communityGroupSchema.parse({
    id: optional(formData, 'id'),
    city_id: formData.get('city_id'),
    name: formData.get('name'),
    slug: optional(formData, 'slug') ?? slugify(text(formData, 'name')),
    type: formData.get('type'),
    category: formData.get('category'),
    short_description: optional(formData, 'short_description'),
    description: optional(formData, 'description'),
    contact_name: optional(formData, 'contact_name'),
    contact_phone: optional(formData, 'contact_phone'),
    contact_whatsapp: optional(formData, 'contact_whatsapp'),
    contact_email: optional(formData, 'contact_email'),
    instagram_url: optional(formData, 'instagram_url'),
    website_url: optional(formData, 'website_url'),
    whatsapp_invite_url: optional(formData, 'whatsapp_invite_url'),
    neighborhood: optional(formData, 'neighborhood'),
    participation_instructions: optional(formData, 'participation_instructions'),
    group_rules: optional(formData, 'group_rules'),
    member_estimate: optional(formData, 'member_estimate'),
    is_official: formData.get('is_official') === 'on',
    requires_approval: formData.get('requires_approval') === 'on',
    last_verified_at: optional(formData, 'last_verified_at'),
  });

  const supabase = await createClient();
  const canPublishDirectly = isCityManager(auth.roles, parsed.city_id);

  if (parsed.id) {
    await assertCanManageCommunityGroup(parsed.id, parsed.city_id, auth.profile.id);
  }

  const currentGroup = parsed.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase.from('community_groups' as any) as any)
      .select('id, status, owner_profile_id')
      .eq('id', parsed.id)
      .eq('city_id', parsed.city_id)
      .maybeSingle()
    : { data: null };

  const status = parsed.id
    ? canPublishDirectly
      ? formData.get('status') || currentGroup.data?.status || 'published'
      : 'pending'
    : canPublishDirectly
      ? 'published'
      : 'pending';

  const payload = {
    city_id: parsed.city_id,
    owner_profile_id: currentGroup.data?.owner_profile_id ?? auth.profile.id,
    slug: parsed.slug ?? slugify(parsed.name),
    name: parsed.name,
    type: parsed.type,
    category: parsed.category,
    short_description: parsed.short_description,
    description: parsed.description,
    contact_name: parsed.contact_name,
    contact_phone: parsed.contact_phone,
    contact_whatsapp: parsed.contact_whatsapp,
    contact_email: parsed.contact_email,
    instagram_url: parsed.instagram_url,
    website_url: parsed.website_url,
    whatsapp_invite_url: parsed.whatsapp_invite_url,
    neighborhood: parsed.neighborhood,
    participation_instructions: parsed.participation_instructions,
    group_rules: parsed.group_rules,
    member_estimate: parsed.member_estimate,
    is_official: parsed.is_official,
    requires_approval: parsed.requires_approval,
    last_verified_at: parsed.last_verified_at,
    status,
  };

  const { data, error } = parsed.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase.from('community_groups' as any) as any)
      .update(payload)
      .eq('id', parsed.id)
      .eq('city_id', parsed.city_id)
      .select('id')
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : await (supabase.from('community_groups' as any) as any)
      .insert(payload)
      .select('id')
      .single();
  if (error || !data) throw error;

  await uploadOptionalCover(formData, 'community_group', data.id, auth.profile.id, parsed.name);
  await uploadOptionalThumb(formData, 'community_group', data.id, auth.profile.id, parsed.name);
  await insertAudit('community.group.upsert', parsed.city_id, 'community_group', data.id, payload as Json);

  if (status === 'pending') {
    await enqueueModeration(parsed.city_id, 'community_group', data.id);
    void notifyPendingCommunityReview({
      cityId: parsed.city_id,
      cityName: city.name,
      entityType: 'community_group',
      entityTitle: parsed.name,
      reviewPath: '/painel/cidade/comunidade',
    }).catch(() => {});
  }

  revalidateCommunity();
  revalidatePath('/comunidade/grupos');
  revalidatePath('/comunidade/grupos/whatsapp');
  redirect(`/painel/comunidade/grupos/${data.id}`);
}

export async function archiveCommunityGroupAction(formData: FormData) {
  const auth = await requireProfile();
  const groupId = uuid.parse(formData.get('id'));
  const city = await getCurrentCity();
  if (!city) return;

  await assertCanManageCommunityGroup(groupId, city.id, auth.profile.id);

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('community_groups' as any) as any)
    .update({ status: 'archived' })
    .eq('id', groupId)
    .eq('city_id', city.id);
  if (error) throw error;

  await insertAudit('community.group.archive', city.id, 'community_group', groupId, {});
  revalidateCommunity();
  revalidatePath('/painel/comunidade/grupos');
}

export async function upsertCommunityGroupPostAction(formData: FormData) {
  const auth = await requireProfile();
  const city = await assertCurrentCity(String(formData.get('city_id') ?? ''));
  const parsed = communityGroupPostSchema.parse({
    id: optional(formData, 'id'),
    city_id: formData.get('city_id'),
    group_id: formData.get('group_id'),
    title: formData.get('title'),
    body: optional(formData, 'body'),
    post_type: formData.get('post_type'),
    contact_phone: optional(formData, 'contact_phone'),
    contact_whatsapp: optional(formData, 'contact_whatsapp'),
    contact_email: optional(formData, 'contact_email'),
    external_url: optional(formData, 'external_url'),
    starts_at: optional(formData, 'starts_at'),
    ends_at: optional(formData, 'ends_at'),
  });
  await assertCanManageCommunityGroup(parsed.group_id, parsed.city_id, auth.profile.id);

  const supabase = await createClient();
  const canPublishDirectly = isCityManager(auth.roles, parsed.city_id);
  const status = canPublishDirectly ? 'published' : 'pending';
  const payload = {
    city_id: parsed.city_id,
    group_id: parsed.group_id,
    author_profile_id: auth.profile.id,
    title: parsed.title,
    body: parsed.body,
    post_type: parsed.post_type,
    contact_phone: parsed.contact_phone,
    contact_whatsapp: parsed.contact_whatsapp,
    contact_email: parsed.contact_email,
    external_url: parsed.external_url,
    starts_at: parsed.starts_at,
    ends_at: parsed.ends_at,
    status,
  };

  const { data, error } = parsed.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase.from('community_group_posts' as any) as any)
      .update(payload)
      .eq('id', parsed.id)
      .eq('city_id', parsed.city_id)
      .select('id')
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : await (supabase.from('community_group_posts' as any) as any)
      .insert(payload)
      .select('id')
      .single();
  if (error || !data) throw error;

  await uploadOptionalPostImage(formData, data.id, auth.profile.id, parsed.title);
  await insertAudit('community.group_post.upsert', parsed.city_id, 'community_group_post', data.id, payload as Json);

  if (status === 'pending') {
    await enqueueModeration(parsed.city_id, 'community_group_post', data.id);
    void notifyPendingCommunityReview({
      cityId: parsed.city_id,
      cityName: city.name,
      entityType: 'community_group_post',
      entityTitle: parsed.title,
      reviewPath: '/painel/cidade/comunidade',
    }).catch(() => {});
  }

  revalidateCommunity();
  revalidatePath('/painel/comunidade/grupos');
  redirect(`/painel/comunidade/grupos/${parsed.group_id}`);
}

export async function archiveCommunityGroupPostAction(formData: FormData) {
  const auth = await requireProfile();
  const postId = uuid.parse(formData.get('id'));
  const city = await getCurrentCity();
  if (!city) return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: post, error: postError } = await (supabase.from('community_group_posts' as any) as any)
    .select('id, group_id')
    .eq('id', postId)
    .eq('city_id', city.id)
    .single();
  if (postError || !post) throw postError;

  await assertCanManageCommunityGroup(post.group_id, city.id, auth.profile.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('community_group_posts' as any) as any)
    .update({ status: 'archived' })
    .eq('id', postId)
    .eq('city_id', city.id);
  if (error) throw error;

  await insertAudit('community.group_post.archive', city.id, 'community_group_post', postId, {});
  revalidateCommunity();
  revalidatePath(`/painel/comunidade/grupos/${post.group_id}`);
}

export async function toggleCommunityGroupFollowAction(formData: FormData) {
  const parsed = followCommunityGroupSchema.parse({
    city_id: formData.get('city_id'),
    group_id: formData.get('group_id'),
    group_slug: formData.get('group_slug'),
  });
  await assertCurrentCity(parsed.city_id);

  const auth = await requireProfile(`/entrar?next=/comunidade/grupos/${parsed.group_slug}`);
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from('community_group_followers' as any) as any)
    .select('id')
    .eq('group_id', parsed.group_id)
    .eq('profile_id', auth.profile.id)
    .maybeSingle();

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('community_group_followers' as any) as any)
      .delete()
      .eq('group_id', parsed.group_id)
      .eq('profile_id', auth.profile.id);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('community_group_followers' as any) as any).insert({
      city_id: parsed.city_id,
      group_id: parsed.group_id,
      profile_id: auth.profile.id,
      role: 'follower',
    });
  }

  revalidatePath(`/comunidade/grupos/${parsed.group_slug}`);
}

export async function reportContentAction(formData: FormData) {
  const auth = await requireProfile();
  const parsed = reportSchema.parse({
    city_id: formData.get('city_id'),
    entity_type: formData.get('entity_type'),
    entity_id: formData.get('entity_id'),
    reason: formData.get('reason'),
    notes: optional(formData, 'notes'),
  });
  await assertCurrentCity(parsed.city_id);

  const supabase = await createClient();
  const { error } = await supabase.from('content_reports').insert({
    ...parsed,
    reporter_profile_id: auth.profile.id,
  });
  if (error && error.code !== '23505') throw error;

  if (parsed.entity_type !== 'event') {
    await incrementFlaggedCount(parsed.entity_type, parsed.entity_id, parsed.city_id);
  }
  await autoHideIfNeeded(parsed.entity_type, parsed.entity_id, parsed.city_id);

  revalidatePath('/comunidade');
  revalidatePath('/comunidade/grupos');
  revalidatePath('/comunidade/grupos/whatsapp');
  revalidatePath('/painel/cidade/comunidade');
}

async function incrementFlaggedCount(entityType: ModerationEntityType, entityId: string, cityId: string) {
  const supabase = await createClient();
  const table = entityType === 'classified'
    ? 'classifieds'
    : entityType === 'lost_pet'
      ? 'lost_pets'
      : entityType === 'lost_and_found'
        ? 'lost_and_found'
        : entityType === 'community_group'
          ? 'community_groups'
          : entityType === 'community_group_post'
            ? 'community_group_posts'
        : null;
  if (!table) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableRef = supabase.from(table as any) as any;
  const { data } = await tableRef.select('flagged_count').eq('id', entityId).eq('city_id', cityId).maybeSingle();
  const flaggedCount = (data?.flagged_count ?? 0) + 1;
  await tableRef.update({ flagged_count: flaggedCount }).eq('id', entityId).eq('city_id', cityId);
}

async function autoHideIfNeeded(entityType: ModerationEntityType, entityId: string, cityId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from('content_reports')
    .select('id', { count: 'exact', head: true })
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('city_id', cityId);
  if ((count ?? 0) < 3) return;

  await updateModerationStatus(entityType, entityId, cityId, 'pending');
}

async function updateModerationStatus(
  entityType: ModerationEntityType,
  entityId: string,
  cityId: string,
  status: 'pending' | 'published' | 'rejected' | 'archived',
) {
  const supabase = await createClient();
  if (entityType === 'event') {
    return supabase.from('events').update({ status }).eq('id', entityId).eq('city_id', cityId);
  }
  if (entityType === 'classified') {
    return supabase.from('classifieds').update({ status }).eq('id', entityId).eq('city_id', cityId);
  }
  if (entityType === 'lost_pet') {
    return supabase.from('lost_pets').update({ moderation_status: status }).eq('id', entityId).eq('city_id', cityId);
  }
  if (entityType === 'lost_and_found') {
    return supabase.from('lost_and_found').update({ moderation_status: status }).eq('id', entityId).eq('city_id', cityId);
  }
    if (entityType === 'community_group') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (supabase.from('community_groups' as any) as any).update({ status }).eq('id', entityId).eq('city_id', cityId);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from('community_group_posts' as any) as any).update({ status }).eq('id', entityId).eq('city_id', cityId);
}

export async function approveModerationAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const parsed = moderationSchema.parse({
    entity_type: formData.get('entity_type'),
    entity_id: formData.get('entity_id'),
  });

  const { error } = await updateModerationStatus(parsed.entity_type, parsed.entity_id, city.id, 'published');
  if (error) throw error;
  await insertAudit('community.moderation.approve', city.id, parsed.entity_type, parsed.entity_id, {});
  revalidateCommunity();
}

export async function rejectModerationAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const parsed = moderationSchema.parse({
    entity_type: formData.get('entity_type'),
    entity_id: formData.get('entity_id'),
    reason: optional(formData, 'reason'),
  });

  const { error } = await updateModerationStatus(parsed.entity_type, parsed.entity_id, city.id, 'rejected');
  if (error) throw error;
  await insertAudit('community.moderation.reject', city.id, parsed.entity_type, parsed.entity_id, {
    reason: parsed.reason,
  });
  revalidateCommunity();
}

export async function archiveContentAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const parsed = moderationSchema.parse({
    entity_type: formData.get('entity_type'),
    entity_id: formData.get('entity_id'),
  });

  const { error } = await updateModerationStatus(parsed.entity_type, parsed.entity_id, city.id, 'archived');
  if (error) throw error;
  await insertAudit('community.content.archive', city.id, parsed.entity_type, parsed.entity_id, {});
  revalidateCommunity();
}

export async function resolveReportAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const parsed = z.object({ id: uuid, status: z.enum(['reviewed', 'dismissed']) }).parse({
    id: formData.get('id'),
    status: formData.get('status'),
  });
  const supabase = await createClient();
  const { error } = await supabase
    .from('content_reports')
    .update({ status: parsed.status, reviewed_by: auth.profile.id, reviewed_at: new Date().toISOString() })
    .eq('id', parsed.id)
    .eq('city_id', city.id);
  if (error) throw error;
  await insertAudit('community.report.resolve', city.id, 'content_report', parsed.id, { status: parsed.status });
  revalidatePath('/painel/cidade/comunidade');
}

export async function upsertEventCategoryAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = categorySchema.parse({
    id: optional(formData, 'id'),
    slug: formData.get('slug'),
    name: formData.get('name'),
    icon: optional(formData, 'icon'),
    display_order: formData.get('display_order') ?? 0,
  });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('event_categories')
    .upsert({ ...parsed, city_id: city.id })
    .select('id')
    .single();
  if (error || !data) throw error;
  await insertAudit('community.event_category.upsert', city.id, 'event_category', data.id, parsed as Json);
  revalidatePath('/painel/cidade/comunidade');
  revalidatePath('/comunidade/agenda');
}

export async function upsertObituaryAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = obituarySchema.parse({
    id: optional(formData, 'id'),
    city_id: formData.get('city_id'),
    full_name: formData.get('full_name'),
    age: optional(formData, 'age'),
    photo_url: optional(formData, 'photo_url'),
    death_date: formData.get('death_date'),
    wake_location: optional(formData, 'wake_location'),
    wake_at: optional(formData, 'wake_at'),
    burial_at: optional(formData, 'burial_at'),
    burial_location: optional(formData, 'burial_location'),
    mass_at: optional(formData, 'mass_at'),
    mass_location: optional(formData, 'mass_location'),
    family_message: optional(formData, 'family_message'),
    funeral_home: optional(formData, 'funeral_home'),
    status: formData.get('status') || 'draft',
  });
  if (parsed.city_id !== city.id) throw new Error('Cidade invalida.');

  const supabase = await createClient();
  const { data, error } = await supabase.from('obituaries').upsert(parsed).select('id').single();
  if (error || !data) throw error;
  await insertAudit('community.obituary.upsert', city.id, 'obituary', data.id, parsed as Json);
  revalidatePath('/painel/cidade/obituarios');
  revalidatePath('/comunidade/obituarios');
}

function revalidateCommunity() {
  revalidateTag('community-groups', 'max');
  revalidatePath('/comunidade');
  revalidatePath('/comunidade/agenda');
  revalidatePath('/comunidade/classificados');
  revalidatePath('/comunidade/pets');
  revalidatePath('/comunidade/achados');
  revalidatePath('/comunidade/obituarios');
  revalidatePath('/comunidade/grupos');
  revalidatePath('/comunidade/grupos/whatsapp');
  revalidatePath('/painel/comunidade');
  revalidatePath('/painel/comunidade/grupos');
  revalidatePath('/painel/cidade/comunidade');
}

async function uploadOptionalCover(formData: FormData, entityType: string, entityId: string, actorProfileId: string, altText: string) {
  const coverFile = formData.get('cover_file');
  if (!(coverFile instanceof File) || coverFile.size === 0) return;

  await uploadLinkedImage({
    entityType,
    entityId,
    role: 'cover',
    file: coverFile,
    altText,
    actorProfileId,
  });
}

async function uploadOptionalThumb(formData: FormData, entityType: string, entityId: string, actorProfileId: string, altText: string) {
  const thumbFile = formData.get('thumb_file');
  if (!(thumbFile instanceof File) || thumbFile.size === 0) return;

  await uploadLinkedImage({
    entityType,
    entityId,
    role: 'logo',
    file: thumbFile,
    altText,
    actorProfileId,
  });
}

async function uploadOptionalPostImage(formData: FormData, entityId: string, actorProfileId: string, altText: string) {
  const imageFile = formData.get('image_file');
  if (!(imageFile instanceof File) || imageFile.size === 0) return;

  await uploadLinkedImage({
    entityType: 'community_group_post',
    entityId,
    role: 'cover',
    file: imageFile,
    altText,
    actorProfileId,
  });
}

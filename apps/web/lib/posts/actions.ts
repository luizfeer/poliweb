'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { buildMediaPath, uploadImageToR2 } from '@/lib/media/r2';
import { signUploadToken } from '@/lib/media/upload-token';

const nullableString = z
  .string()
  .trim()
  .transform((v) => (v.length > 0 ? v : null))
  .nullable();

const postSchema = z.object({
  id: z.string().uuid().optional(),
  entity_type: z.enum(['business', 'church']),
  entity_id: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().max(2000).nullable(),
  image_url: nullableString,
  video_url: nullableString,
  button_label: z.string().trim().max(40).nullable(),
  button_url: nullableString,
  pinned: z.boolean().default(false),
});

async function assertCanManageEntityPost(entityType: 'business' | 'church', entityId: string, cityId: string) {
  const supabase = await createClient();

  if (entityType === 'business') {
    const { data: manages } = await supabase.rpc('manages_business', { p_business_id: entityId });
    if (manages) return;
    const { data: managesEntity } = await supabase.rpc('manages_entity', {
      p_entity_type: 'business',
      p_entity_id: entityId,
    });
    if (managesEntity) return;
  }

  await requireRole({
    cityId,
    kinds: entityType === 'church'
      ? ['moderator', 'city_admin', 'super_admin']
      : ['city_admin', 'super_admin'],
  });
}

function revalidateEntityPaths(entityType: 'business' | 'church', entitySlug: string | null | undefined, adminPath: string) {
  revalidatePath(adminPath);
  if (entityType === 'business' && entitySlug) revalidatePath(`/comercio/negocio/${entitySlug}`);
  if (entityType === 'church' && entitySlug) revalidatePath(`/comunidade/igrejas/${entitySlug}`);
}

export async function upsertEntityPostAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };

  const entityType = formData.get('entity_type') as 'business' | 'church';
  const entityId = z.string().uuid().parse(formData.get('entity_id'));

  await assertCanManageEntityPost(entityType, entityId, city.id);

  const parsed = postSchema.parse({
    id: formData.get('id') || undefined,
    entity_type: entityType,
    entity_id: entityId,
    title: formData.get('title'),
    body: formData.get('body') || null,
    image_url: formData.get('image_url') || null,
    video_url: formData.get('video_url') || null,
    button_label: formData.get('button_label') || null,
    button_url: formData.get('button_url') || null,
    pinned: formData.get('pinned') === 'on',
  });

  const imageFile = formData.get('image_file');
  const videoFile = formData.get('video_file');
  let imageUrl = parsed.image_url;
  let videoUrl = parsed.video_url;
  let postId = parsed.id;

  if (imageFile instanceof File && imageFile.size > 0) {
    if (!postId) postId = crypto.randomUUID();
    const path = buildMediaPath({
      citySlug: city.slug,
      entityType: 'entity_post',
      entityId: postId,
      role: 'cover',
      filename: imageFile.name,
      unique: false,
    });
    const uploaded = await uploadImageToR2({
      file: imageFile,
      path,
      processor: {
        citySlug: city.slug,
        entityType: 'entity_post',
        entityId: postId,
        role: 'cover',
        unique: false,
      },
    });
    imageUrl = uploaded.cdnUrl;
  }

  if (videoFile instanceof File && videoFile.size > 0) {
    if (!postId) postId = crypto.randomUUID();
    const path = buildMediaPath({
      citySlug: city.slug,
      entityType: 'entity_post',
      entityId: postId,
      role: 'video',
      filename: videoFile.name,
      unique: false,
    });
    const uploaded = await uploadImageToR2({
      file: videoFile,
      path,
      processor: {
        citySlug: city.slug,
        entityType: 'entity_post',
        entityId: postId,
        role: 'video',
        unique: false,
      },
    });
    videoUrl = uploaded.cdnUrl;
  }

  const supabase = await createClient();
  const payload = {
    city_id: city.id,
    entity_type: parsed.entity_type,
    entity_id: parsed.entity_id,
    title: parsed.title,
    body: parsed.body,
    image_url: imageUrl,
    video_url: videoUrl,
    button_label: parsed.button_label,
    button_url: parsed.button_url,
    pinned: parsed.pinned,
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = supabase.from('entity_posts' as any) as any;
  const { error } = postId && parsed.id
    ? await table.update(payload).eq('id', parsed.id).eq('city_id', city.id)
    : await table.insert({ ...payload, ...(postId ? { id: postId } : {}) });

  if (error) return { ok: false, error: error.message };

  const slug = await getEntitySlug(entityType, entityId, city.id);
  const adminPath = entityType === 'business'
    ? `/painel/comercio/${entityId}/novidades`
    : `/painel/cidade/comunidade/igrejas/${slug}/novidades`;
  revalidateEntityPaths(entityType, slug, adminPath);

  return { ok: true };
}

export async function deleteEntityPostAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };

  const postId = z.string().uuid().parse(formData.get('post_id'));
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: post } = await (supabase.from('entity_posts' as any) as any)
    .select('entity_type, entity_id')
    .eq('id', postId)
    .eq('city_id', city.id)
    .single();

  if (!post) return { ok: false, error: 'Publicação não encontrada.' };

  await assertCanManageEntityPost(post.entity_type, post.entity_id, city.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('entity_posts' as any) as any)
    .delete()
    .eq('id', postId)
    .eq('city_id', city.id);

  if (error) return { ok: false, error: error.message };

  const slug = await getEntitySlug(post.entity_type, post.entity_id, city.id);
  const adminPath = post.entity_type === 'business'
    ? `/painel/comercio/${post.entity_id}/novidades`
    : `/painel/cidade/comunidade/igrejas/${slug}/novidades`;
  revalidateEntityPaths(post.entity_type, slug, adminPath);

  return { ok: true };
}

async function getEntitySlug(entityType: 'business' | 'church', entityId: string, cityId: string): Promise<string | null> {
  const supabase = await createClient();
  if (entityType === 'business') {
    const { data } = await supabase.from('businesses').select('slug').eq('id', entityId).eq('city_id', cityId).maybeSingle();
    return data?.slug ?? null;
  }
  const { data } = await supabase.from('churches').select('slug').eq('id', entityId).eq('city_id', cityId).maybeSingle();
  return data?.slug ?? null;
}

const postTokenSchema = z.object({
  parentEntityType: z.enum(['business', 'church']),
  parentEntityId: z.string().uuid(),
  postId: z.string().uuid(),
  role: z.enum(['cover', 'video']),
});

export type EntityPostUploadToken = {
  token: string;
  expiresAt: number;
  processorUrl: string;
  citySlug: string;
  entityType: 'entity_post';
  entityId: string;
  role: 'cover' | 'video';
  unique: boolean;
  maxBytes: number;
};

export async function requestEntityPostUploadTokenAction(
  input: z.infer<typeof postTokenSchema>,
): Promise<EntityPostUploadToken> {
  const city = await getCurrentCity();
  if (!city) throw new Error('Cidade atual nao encontrada.');

  const parsed = postTokenSchema.parse(input);
  await assertCanManageEntityPost(parsed.parentEntityType, parsed.parentEntityId, city.id);

  const processorUrl = process.env.NEXT_PUBLIC_MEDIA_PROCESSOR_URL ?? process.env.MEDIA_PROCESSOR_URL;
  if (!processorUrl) {
    throw new Error('Upload direto indisponivel: MEDIA_PROCESSOR_URL nao configurado.');
  }

  const signed = signUploadToken({
    citySlug: city.slug,
    entityType: 'entity_post',
    entityId: parsed.postId,
    role: parsed.role,
    unique: false,
  });

  return {
    token: signed.token,
    expiresAt: signed.expiresAt,
    processorUrl: processorUrl.replace(/\/$/, ''),
    citySlug: city.slug,
    entityType: 'entity_post',
    entityId: parsed.postId,
    role: parsed.role,
    unique: false,
    maxBytes: Number(process.env.R2_MEDIA_MAX_BYTES ?? 200 * 1024 * 1024),
  };
}

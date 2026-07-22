'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireProfile, requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { buildMediaPath, deleteImageFromR2, uploadImageToR2, type R2UploadResult } from './r2';
import { signUploadToken } from './upload-token';

const mediaRoleSchema = z.enum(['logo', 'cover', 'gallery', 'avatar', 'attachment', 'ad']);

const uploadSchema = z.object({
  entityType: z.string().trim().min(2).max(80).regex(/^[a-z_]+$/),
  entityId: z.string().uuid(),
  role: mediaRoleSchema,
  altText: z.string().trim().max(160).optional().transform((value) => value || null),
  revalidatePath: z.string().trim().max(240).optional(),
});

type UploadLinkedImageInput = z.infer<typeof uploadSchema> & {
  file: File;
  actorProfileId: string;
};

export type UploadedMedia = {
  id: string;
  url: string;
  contentType: string;
  role: z.infer<typeof mediaRoleSchema>;
};

export async function uploadMediaAction(formData: FormData): Promise<UploadedMedia | null> {
  const city = await getCurrentCity();
  if (!city) return null;

  const auth = await requireProfile();
  const parsed = uploadSchema.parse({
    entityType: formData.get('entity_type'),
    entityId: formData.get('entity_id'),
    role: formData.get('role'),
    altText: formData.get('alt_text') || undefined,
    revalidatePath: formData.get('revalidate_path') || undefined,
  });

  await assertCanManageMedia(parsed.entityType, parsed.entityId, city.id, auth.profile.id);

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return null;

  const uploaded = await uploadLinkedImage({
    ...parsed,
    file,
    actorProfileId: auth.profile.id,
  });

  if (parsed.revalidatePath) revalidatePath(parsed.revalidatePath);
  return uploaded;
}

export async function deleteMediaAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireProfile();
  const parsed = z
    .object({
      assetId: z.string().uuid(),
      revalidatePath: z.string().trim().max(240).optional(),
    })
    .parse({
      assetId: formData.get('asset_id'),
      revalidatePath: formData.get('revalidate_path') || undefined,
    });

  const supabase = await createClient();
  const { data: asset, error } = await supabase
    .from('media_assets')
    .select('id, city_id, storage_path, cdn_url, uploaded_by_profile_id, content_type, metadata')
    .eq('id', parsed.assetId)
    .eq('city_id', city.id)
    .single();

  if (error || !asset) throw error ?? new Error('Imagem não encontrada.');

  const { data: links } = await supabase
    .from('media_links')
    .select('entity_type, entity_id, role')
    .eq('asset_id', asset.id)
    .eq('city_id', city.id);

  const isOwner = asset.uploaded_by_profile_id === auth.profile.id;
  if (!isOwner) {
    await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  }

  await deleteImageFromR2(asset.storage_path);
  const thumbPath = extractThumbnailStoragePath(asset.metadata, asset.storage_path, asset.content_type);
  if (thumbPath) {
    await deleteImageFromR2(thumbPath).catch(() => undefined);
  }
  await supabase.from('media_assets').update({ status: 'deleted' }).eq('id', asset.id).eq('city_id', city.id);
  await supabase.from('media_links').delete().eq('asset_id', asset.id).eq('city_id', city.id);
  await Promise.all(
    (links ?? []).map((link) =>
      removeLegacyMediaField(link.entity_type, link.entity_id, link.role, asset.cdn_url),
    ),
  );

  if (parsed.revalidatePath) revalidatePath(parsed.revalidatePath);
}

export async function deleteLegacyMediaAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireProfile();
  const parsed = z
    .object({
      entityType: z.string().trim().min(2).max(80).regex(/^[a-z_]+$/),
      entityId: z.string().uuid(),
      role: mediaRoleSchema,
      url: z.string().trim().min(1).max(2048),
      revalidatePath: z.string().trim().max(240).optional(),
    })
    .parse({
      entityType: formData.get('entity_type'),
      entityId: formData.get('entity_id'),
      role: formData.get('role'),
      url: formData.get('url'),
      revalidatePath: formData.get('revalidate_path') || undefined,
    });

  await assertCanManageMedia(parsed.entityType, parsed.entityId, city.id, auth.profile.id);
  await removeLegacyMediaField(parsed.entityType, parsed.entityId, parsed.role, parsed.url);
  await writeMediaAudit(parsed.entityType, parsed.entityId, city.id, auth.profile.id, {
    role: parsed.role,
    legacy_url: parsed.url,
    source: 'legacy_field',
  });

  if (parsed.revalidatePath) revalidatePath(parsed.revalidatePath);
}

export async function setMediaAsCoverAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireProfile();
  const parsed = z
    .object({
      assetId: z.string().uuid(),
      entityType: z.string().trim().min(2).max(80).regex(/^[a-z_]+$/),
      entityId: z.string().uuid(),
      revalidatePath: z.string().trim().max(240).optional(),
    })
    .parse({
      assetId: formData.get('asset_id'),
      entityType: formData.get('entity_type'),
      entityId: formData.get('entity_id'),
      revalidatePath: formData.get('revalidate_path') || undefined,
    });

  await assertCanManageMedia(parsed.entityType, parsed.entityId, city.id, auth.profile.id);

  const supabase = await createClient();
  const { data: asset, error: assetError } = await supabase
    .from('media_assets')
    .select('id, cdn_url, content_type')
    .eq('id', parsed.assetId)
    .eq('city_id', city.id)
    .eq('status', 'active')
    .single();

  if (assetError || !asset) throw assetError ?? new Error('Mídia não encontrada.');
  if (!asset.content_type.startsWith('image/')) {
    throw new Error('A capa precisa ser uma imagem.');
  }

  const { data: galleryLink, error: linkError } = await supabase
    .from('media_links')
    .select('id')
    .eq('city_id', city.id)
    .eq('asset_id', parsed.assetId)
    .eq('entity_type', parsed.entityType)
    .eq('entity_id', parsed.entityId)
    .eq('role', 'gallery')
    .maybeSingle();

  if (linkError) throw linkError;
  if (!galleryLink) throw new Error('A imagem precisa estar na galeria antes de virar capa.');

  await supabase
    .from('media_links')
    .update({ is_primary: false })
    .eq('city_id', city.id)
    .eq('entity_type', parsed.entityType)
    .eq('entity_id', parsed.entityId)
    .eq('role', 'cover');

  const { error: upsertError } = await supabase.from('media_links').upsert({
    city_id: city.id,
    asset_id: parsed.assetId,
    entity_type: parsed.entityType,
    entity_id: parsed.entityId,
    role: 'cover',
    position: 0,
    is_primary: true,
  }, { onConflict: 'asset_id,entity_type,entity_id,role' });
  if (upsertError) throw upsertError;

  await syncLegacyMediaFields(parsed.entityType, parsed.entityId, 'cover', asset.cdn_url);
  await writeMediaAudit(parsed.entityType, parsed.entityId, city.id, auth.profile.id, {
    role: 'cover',
    asset_id: parsed.assetId,
    source_role: 'gallery',
  });

  if (parsed.revalidatePath) revalidatePath(parsed.revalidatePath);
}

export async function uploadLinkedImage(input: UploadLinkedImageInput): Promise<UploadedMedia> {
  const city = await getCurrentCity();
  if (!city) throw new Error('Cidade atual não encontrada.');

  await assertCanManageMedia(input.entityType, input.entityId, city.id, input.actorProfileId);

  const path = buildMediaPath({
    citySlug: city.slug,
    entityType: input.entityType,
    entityId: input.entityId,
    role: input.role,
    filename: input.file.name,
    unique: input.role === 'gallery' || input.role === 'attachment',
  });

  const uploaded = await uploadImageToR2({
    file: input.file,
    path,
    processor: {
      citySlug: city.slug,
      entityType: input.entityType,
      entityId: input.entityId,
      role: input.role,
      unique: input.role === 'gallery' || input.role === 'attachment',
    },
  });

  return persistLinkedMedia({
    uploaded,
    cityId: city.id,
    entityType: input.entityType,
    entityId: input.entityId,
    role: input.role,
    altText: input.altText,
    actorProfileId: input.actorProfileId,
  });
}

type PersistInput = {
  uploaded: R2UploadResult;
  cityId: string;
  entityType: string;
  entityId: string;
  role: z.infer<typeof mediaRoleSchema>;
  altText: string | null;
  actorProfileId: string;
};

async function persistLinkedMedia(input: PersistInput): Promise<UploadedMedia> {
  const supabase = await createClient();
  const { uploaded } = input;

  const { data: asset, error } = await supabase
    .from('media_assets')
    .upsert({
      city_id: input.cityId,
      uploaded_by_profile_id: input.actorProfileId,
      provider: 'r2',
      bucket: uploaded.bucket,
      storage_path: uploaded.storagePath,
      cdn_url: uploaded.cdnUrl,
      original_filename: uploaded.originalFilename,
      content_type: uploaded.contentType,
      size_bytes: uploaded.sizeBytes,
      checksum_sha256: uploaded.checksumSha256,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      alt_text: input.altText,
      metadata: {
        original_filename: uploaded.originalFilename,
        original_content_type: uploaded.originalContentType ?? uploaded.contentType,
        original_size_bytes: uploaded.originalSizeBytes ?? uploaded.sizeBytes,
        ...(uploaded.thumbnail
          ? {
              thumbnail_storage_path: uploaded.thumbnail.storagePath,
              thumbnail_url: uploaded.thumbnail.cdnUrl,
              thumbnail_content_type: uploaded.thumbnail.contentType,
              thumbnail_width: uploaded.thumbnail.width ?? null,
              thumbnail_height: uploaded.thumbnail.height ?? null,
            }
          : {}),
      },
    }, { onConflict: 'bucket,storage_path' })
    .select('id, cdn_url')
    .single();

  if (error || !asset) throw error ?? new Error('Falha ao gravar metadados da imagem.');

  const shouldBePrimary = input.role !== 'gallery' && input.role !== 'attachment';
  if (shouldBePrimary) {
    await supabase
      .from('media_links')
      .update({ is_primary: false })
      .eq('city_id', input.cityId)
      .eq('entity_type', input.entityType)
      .eq('entity_id', input.entityId)
      .eq('role', input.role);
  }

  const { count } = await supabase
    .from('media_links')
    .select('id', { count: 'exact', head: true })
    .eq('city_id', input.cityId)
    .eq('entity_type', input.entityType)
    .eq('entity_id', input.entityId)
    .eq('role', input.role);

  await supabase.from('media_links').upsert({
    city_id: input.cityId,
    asset_id: asset.id,
    entity_type: input.entityType,
    entity_id: input.entityId,
    role: input.role,
    position: count ?? 0,
    is_primary: shouldBePrimary,
  }, { onConflict: 'asset_id,entity_type,entity_id,role' });

  await syncLegacyMediaFields(input.entityType, input.entityId, input.role, asset.cdn_url);
  await writeMediaAudit(input.entityType, input.entityId, input.cityId, input.actorProfileId, {
    role: input.role,
    asset_id: asset.id,
    storage_path: uploaded.storagePath,
  });

  return {
    id: asset.id,
    url: asset.cdn_url,
    contentType: uploaded.contentType,
    role: input.role,
  };
}

type EntityConfig = { table: string; ownerField: string };

const MEDIA_ENTITY_CONFIG: Record<string, EntityConfig> = {
  business:       { table: 'businesses',    ownerField: 'owner_profile_id' },
  church:         { table: 'churches',       ownerField: 'owner_profile_id' },
  attraction:     { table: 'attractions',    ownerField: 'owner_profile_id' },
  accommodation:  { table: 'accommodations', ownerField: 'owner_profile_id' },
  restaurant:     { table: 'restaurants',   ownerField: 'owner_profile_id' },
  fishing_guide:  { table: 'fishing_guides', ownerField: 'owner_profile_id' },
  tourism_guide:  { table: 'tourism_guides', ownerField: 'owner_profile_id' },
  property:       { table: 'properties',    ownerField: 'owner_profile_id' },
  classified:     { table: 'classifieds',   ownerField: 'author_profile_id' },
  event:          { table: 'events',        ownerField: 'organizer_profile_id' },
  lost_pet:       { table: 'lost_pets',     ownerField: 'author_profile_id' },
  lost_and_found: { table: 'lost_and_found', ownerField: 'author_profile_id' },
  community_group: { table: 'community_groups', ownerField: 'owner_profile_id' },
  community_group_post: { table: 'community_group_posts', ownerField: 'author_profile_id' },
};

async function assertCanManageMedia(entityType: string, entityId: string, cityId: string, profileId: string) {
  const supabase = await createClient();

  const { data: managesEntity } = await supabase.rpc('manages_entity', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  });
  if (managesEntity) return;

  if (entityType === 'business') {
    const { data: managesBusiness } = await supabase.rpc('manages_business', { p_business_id: entityId });
    if (managesBusiness) return;
  }

  // Item de catálogo herda a permissão do negócio dono (catalog_items.business_id).
  if (entityType === 'catalog_item') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: item } = await (supabase.from('catalog_items' as any) as any)
      .select('business_id')
      .eq('id', entityId)
      .maybeSingle();
    const businessId = (item as { business_id?: string } | null)?.business_id;
    if (businessId) {
      const { data: managesBusiness } = await supabase.rpc('manages_business', { p_business_id: businessId });
      if (managesBusiness) return;
    }
  }

  const config = MEDIA_ENTITY_CONFIG[entityType];
  if (config) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from(config.table as any) as any)
      .select('id')
      .eq('id', entityId)
      .eq('city_id', cityId)
      .eq(config.ownerField, profileId)
      .maybeSingle();
    if (data) return;
  }

  if (entityType === 'church') {
    await requireRole({ cityId, kinds: ['moderator', 'city_admin', 'super_admin'] });
    return;
  }

  await requireRole({ cityId, kinds: ['city_admin', 'super_admin'] });
}

async function appendTourismGuideGalleryUrl(entityId: string, url: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('tourism_guides' as any) as any).select('photos').eq('id', entityId).single();
  const raw = (data as { photos?: unknown } | null)?.photos;
  const arr = Array.isArray(raw) ? raw.filter((u): u is string => typeof u === 'string') : [];
  if (!arr.includes(url)) arr.push(url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('tourism_guides' as any) as any).update({ photos: arr }).eq('id', entityId);
}

async function syncLegacyMediaFields(entityType: string, entityId: string, role: z.infer<typeof mediaRoleSchema>, url: string) {
  const supabase = await createClient();

  if (entityType === 'business') {
    if (role === 'logo') await supabase.from('businesses').update({ logo_url: url }).eq('id', entityId);
    if (role === 'cover') await supabase.from('businesses').update({ cover_url: url }).eq('id', entityId);
    if (role === 'gallery') await appendJsonPhoto('businesses', entityId, url);
  }

  if (entityType === 'church') {
    if (role === 'logo') await supabase.from('churches').update({ logo_url: url }).eq('id', entityId);
    if (role === 'cover') await supabase.from('churches').update({ cover_url: url }).eq('id', entityId);
  }

  if (entityType === 'catalog_item' && (role === 'cover' || role === 'gallery')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('catalog_items' as any) as any).update({ photo_url: url }).eq('id', entityId);
  }

  if (entityType === 'attraction') {
    if (role === 'cover') await supabase.from('attractions').update({ cover_url: url }).eq('id', entityId);
    if (role === 'gallery') await appendJsonPhoto('attractions', entityId, url);
  }

  if (entityType === 'accommodation') {
    if (role === 'cover') await supabase.from('accommodations').update({ cover_url: url }).eq('id', entityId);
    if (role === 'gallery') await appendJsonPhoto('accommodations', entityId, url);
  }

  if (entityType === 'restaurant') {
    if (role === 'cover') await supabase.from('restaurants').update({ cover_url: url }).eq('id', entityId);
    if (role === 'gallery') await appendJsonPhoto('restaurants', entityId, url);
  }

  if (entityType === 'fishing_guide' && role === 'avatar') {
    await supabase.from('fishing_guides').update({ photo_url: url }).eq('id', entityId);
  }

  if (entityType === 'tourism_guide') {
    if (role === 'cover') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('tourism_guides' as any) as any).update({ cover_url: url }).eq('id', entityId);
    }
    if (role === 'gallery') {
      await appendTourismGuideGalleryUrl(entityId, url);
    }
  }

  if (entityType === 'property') {
    if (role === 'cover') await supabase.from('properties').update({ cover_url: url }).eq('id', entityId);
    if (role === 'gallery') await appendJsonPhoto('properties', entityId, url);
  }

  if (entityType === 'classified') {
    if (role === 'cover') await supabase.from('classifieds').update({ cover_url: url }).eq('id', entityId);
    if (role === 'gallery') await appendJsonPhoto('classifieds', entityId, url);
  }

  if (entityType === 'event' && role === 'cover') {
    await supabase.from('events').update({ cover_url: url }).eq('id', entityId);
  }

  if (entityType === 'lost_pet' && role === 'cover') {
    await supabase.from('lost_pets').update({ cover_url: url }).eq('id', entityId);
  }

  if (entityType === 'lost_and_found' && role === 'cover') {
    await supabase.from('lost_and_found').update({ cover_url: url }).eq('id', entityId);
  }

  if (entityType === 'community_group') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (role === 'cover') await (supabase.from('community_groups' as any) as any).update({ cover_url: url }).eq('id', entityId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (role === 'logo') await (supabase.from('community_groups' as any) as any).update({ thumbnail_url: url }).eq('id', entityId);
  }

  if (entityType === 'community_group_post' && role === 'cover') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('community_group_posts' as any) as any).update({ image_url: url }).eq('id', entityId);
  }
}

async function appendJsonPhoto(
  table: 'businesses' | 'attractions' | 'accommodations' | 'restaurants' | 'properties' | 'classifieds',
  entityId: string,
  url: string,
) {
  const supabase = await createClient();
  const { data } = await supabase.from(table).select('photos').eq('id', entityId).single();
  const rawPhotos = (data as { photos?: unknown } | null)?.photos;
  const photos = Array.isArray(rawPhotos) ? rawPhotos.filter((item: unknown): item is string => typeof item === 'string') : [];
  await supabase.from(table).update({ photos: [...photos, url] as Json }).eq('id', entityId);
}

async function removeLegacyMediaField(entityType: string, entityId: string, role: string, url: string) {
  const supabase = await createClient();

  if (entityType === 'business') {
    if (role === 'logo') await supabase.from('businesses').update({ logo_url: null }).eq('id', entityId).eq('logo_url', url);
    if (role === 'cover') await supabase.from('businesses').update({ cover_url: null }).eq('id', entityId).eq('cover_url', url);
    if (role === 'gallery') await removeJsonPhoto('businesses', entityId, url);
  }

  if (entityType === 'church') {
    if (role === 'logo') await supabase.from('churches').update({ logo_url: null }).eq('id', entityId).eq('logo_url', url);
    if (role === 'cover') await supabase.from('churches').update({ cover_url: null }).eq('id', entityId).eq('cover_url', url);
  }

  if (entityType === 'attraction') {
    if (role === 'cover') await supabase.from('attractions').update({ cover_url: null }).eq('id', entityId).eq('cover_url', url);
    if (role === 'gallery') await removeJsonPhoto('attractions', entityId, url);
  }

  if (entityType === 'accommodation') {
    if (role === 'cover') await supabase.from('accommodations').update({ cover_url: null }).eq('id', entityId).eq('cover_url', url);
    if (role === 'gallery') await removeJsonPhoto('accommodations', entityId, url);
  }

  if (entityType === 'restaurant') {
    if (role === 'cover') await supabase.from('restaurants').update({ cover_url: null }).eq('id', entityId).eq('cover_url', url);
    if (role === 'gallery') await removeJsonPhoto('restaurants', entityId, url);
  }

  if (entityType === 'property') {
    if (role === 'cover') await supabase.from('properties').update({ cover_url: null }).eq('id', entityId).eq('cover_url', url);
    if (role === 'gallery') await removeJsonPhoto('properties', entityId, url);
  }

  if (entityType === 'classified') {
    if (role === 'cover') await supabase.from('classifieds').update({ cover_url: null }).eq('id', entityId).eq('cover_url', url);
    if (role === 'gallery') await removeJsonPhoto('classifieds', entityId, url);
  }

  if (entityType === 'community_group') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (role === 'cover') await (supabase.from('community_groups' as any) as any).update({ cover_url: null }).eq('id', entityId).eq('cover_url', url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (role === 'logo') await (supabase.from('community_groups' as any) as any).update({ thumbnail_url: null }).eq('id', entityId).eq('thumbnail_url', url);
  }

  if (entityType === 'community_group_post') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (role === 'cover') await (supabase.from('community_group_posts' as any) as any).update({ image_url: null }).eq('id', entityId).eq('image_url', url);
  }
}

async function removeJsonPhoto(
  table: 'businesses' | 'attractions' | 'accommodations' | 'restaurants' | 'properties' | 'classifieds',
  entityId: string,
  url: string,
) {
  const supabase = await createClient();
  const { data } = await supabase.from(table).select('photos').eq('id', entityId).single();
  const rawPhotos = (data as { photos?: unknown } | null)?.photos;
  const photos = Array.isArray(rawPhotos) ? rawPhotos.filter((item: unknown): item is string => typeof item === 'string') : [];
  await supabase.from(table).update({ photos: photos.filter((photo) => photo !== url) as Json }).eq('id', entityId);
}

function extractThumbnailStoragePath(metadata: unknown, storagePath: string, contentType: string): string | null {
  if (metadata && typeof metadata === 'object') {
    const value = (metadata as Record<string, unknown>).thumbnail_storage_path;
    if (typeof value === 'string' && value.length > 0) return value;
  }
  if (contentType.startsWith('video/') && /\.mp4$/i.test(storagePath)) {
    return storagePath.replace(/\.mp4$/i, '.poster.webp');
  }
  return null;
}

async function writeMediaAudit(entityType: string, entityId: string, cityId: string, actorId: string, diff: Record<string, Json>) {
  const supabase = await createClient();
  await supabase.from('audit_log').insert({
    actor_id: actorId,
    city_id: cityId,
    action: `${entityType}.media.upload`,
    entity_type: entityType,
    entity_id: entityId,
    diff,
  });
}

const processedUploadSchema = z.object({
  bucket: z.string().min(1),
  storagePath: z.string().min(1).max(512),
  cdnUrl: z.string().url(),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().nonnegative(),
  checksumSha256: z.string().min(1).max(128),
  originalFilename: z.string().min(1).max(240),
  originalContentType: z.string().max(120).optional(),
  originalSizeBytes: z.number().int().nonnegative().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  thumbnail: z
    .object({
      storagePath: z.string().min(1).max(512),
      cdnUrl: z.string().url(),
      contentType: z.string().min(1).max(120),
      sizeBytes: z.number().int().nonnegative(),
      width: z.number().int().nullable().optional(),
      height: z.number().int().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const tokenRequestSchema = z.object({
  entityType: z.string().trim().min(2).max(80).regex(/^[a-z_]+$/),
  entityId: z.string().uuid(),
  role: mediaRoleSchema,
});

const finalizeSchema = tokenRequestSchema.extend({
  altText: z.string().trim().max(160).nullable().optional(),
  revalidatePath: z.string().trim().max(240).nullable().optional(),
  processed: processedUploadSchema,
});

export type DirectUploadTokenResponse = {
  token: string;
  expiresAt: number;
  processorUrl: string;
  citySlug: string;
  entityType: string;
  entityId: string;
  role: z.infer<typeof mediaRoleSchema>;
  unique: boolean;
  maxBytes: number;
};

export async function requestMediaUploadTokenAction(
  input: z.infer<typeof tokenRequestSchema>,
): Promise<DirectUploadTokenResponse> {
  const city = await getCurrentCity();
  if (!city) throw new Error('Cidade atual não encontrada.');

  const auth = await requireProfile();
  const parsed = tokenRequestSchema.parse(input);
  await assertCanManageMedia(parsed.entityType, parsed.entityId, city.id, auth.profile.id);

  const processorUrl = process.env.NEXT_PUBLIC_MEDIA_PROCESSOR_URL ?? process.env.MEDIA_PROCESSOR_URL;
  if (!processorUrl) {
    console.error('[media] MEDIA_PROCESSOR_URL não configurado');
    throw new Error('Upload direto indisponível: configure MEDIA_PROCESSOR_URL no servidor.');
  }
  if (!process.env.MEDIA_PROCESSOR_SECRET) {
    console.error('[media] MEDIA_PROCESSOR_SECRET não configurado');
    throw new Error('Upload direto indisponível: configure MEDIA_PROCESSOR_SECRET no servidor.');
  }

  const unique = parsed.role === 'gallery' || parsed.role === 'attachment';
  const signed = signUploadToken({
    citySlug: city.slug,
    entityType: parsed.entityType,
    entityId: parsed.entityId,
    role: parsed.role,
    unique,
  });

  const maxBytes = Number(process.env.R2_MEDIA_MAX_BYTES ?? 200 * 1024 * 1024);

  return {
    token: signed.token,
    expiresAt: signed.expiresAt,
    processorUrl: processorUrl.replace(/\/$/, ''),
    citySlug: city.slug,
    entityType: parsed.entityType,
    entityId: parsed.entityId,
    role: parsed.role,
    unique,
    maxBytes,
  };
}

export async function finalizeMediaUploadAction(
  input: z.infer<typeof finalizeSchema>,
): Promise<UploadedMedia> {
  try {
    const city = await getCurrentCity();
    if (!city) throw new Error('Cidade atual não encontrada.');

    const auth = await requireProfile();
    const parsed = finalizeSchema.parse(input);
    await assertCanManageMedia(parsed.entityType, parsed.entityId, city.id, auth.profile.id);

    const expectedPrefix = `${city.slug}/${parsed.entityType}/${parsed.entityId}/${parsed.role}/`;
    if (!parsed.processed.storagePath.startsWith(expectedPrefix)) {
      throw new Error(`storage_path não pertence a essa entidade. esperado=${expectedPrefix} recebido=${parsed.processed.storagePath}`);
    }

    const uploaded: R2UploadResult = {
      bucket: parsed.processed.bucket,
      storagePath: parsed.processed.storagePath,
      cdnUrl: parsed.processed.cdnUrl,
      contentType: parsed.processed.contentType,
      sizeBytes: parsed.processed.sizeBytes,
      checksumSha256: parsed.processed.checksumSha256,
      originalFilename: parsed.processed.originalFilename,
      originalContentType: parsed.processed.originalContentType,
      originalSizeBytes: parsed.processed.originalSizeBytes,
      width: parsed.processed.width ?? null,
      height: parsed.processed.height ?? null,
      thumbnail: parsed.processed.thumbnail ?? null,
    };

    const result = await persistLinkedMedia({
      uploaded,
      cityId: city.id,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      role: parsed.role,
      altText: parsed.altText ?? null,
      actorProfileId: auth.profile.id,
    });

    if (parsed.entityType === 'business') {
      revalidateTag('businesses', 'max');
      revalidateTag(`businesses:${city.id}`, 'max');
    }
    if (parsed.revalidatePath) revalidatePath(parsed.revalidatePath);
    return result;
  } catch (error) {
    console.error('[finalizeMediaUploadAction] erro', {
      input: {
        entityType: input?.entityType,
        entityId: input?.entityId,
        role: input?.role,
        storagePath: input?.processed?.storagePath,
        contentType: input?.processed?.contentType,
      },
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
    throw error;
  }
}

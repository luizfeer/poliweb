import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Database } from '@/lib/supabase/database.types';
import { deleteImageFromR2 } from '@/lib/media/r2';
import { createServiceRoleClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

const mediaRoleSchema = z.enum(['logo', 'cover', 'gallery', 'avatar', 'attachment', 'ad']);

const processedSchema = z.object({
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
});

const bodySchema = z.object({
  citySlug: z.string().trim().min(1).max(80),
  entityType: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z_]+$/),
  entityId: z.string().uuid(),
  role: mediaRoleSchema,
  altText: z.string().trim().max(160).nullable().optional(),
  processed: processedSchema,
});

function userScopedClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Supabase não configurado.');
  return createSupabaseClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function appendJsonPhoto(
  supabase: ReturnType<typeof userScopedClient>,
  table: 'businesses',
  entityId: string,
  url: string,
): Promise<void> {
  const { data } = await supabase.from(table).select('photos').eq('id', entityId).single();
  const rawPhotos = (data as { photos?: unknown } | null)?.photos;
  const photos = Array.isArray(rawPhotos)
    ? rawPhotos.filter((item: unknown): item is string => typeof item === 'string')
    : [];
  if (photos.includes(url)) return;
  await supabase.from(table).update({ photos: [...photos, url] }).eq('id', entityId);
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;
  if (!accessToken) {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }

  let payload: z.infer<typeof bodySchema>;
  try {
    payload = bodySchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      { error: 'invalid_body', detail: error instanceof Error ? error.message : null },
      { status: 400 },
    );
  }

  const service = createServiceRoleClient();
  const { data: userResult, error: userError } = await service.auth.getUser(accessToken);
  if (userError || !userResult?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const profileId = userResult.user.id;

  const userSupabase = userScopedClient(accessToken);

  const { data: city, error: cityError } = await userSupabase
    .from('cities')
    .select('id, slug')
    .eq('slug', payload.citySlug)
    .maybeSingle();
  if (cityError || !city) {
    return NextResponse.json({ error: 'city_not_found' }, { status: 404 });
  }

  const expectedPrefix = `${city.slug}/${payload.entityType}/${payload.entityId}/${payload.role}/`;
  if (!payload.processed.storagePath.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { error: 'storage_path_mismatch', expected: expectedPrefix },
      { status: 400 },
    );
  }

  const previousProfileAvatar =
    payload.entityType === 'profile' && payload.entityId === profileId && payload.role === 'avatar'
      ? await findPreviousProfileAvatar(userSupabase, city.id, profileId)
      : null;

  // Insert / upsert the media asset (RLS gates this to the owning user).
  const { data: asset, error: assetError } = await userSupabase
    .from('media_assets')
    .upsert(
      {
        city_id: city.id,
        uploaded_by_profile_id: profileId,
        provider: 'r2',
        bucket: payload.processed.bucket,
        storage_path: payload.processed.storagePath,
        cdn_url: payload.processed.cdnUrl,
        original_filename: payload.processed.originalFilename,
        content_type: payload.processed.contentType,
        size_bytes: payload.processed.sizeBytes,
        checksum_sha256: payload.processed.checksumSha256,
        width: payload.processed.width ?? null,
        height: payload.processed.height ?? null,
        alt_text: payload.altText ?? null,
        metadata: {
          original_filename: payload.processed.originalFilename,
          original_content_type:
            payload.processed.originalContentType ?? payload.processed.contentType,
          original_size_bytes: payload.processed.originalSizeBytes ?? payload.processed.sizeBytes,
        },
      },
      { onConflict: 'bucket,storage_path' },
    )
    .select('id, cdn_url')
    .single();

  if (assetError || !asset) {
    return NextResponse.json(
      { error: 'asset_insert_failed', detail: assetError?.message ?? null },
      { status: 500 },
    );
  }

  const shouldBePrimary = payload.role !== 'gallery' && payload.role !== 'attachment';
  if (shouldBePrimary) {
    await userSupabase
      .from('media_links')
      .update({ is_primary: false })
      .eq('city_id', city.id)
      .eq('entity_type', payload.entityType)
      .eq('entity_id', payload.entityId)
      .eq('role', payload.role);
  }

  const { count } = await userSupabase
    .from('media_links')
    .select('id', { count: 'exact', head: true })
    .eq('city_id', city.id)
    .eq('entity_type', payload.entityType)
    .eq('entity_id', payload.entityId)
    .eq('role', payload.role);

  const { error: linkError } = await userSupabase.from('media_links').upsert(
    {
      city_id: city.id,
      asset_id: asset.id,
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      role: payload.role,
      position: count ?? 0,
      is_primary: shouldBePrimary,
    },
    { onConflict: 'asset_id,entity_type,entity_id,role' },
  );

  if (linkError) {
    return NextResponse.json(
      { error: 'link_insert_failed', detail: linkError.message },
      { status: 500 },
    );
  }

  await syncLegacyFields(userSupabase, payload.entityType, payload.entityId, payload.role, asset.cdn_url);
  if (previousProfileAvatar && previousProfileAvatar.id !== asset.id) {
    await deletePreviousProfileAvatar(userSupabase, previousProfileAvatar);
  }
  if (payload.entityType === 'business') {
    revalidateTag('businesses', 'max');
    revalidateTag(`businesses:${city.id}`, 'max');
    const { data: businessRow } = await userSupabase
      .from('businesses')
      .select('slug')
      .eq('id', payload.entityId)
      .maybeSingle();
    const slug = businessRow?.slug;
    if (slug) {
      revalidateTag(`business:${city.id}:${slug}`, 'max');
      revalidatePath(`/comercio/negocio/${slug}`);
      revalidatePath(`/comercio/negocio/${slug}/cardapio`);
    }
  }

  return NextResponse.json({
    id: asset.id,
    url: asset.cdn_url,
    contentType: payload.processed.contentType,
    role: payload.role,
  });
}

type PreviousProfileAvatar = {
  id: string;
  storage_path: string;
};

async function findPreviousProfileAvatar(
  supabase: ReturnType<typeof userScopedClient>,
  cityId: string,
  profileId: string,
): Promise<PreviousProfileAvatar | null> {
  const { data } = await supabase
    .from('media_links')
    .select('asset_id, media_assets(id, storage_path)')
    .eq('city_id', cityId)
    .eq('entity_type', 'profile')
    .eq('entity_id', profileId)
    .eq('role', 'avatar')
    .eq('is_primary', true)
    .maybeSingle();

  const asset = Array.isArray(data?.media_assets) ? data?.media_assets[0] : data?.media_assets;
  if (!asset?.id || !asset.storage_path) return null;
  return { id: asset.id, storage_path: asset.storage_path };
}

async function deletePreviousProfileAvatar(
  supabase: ReturnType<typeof userScopedClient>,
  asset: PreviousProfileAvatar,
): Promise<void> {
  try {
    await deleteImageFromR2(asset.storage_path);
  } catch {
    // Mantem o registro como deletado mesmo que o CDN falhe temporariamente.
  }
  await supabase.from('media_links').delete().eq('asset_id', asset.id);
  await supabase.from('media_assets').update({ status: 'deleted' }).eq('id', asset.id);
}

async function syncLegacyFields(
  supabase: ReturnType<typeof userScopedClient>,
  entityType: string,
  entityId: string,
  role: string,
  url: string,
): Promise<void> {
  // Cobre os casos mais comuns (cover/logo) das entidades que mais sobem foto pelo mobile.
  // Galerias com JSON.photos foram mantidas no fluxo web original — mobile escreve apenas
  // em media_assets/media_links e o consumo moderno usa essas tabelas.
  try {
    if (entityType === 'business') {
      if (role === 'logo') await supabase.from('businesses').update({ logo_url: url }).eq('id', entityId);
      if (role === 'cover') await supabase.from('businesses').update({ cover_url: url }).eq('id', entityId);
      if (role === 'gallery') await appendJsonPhoto(supabase, 'businesses', entityId, url);
    } else if (entityType === 'church') {
      if (role === 'logo') await supabase.from('churches').update({ logo_url: url }).eq('id', entityId);
      if (role === 'cover') await supabase.from('churches').update({ cover_url: url }).eq('id', entityId);
    } else if (entityType === 'attraction' && role === 'cover') {
      await supabase.from('attractions').update({ cover_url: url }).eq('id', entityId);
    } else if (entityType === 'accommodation' && role === 'cover') {
      await supabase.from('accommodations').update({ cover_url: url }).eq('id', entityId);
    } else if (entityType === 'restaurant' && role === 'cover') {
      await supabase.from('restaurants').update({ cover_url: url }).eq('id', entityId);
    } else if (entityType === 'property' && role === 'cover') {
      await supabase.from('properties').update({ cover_url: url }).eq('id', entityId);
    } else if (entityType === 'event' && role === 'cover') {
      await supabase.from('events').update({ cover_url: url }).eq('id', entityId);
    } else if (entityType === 'classified' && role === 'cover') {
      await supabase.from('classifieds').update({ cover_url: url }).eq('id', entityId);
    } else if (entityType === 'profile' && role === 'avatar') {
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', entityId);
    }
  } catch {
    // Silencia erro de sync legado — link já foi gravado.
  }
}

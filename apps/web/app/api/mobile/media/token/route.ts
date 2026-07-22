import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { signUploadToken } from '@/lib/media/upload-token';
import type { Database } from '@/lib/supabase/database.types';
import { createServiceRoleClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

const mediaRoleSchema = z.enum(['logo', 'cover', 'gallery', 'avatar', 'attachment', 'ad']);

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
});

function userScopedClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase nao configurado.');
  }
  return createSupabaseClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
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

  const userSupabase = userScopedClient(accessToken);
  const profileId = userResult.user.id;

  const { data: city, error: cityError } = await userSupabase
    .from('cities')
    .select('id, slug')
    .eq('slug', payload.citySlug)
    .maybeSingle();
  if (cityError || !city) {
    return NextResponse.json({ error: 'city_not_found' }, { status: 404 });
  }

  const allowed =
    payload.entityType === 'profile' && payload.entityId === profileId && payload.role === 'avatar'
      ? true
      : await assertCanManageMedia(userSupabase, payload.entityType, payload.entityId, city.id);
  if (!allowed) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const processorUrl =
    process.env.NEXT_PUBLIC_MEDIA_PROCESSOR_URL ?? process.env.MEDIA_PROCESSOR_URL;
  if (!processorUrl) {
    return NextResponse.json({ error: 'processor_not_configured' }, { status: 500 });
  }

  const unique = payload.role === 'gallery' || payload.role === 'attachment';
  const signed = signUploadToken({
    citySlug: city.slug,
    entityType: payload.entityType,
    entityId: payload.entityId,
    role: payload.role,
    unique,
  });

  const maxBytes = Number(process.env.R2_MEDIA_MAX_BYTES ?? 200 * 1024 * 1024);

  return NextResponse.json({
    token: signed.token,
    expiresAt: signed.expiresAt,
    processorUrl: processorUrl.replace(/\/$/, ''),
    citySlug: city.slug,
    entityType: payload.entityType,
    entityId: payload.entityId,
    role: payload.role,
    unique,
    maxBytes,
  });
}

const OWNER_FIELDS: Record<string, { table: string; ownerField: string }> = {
  business: { table: 'businesses', ownerField: 'owner_profile_id' },
  church: { table: 'churches', ownerField: 'owner_profile_id' },
  attraction: { table: 'attractions', ownerField: 'owner_profile_id' },
  accommodation: { table: 'accommodations', ownerField: 'owner_profile_id' },
  restaurant: { table: 'restaurants', ownerField: 'owner_profile_id' },
  property: { table: 'properties', ownerField: 'owner_profile_id' },
  classified: { table: 'classifieds', ownerField: 'author_profile_id' },
  event: { table: 'events', ownerField: 'organizer_profile_id' },
};

async function assertCanManageMedia(
  supabase: ReturnType<typeof userScopedClient>,
  entityType: string,
  entityId: string,
  cityId: string,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: viaEntity } = await (supabase.rpc as any)('manages_entity', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  });
  if (viaEntity) return true;

  if (entityType === 'business') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: viaBiz } = await (supabase.rpc as any)('manages_business', {
      p_business_id: entityId,
    });
    if (viaBiz) return true;
  }

  const config = OWNER_FIELDS[entityType];
  if (config) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from(config.table as any) as any)
      .select('id')
      .eq('id', entityId)
      .eq('city_id', cityId)
      .maybeSingle();
    if (data) return true;
  }

  return false;
}

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createServiceRoleClient } from '@/lib/supabase/service';

const bodySchema = z.object({
  token: z.string().min(10).max(256),
  platform: z.enum(['ios', 'android', 'web']),
  appVersion: z.string().max(32).nullable().optional(),
  deviceName: z.string().max(128).nullable().optional(),
});

export const runtime = 'nodejs';

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
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const service = createServiceRoleClient();
  const { data: userResult, error: userError } = await service.auth.getUser(accessToken);
  if (userError || !userResult?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const profileId = userResult.user.id;

  const { error: upsertError } = await service
    .from('device_push_tokens')
    .upsert(
      {
        profile_id: profileId,
        token: payload.token,
        platform: payload.platform,
        app_version: payload.appVersion ?? null,
        device_name: payload.deviceName ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id,token' },
    );

  if (upsertError) {
    return NextResponse.json({ error: 'persist_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

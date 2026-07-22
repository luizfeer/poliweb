import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createServiceRoleClient } from '@/lib/supabase/service';

const bodySchema = z.object({
  adId: z.string().uuid(),
  eventType: z.enum(['impression', 'play', 'click', 'complete']),
  platform: z.enum(['ios', 'android', 'web']).nullable().optional(),
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let payload: z.infer<typeof bodySchema>;
  try {
    payload = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;

  const service = createServiceRoleClient();
  let profileId: string | null = null;
  if (accessToken) {
    const { data } = await service.auth.getUser(accessToken);
    profileId = data?.user?.id ?? null;
  }

  const { error } = await service.from('home_video_ad_events').insert({
    ad_id: payload.adId,
    profile_id: profileId,
    event_type: payload.eventType,
    platform: payload.platform ?? null,
  });

  if (error) return NextResponse.json({ error: 'persist_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

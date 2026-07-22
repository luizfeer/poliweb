import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().max(256).nullable().optional(),
  cityId: z.string().uuid().nullable().optional(),
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: z.infer<typeof bodySchema>;
  try {
    payload = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { error } = await supabase
    .from('web_push_subscriptions')
    .upsert(
      {
        profile_id: userResult.user.id,
        endpoint: payload.endpoint,
        p256dh: payload.p256dh,
        auth: payload.auth,
        user_agent: payload.userAgent ?? null,
        city_id: payload.cityId ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id,endpoint' },
    );

  if (error) {
    return NextResponse.json({ error: 'persist_failed', detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  if (!endpoint) {
    return NextResponse.json({ error: 'missing_endpoint' }, { status: 400 });
  }

  const { error } = await supabase
    .from('web_push_subscriptions')
    .delete()
    .eq('profile_id', userResult.user.id)
    .eq('endpoint', endpoint);
  if (error) {
    return NextResponse.json({ error: 'delete_failed', detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

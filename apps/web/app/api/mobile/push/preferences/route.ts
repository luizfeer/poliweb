import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import type { Database } from '@/lib/supabase/database.types';
import { createServiceRoleClient } from '@/lib/supabase/service';

type NotificationPreferenceInsert =
  Database['public']['Tables']['notification_preferences']['Insert'];

const bodySchema = z.object({
  type: z.string().min(1).max(64),
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
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

  const update: NotificationPreferenceInsert = {
    profile_id: profileId,
    type: payload.type,
    updated_at: new Date().toISOString(),
  };
  if (payload.pushEnabled !== undefined) update.push_enabled = payload.pushEnabled;
  if (payload.emailEnabled !== undefined) update.email_enabled = payload.emailEnabled;

  const { error } = await service
    .from('notification_preferences')
    .upsert(update, { onConflict: 'profile_id,city_id,type' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

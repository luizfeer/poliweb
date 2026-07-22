import { NextResponse, type NextRequest } from 'next/server';

import { createServiceRoleClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;
  if (!accessToken) {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }

  const service = createServiceRoleClient();
  const { data: userResult, error: userError } = await service.auth.getUser(accessToken);
  if (userError || !userResult?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await service
    .from('device_push_tokens')
    .delete()
    .eq('id', id)
    .eq('profile_id', userResult.user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

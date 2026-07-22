import { type NextRequest, NextResponse } from 'next/server';

import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { getUnreadNotificationCount } from '@/lib/notifications';
import { buildPainelMenu } from '@/lib/painel/menu';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const access_token =
      request.headers.get('x-access-token') ??
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
      null;
    const refresh_token = request.headers.get('x-refresh-token') ?? null;

    if (access_token && refresh_token) {
      const supabase = await createClient();
      await supabase.auth.setSession({ access_token, refresh_token });
    }

    const [auth, city] = await Promise.all([requireProfile(), getCurrentCity()]);
    if (!city) {
      return NextResponse.json({ ok: false, error: 'no_city' }, { status: 400 });
    }

    const unreadNotifications = await getUnreadNotificationCount(auth.profile.id);
    const groups = buildPainelMenu({ auth, city, unreadNotifications });

    return NextResponse.json({
      ok: true,
      city: { id: city.id, name: city.name, state: city.state },
      profile: {
        id: auth.profile.id,
        name: auth.profile.full_name ?? null,
        avatarUrl: auth.profile.avatar_url ?? null,
      },
      groups,
      unreadNotifications,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
}

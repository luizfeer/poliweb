import { NextResponse, type NextRequest } from 'next/server';

import { createServiceRoleClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export const NOTIFICATION_CATEGORIES = [
  { type: 'lead.received', label: 'Leads recebidos', description: 'Alguém pediu contato em um anúncio seu.' },
  { type: 'business.update', label: 'Negócios que você gerencia', description: 'Aprovações, mensagens e atualizações.' },
  { type: 'city.alert', label: 'Avisos da cidade', description: 'Comunicados oficiais e alertas.' },
  { type: 'events.new', label: 'Novos eventos', description: 'Eventos cadastrados na sua cidade.' },
  { type: 'classifieds.reply', label: 'Classificados', description: 'Respostas e interesse em itens.' },
] as const;

export async function GET(request: NextRequest) {
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
  const profileId = userResult.user.id;

  const [devicesRes, prefsRes] = await Promise.all([
    service
      .from('device_push_tokens')
      .select('id, platform, device_name, app_version, last_seen_at, created_at')
      .eq('profile_id', profileId)
      .order('last_seen_at', { ascending: false }),
    service
      .from('notification_preferences')
      .select('type, push_enabled, email_enabled')
      .eq('profile_id', profileId),
  ]);

  if (devicesRes.error) {
    return NextResponse.json({ error: devicesRes.error.message }, { status: 500 });
  }
  if (prefsRes.error) {
    return NextResponse.json({ error: prefsRes.error.message }, { status: 500 });
  }

  const prefMap = new Map(
    (prefsRes.data ?? []).map((row) => [
      row.type,
      { push: row.push_enabled, email: row.email_enabled },
    ]),
  );

  const categories = NOTIFICATION_CATEGORIES.map((cat) => ({
    ...cat,
    pushEnabled: prefMap.get(cat.type)?.push ?? true,
    emailEnabled: prefMap.get(cat.type)?.email ?? false,
  }));

  return NextResponse.json({
    ok: true,
    devices: devicesRes.data ?? [],
    categories,
  });
}

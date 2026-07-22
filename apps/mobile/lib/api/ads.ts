import { Platform } from 'react-native';

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export type AdEventType = 'impression' | 'play' | 'click' | 'complete';

const inflight = new Set<string>();

/**
 * Fire-and-forget tracking. De-dupes (adId, eventType) por sessão pra não inflar números
 * com re-renders. Falhas são engolidas — não bloqueia UX.
 */
export async function trackAdEvent(adId: string, eventType: AdEventType): Promise<void> {
  const key = `${adId}:${eventType}`;
  if (eventType === 'impression' && inflight.has(key)) return;
  inflight.add(key);

  try {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    await fetch(`${env.webBaseUrl}/api/mobile/ads/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ adId, eventType, platform: Platform.OS }),
      keepalive: true,
    });
  } catch {
    // intencional: não atrapalha a UI
  }
}

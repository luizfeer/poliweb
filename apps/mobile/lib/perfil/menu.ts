import type { Session } from '@supabase/supabase-js';

import { cachedJson, invalidate } from '@/lib/api/cached-json';
import { mobileDebug } from '@/lib/debug';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export type PainelMenuIcon =
  | 'dashboard'
  | 'bell'
  | 'heart'
  | 'user'
  | 'users'
  | 'handshake'
  | 'coins'
  | 'ticket'
  | 'store'
  | 'landmark'
  | 'shield-check'
  | 'shield-alert'
  | 'building'
  | 'clipboard'
  | 'map'
  | 'gift'
  | 'chart'
  | 'blocks'
  | 'network'
  | 'flag'
  | 'logout';

export type PainelMenuItem = {
  href: string;
  label: string;
  eyebrow: string;
  icon: PainelMenuIcon;
  badge?: number;
};

export type PainelMenuGroup = {
  title: string;
  items: PainelMenuItem[];
};

export type PainelMenuResponse = {
  city: { id: string; name: string; state: string };
  profile: { id: string; name: string | null; avatarUrl: string | null };
  groups: PainelMenuGroup[];
  unreadNotifications: number;
};

export async function fetchPainelMenu(
  sessionOverride?: Session | null,
): Promise<PainelMenuResponse | null> {
  let session = sessionOverride ?? null;
  if (!session) {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  }
  mobileDebug('perfil-menu', 'session check', {
    hasSession: Boolean(session),
    source: sessionOverride ? 'override' : 'getSession',
  });
  if (!session) return null;

  return cachedJson(
    `perfil-menu:${session.user.id}`,
    () => fetchPainelMenuRemote(session!),
    { ttlMs: 2 * 60 * 1000 },
  );
}

async function fetchPainelMenuRemote(session: Session): Promise<PainelMenuResponse | null> {
  const url = `${env.webBaseUrl}/api/mobile/menu`;
  try {

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-access-token': session.access_token,
        'x-refresh-token': session.refresh_token,
        accept: 'application/json',
      },
    });
    mobileDebug('perfil-menu', 'fetch response', { url, status: res.status, ok: res.ok });

    const raw = await res.text();
    if (!res.ok) {
      mobileDebug('perfil-menu', 'http error', { status: res.status, body: raw.slice(0, 300) });
      return null;
    }
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (parseError) {
      mobileDebug('perfil-menu', 'parse error', {
        message: String(parseError),
        body: raw.slice(0, 300),
      });
      return null;
    }
    const data = json as { ok?: boolean; groups?: PainelMenuGroup[] } & PainelMenuResponse;
    mobileDebug('perfil-menu', 'parsed json', {
      ok: data?.ok,
      groupsCount: data?.groups?.length ?? 0,
    });
    if (!data?.ok) return null;
    return {
      city: data.city,
      profile: data.profile,
      groups: data.groups ?? [],
      unreadNotifications: data.unreadNotifications ?? 0,
    };
  } catch (err) {
    mobileDebug('perfil-menu', 'fetch threw', { url, message: String(err) });
    return null;
  }
}

export async function invalidatePainelMenu(userId: string): Promise<void> {
  await invalidate(`perfil-menu:${userId}`);
}

export function hrefToWebViewRoute(href: string): {
  pathname: '/(tabs)/perfil/webview/[path]';
  params: { path: string; p: string };
} {
  return {
    pathname: '/(tabs)/perfil/webview/[path]',
    params: { path: 'raw', p: href },
  };
}

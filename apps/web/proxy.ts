import type { NextRequest } from 'next/server';

import {
  MOBILE_APP_COOKIE,
  MOBILE_APP_COOKIE_VALUE,
  MOBILE_APP_UA_TOKEN,
} from '@/lib/runtime/mobile-app';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Proxy único (Next 16): refresh de sessão Supabase + cookie do app mobile.
 *
 * Cookie `pc-app=carmelitano` quando `?mobile=1` ou User-Agent `CarmelitanoApp/*`.
 */
export async function proxy(request: NextRequest) {
  const qpMobile = request.nextUrl.searchParams.get('mobile') === '1';
  const ua = request.headers.get('user-agent') ?? '';
  const uaMobile = ua.includes(MOBILE_APP_UA_TOKEN);
  const existing = request.cookies.get(MOBILE_APP_COOKIE)?.value;
  const isEmbeddedApp =
    qpMobile ||
    uaMobile ||
    existing === MOBILE_APP_COOKIE_VALUE;

  if (isEmbeddedApp) {
    request.headers.set('x-carmo-embedded-app', '1');
  }

  const response = await updateSession(request);

  if ((qpMobile || uaMobile) && existing !== MOBILE_APP_COOKIE_VALUE) {
    response.cookies.set({
      name: MOBILE_APP_COOKIE,
      value: MOBILE_APP_COOKIE_VALUE,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
  }

  if (isEmbeddedApp) {
    response.headers.set('x-carmo-embedded-app', '1');
  }

  if (request.nextUrl.pathname.startsWith('/painel')) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { getResolvedCitySlug } from '@/lib/cities/city-slug';
import {
  MOBILE_APP_COOKIE,
  MOBILE_APP_COOKIE_VALUE,
  MOBILE_APP_UA_TOKEN,
} from '@/lib/runtime/mobile-app';
import type { Database } from './database.types';

export async function updateSession(request: NextRequest) {
  const citySlug = getResolvedCitySlug();
  const isEmbeddedApp =
    request.nextUrl.searchParams.get('mobile') === '1' ||
    request.headers.get('user-agent')?.includes(MOBILE_APP_UA_TOKEN) ||
    request.cookies.get(MOBILE_APP_COOKIE)?.value === MOBILE_APP_COOKIE_VALUE;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-city-slug', citySlug);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  if (isEmbeddedApp) {
    requestHeaders.set('x-carmo-embedded-app', '1');
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Necessário: força refresh do token e propaga Set-Cookie pro response.
  // Não usar entre createServerClient e este getUser nenhuma outra lógica.
  await supabase.auth.getUser();

  if (request.cookies.get('city_slug')?.value !== citySlug) {
    supabaseResponse.cookies.set('city_slug', citySlug, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }
  supabaseResponse.headers.set('x-city-slug', citySlug);

  return supabaseResponse;
}

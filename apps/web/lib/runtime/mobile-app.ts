import { cookies, headers } from 'next/headers';

export const MOBILE_APP_COOKIE = 'pc-app';
export const MOBILE_APP_COOKIE_VALUE = 'carmelitano';
export const MOBILE_APP_UA_TOKEN = 'CarmelitanoApp';

/**
 * Detecta se o request veio do app mobile (WebView do apps/mobile).
 *
 * Sinais (qualquer um já vale):
 * - cookie `pc-app=carmelitano` (setada pelo proxy na 1ª visita com `?mobile=1`)
 * - User-Agent contém `CarmelitanoApp/<versão>`
 *
 * Use isto em RSC para esconder chrome redundante (GlobalNav, ChatWidget, FAB do assistente, banner de consent).
 */
export async function isMobileAppRequest(): Promise<boolean> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  if (headerStore.get('x-carmo-embedded-app') === '1') return true;
  if (cookieStore.get(MOBILE_APP_COOKIE)?.value === MOBILE_APP_COOKIE_VALUE) return true;
  const ua = headerStore.get('user-agent') ?? '';
  return ua.includes(MOBILE_APP_UA_TOKEN);
}

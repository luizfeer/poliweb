import { ONDE_FICAR_ROUTE } from '@/lib/navigation/onde-ficar';

const NATIVE_PATHS: Record<string, string> = {
  '/assistente': '/assistente',
  '/agenda': '/agenda',
  '/comercio/buscar': '/buscar-nativo',
  '/buscar-nativo': '/buscar-nativo',
};

/**
 * Converte href do portal (admin/home builder) para rota do app.
 */
export function portalHrefToMobile(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) return '/';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const [pathPart, query = ''] = trimmed.split('?');
  const path = pathPart ?? trimmed;
  const qs = query ? `?${query}` : '';

  if (path === '/turismo/onde-ficar' || path.startsWith('/turismo/onde-ficar/')) {
    return `${ONDE_FICAR_ROUTE}${qs}`;
  }

  const native = NATIVE_PATHS[path];
  if (native) return `${native}${qs}`;

  const webviewKey = path.replace(/^\//, '').replace(/\//g, '-');
  return qs ? `/webview/${webviewKey}${qs}` : `/webview/${webviewKey}`;
}

import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';

import { SmartWebView } from '@/components/webview/SmartWebView';
import { mobileDebug } from '@/lib/debug';

/**
 * Deep-link: /webview/comercio-negocio-slug → /comercio/negocio/slug
 * Fica dentro de (tabs) para manter a tab bar nativa.
 */
export default function WebViewScreen() {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const path = useMemo(() => buildWebPath(params), [params]);

  useEffect(() => {
    mobileDebug('webview-route', 'path decoded', {
      rawPath: params.path ?? null,
      path,
    });
  }, [params.path, path]);

  return <SmartWebView path={path} redirectTabs={false} />;
}

function buildWebPath(params: Record<string, string | string[]>): string {
  const explicit = firstParam(params.p);
  if (explicit && explicit.startsWith('/')) return explicit;

  const slug = firstParam(params.path) ?? '';
  const pathname = decodePath(slug);
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === 'path' || key === 'p') continue;
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      search.append(key, item);
    }
  }

  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function decodePath(slug: string): string {
  if (!slug) return '/';
  const [pathPart, query] = slug.split('?');
  if (!pathPart) return '/';

  const knownPrefixes: [string, string][] = [
    ['turismo-o-que-fazer', '/turismo/o-que-fazer'],
    ['turismo-onde-ficar', '/comercio/pousadas'],
    ['turismo-onde-comer', '/turismo/onde-comer'],
    ['comercio-pousadas', '/comercio/pousadas'],
    ['comercio-negocio', '/comercio/negocio'],
  ];

  for (const [prefix, pathname] of knownPrefixes) {
    if (pathPart === prefix) return `${pathname}${query ? `?${query}` : ''}`;
    if (pathPart.startsWith(`${prefix}-`)) {
      const itemSlug = pathPart.slice(prefix.length + 1);
      return `${pathname}/${itemSlug}${query ? `?${query}` : ''}`;
    }
  }

  const parts = pathPart.split('-');
  if (parts.length <= 2) return `/${parts.join('/')}${query ? `?${query}` : ''}`;
  return `/${parts[0]}/${parts[1]}/${parts.slice(2).join('-')}${query ? `?${query}` : ''}`;
}

import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';

import { PerfilWebViewShell } from '@/components/perfil/PerfilWebViewShell';
import { mobileDebug } from '@/lib/debug';

const TITLE_MAP: Record<string, string> = {
  '/painel/cidadao': 'Meu painel',
  '/painel': 'Meu painel',
  '/painel/favoritos': 'Favoritos',
  '/painel/notificacoes': 'Notificações',
  '/painel/perfil': 'Perfil',
  '/painel/perfil/privacidade': 'Excluir conta',
  '/painel/cidadao/pontos': 'Pontos',
  '/painel/cidadao/sorteios': 'Sorteios',
  '/painel/cidadao/indicar': 'Indicar amigos',
  '/anuncie': 'Anuncie',
  '/painel/comunidade': 'Comunidade',
  '/painel/comercio': 'Meu comércio',
  '/termos': 'Termos',
  '/privacidade': 'Privacidade',
  '/excluir-conta': 'Excluir conta',
};

export default function PerfilWebViewScreen() {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const path = useMemo(() => buildWebPath(params), [params]);
  const title = useMemo(() => {
    const base = path.split('?')[0] ?? '/';
    return TITLE_MAP[base] ?? 'Painel';
  }, [path]);

  useEffect(() => {
    mobileDebug('webview-route', 'perfil path decoded', {
      rawPath: params.path ?? null,
      path,
      title,
    });
  }, [params.path, path, title]);

  return <PerfilWebViewShell path={path} title={title} />;
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
  if (!slug) return '/painel';
  const [pathPart, query] = slug.split('?');
  if (!pathPart) return '/painel';

  const knownPrefixes: [string, string][] = [
    ['painel-favoritos', '/painel/favoritos'],
    ['painel-notificacoes', '/painel/notificacoes'],
    ['painel-configuracoes', '/painel/configuracoes'],
    ['painel', '/painel'],
    ['termos', '/termos'],
    ['privacidade', '/privacidade'],
    ['excluir-conta', '/excluir-conta'],
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

import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import { mobileDebug } from '@/lib/debug';
import { env } from '@/lib/env';

import { openPortalUrl } from './open-portal-url';

// ─── Tabela de rotas nativas ──────────────────────────────────────────────
// Mapeia paths do portal web → rotas nativas do app.
// Quando uma URL bater aqui, abrimos a tela nativa em vez do webview.
//
// Use `exact: true` para match exato, ou regex pra patterns.
// O retorno (`to`) é uma rota válida do expo-router.
//
// 🎯 Adicione novas entradas SEMPRE que criar uma tela nativa que substitua
// uma página do painel web — isso evita o webview "sobrescrever" a nativa.

type NativeRouteRule =
  | { kind: 'exact'; from: string; to: (params: Record<string, string>) => string }
  | { kind: 'regex'; from: RegExp; to: (match: RegExpMatchArray, params: Record<string, string>) => string };

const NATIVE_ROUTES: NativeRouteRule[] = [
  {
    // Cardápio nativo do comércio (mais específico — vem antes do detalhe)
    kind: 'regex',
    from: /^\/comercio\/negocio\/([^/]+)\/cardapio$/,
    to: (m) => `/comercio/${m[1]}/cardapio`,
  },
  {
    // Detalhe nativo do comércio/pousada substitui /comercio/negocio/{slug}
    kind: 'regex',
    from: /^\/comercio\/negocio\/([^/]+)$/,
    to: (m) => `/comercio/${m[1]}`,
  },
  {
    // Inbox/histórico de notificações = tela nativa de Avisos
    kind: 'exact',
    from: '/painel/notificacoes',
    to: () => '/inbox/notifications',
  },
  {
    // Configuração de notificações (devices + preferências)
    kind: 'exact',
    from: '/painel/notificacoes/preferencias',
    to: () => '/(tabs)/perfil/notificacoes',
  },
  // Exemplos futuros:
  // {
  //   kind: 'exact',
  //   from: '/painel/perfil',
  //   to: () => '/(tabs)/perfil',
  // },
  // {
  //   kind: 'regex',
  //   from: /^\/turismo\/o-que-fazer\/([^/]+)$/,
  //   to: (m) => `/(tabs)/explorar/atracao/${m[1]}`,
  // },
];

export type RouteDecision =
  | { kind: 'native'; to: string }
  | { kind: 'webview'; portalUrl: string }
  | { kind: 'external'; url: string };

/**
 * Decide pra onde navegar dado um href/URL.
 *
 * Aceita:
 *   - path absoluto interno:   `/painel/notificacoes`
 *   - path com query:          `/painel/eventos?tipo=hoje`
 *   - URL completa do portal:  `https://portalcarmelitano.com.br/painel`
 *   - URL externa:             `https://google.com`
 *
 * Não navega — só retorna a decisão. Use `smartNavigate` pra agir.
 */
export function resolveRoute(href: string): RouteDecision {
  // URL absoluta?
  if (/^https?:\/\//i.test(href)) {
    try {
      const target = new URL(href);
      const base = new URL(env.webBaseUrl);
      if (!target.hostname.endsWith(base.hostname)) {
        return { kind: 'external', url: href };
      }
      const path = target.pathname + target.search;
      return resolveInternalPath(path);
    } catch {
      return { kind: 'external', url: href };
    }
  }

  // Path interno
  if (href.startsWith('/')) {
    return resolveInternalPath(href);
  }

  // Qualquer outra coisa (mailto:, tel:, etc) → external
  return { kind: 'external', url: href };
}

function resolveInternalPath(pathWithQuery: string): RouteDecision {
  const [path = '', query] = pathWithQuery.split('?');

  // Paths do expo-router (com grupos tipo `/(tabs)`) já são rotas nativas explícitas.
  if (/\/\([a-z0-9_-]+\)\//i.test(path) || path.startsWith('/webview/')) {
    return { kind: 'native', to: pathWithQuery };
  }

  const params = parseQuery(query ?? '');

  for (const rule of NATIVE_ROUTES) {
    if (rule.kind === 'exact' && rule.from === path) {
      return { kind: 'native', to: appendQuery(rule.to(params), query) };
    }
    if (rule.kind === 'regex') {
      const m = path.match(rule.from);
      if (m) return { kind: 'native', to: appendQuery(rule.to(m, params), query) };
    }
  }

  // Fallback: webview
  const portalUrl = pathWithQuery;
  return { kind: 'webview', portalUrl };
}

/**
 * Navega pra onde a decisão mandar. Substitui chamadas diretas a
 * `router.push(href)` que assumem rota nativa.
 */
export function smartNavigate(href: string): void {
  const decision = resolveRoute(href);
  mobileDebug('navigation', 'smartNavigate', { href, decision });

  if (decision.kind === 'native') {
    router.push(decision.to as never);
    return;
  }
  if (decision.kind === 'webview') {
    openPortalUrl(decision.portalUrl);
    return;
  }
  Linking.openURL(decision.url).catch(() => undefined);
}

// ─── helpers ──────────────────────────────────────────────────────────────

function parseQuery(qs: string): Record<string, string> {
  if (!qs) return {};
  const out: Record<string, string> = {};
  for (const part of qs.split('&')) {
    if (!part) continue;
    const [k = '', v = ''] = part.split('=');
    out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
}

function appendQuery(path: string, query: string | undefined): string {
  if (!query) return path;
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}

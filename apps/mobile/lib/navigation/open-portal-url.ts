import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import { mobileDebug } from '@/lib/debug';
import { env } from '@/lib/env';

/**
 * Abre URL do portal no WebView empilhado na aba Início (`/webview/...`).
 */
export function openPortalUrl(url: string): void {
  try {
    const base = new URL(env.webBaseUrl);
    const target = new URL(url, base);
    if (!target.hostname.endsWith(base.hostname)) {
      mobileDebug('navigation', 'opening external url', target.toString());
      Linking.openURL(target.toString()).catch(() => undefined);
      return;
    }
    // Rota explícita pra dentro da tab "Início" — evita ambiguidade entre
    // index/webview e perfil/webview, e garante stack consistente.
    const href = {
      pathname: '/(tabs)/index/webview/[path]',
      params: {
        path: 'raw',
        p: `${target.pathname}${target.search}${target.hash}`,
      },
    } as const;
    mobileDebug('navigation', 'opening portal url in webview', {
      input: url,
      target: target.toString(),
      href,
    });
    // Limpa qualquer stack já empilhado antes de abrir o webview novo,
    // pra clicar de novo na tab Início voltar pra home (não pra outro webview).
    try {
      router.dismissAll();
    } catch {
      // sem nada pra dismissar — ok
    }
    router.push(href as never);
  } catch (error) {
    mobileDebug('navigation', 'open portal url failed, falling back to Linking', {
      input: url,
      error,
    });
    Linking.openURL(url).catch(() => undefined);
  }
}

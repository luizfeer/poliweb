'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

export type MobileWebViewSection = {
  id: string;
  label: string;
  /** Hash (`#sobre`) ou rota (`/comercio`) para chips de navegação. */
  href?: string;
};

type MobileWebViewSectionBridgeProps = {
  sections: MobileWebViewSection[];
  /** scroll = destaca seção ao rolar; navigate = só informa chips (tap navega no nativo). */
  mode?: 'scroll' | 'navigate';
};

function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.ReactNativeWebView) return true;
  return document.documentElement.getAttribute('data-embedded-app') === 'true';
}

function post(type: string, payload: unknown) {
  window.ReactNativeWebView?.postMessage(JSON.stringify({ type, payload }));
}

function resolveScrollTarget(sectionId: string): Element | null {
  const byData = document.querySelector(`[data-mobile-section-id="${sectionId}"]`);
  if (byData) {
    const rect = byData.getBoundingClientRect();
    if (rect.height > 0) return byData;
    let sibling = byData.nextElementSibling;
    while (sibling) {
      if (sibling.getBoundingClientRect().height > 0) return sibling;
      sibling = sibling.nextElementSibling;
    }
    return byData;
  }

  const idCandidates = [sectionId, `sec-${sectionId}`];
  let byId: HTMLElement | null = null;
  for (const candidate of idCandidates) {
    byId = document.getElementById(candidate);
    if (byId) break;
  }
  if (!byId) return null;
  if (byId.getBoundingClientRect().height > 0) return byId;
  let sibling = byId.nextElementSibling;
  while (sibling) {
    if (sibling.getBoundingClientRect().height > 0) return sibling;
    sibling = sibling.nextElementSibling;
  }
  return byId;
}

/**
 * Envia seções da página ao header nativo do WebView e mantém o chip ativo no scroll.
 * Sentinelas vazias (`<motion.div id="sobre" />` sem altura) são resolvidas pelo bloco seguinte.
 */
export function MobileWebViewSectionBridge({
  sections,
  mode = 'scroll',
}: MobileWebViewSectionBridgeProps) {
  useEffect(() => {
    if (!isEmbedded() || !window.ReactNativeWebView || sections.length === 0) return;

    const payload = sections.map((s) => ({
      id: s.id,
      label: s.label,
      href: s.href ?? (mode === 'scroll' ? `#${s.id}` : undefined),
    }));

    post('mobile-sections', { sections: payload, mode });

    if (mode !== 'scroll') return;

    const scrollSections = sections.filter((s) => !s.href || s.href.startsWith('#'));
    if (scrollSections.length === 0) return;

    let activeId = scrollSections[0]?.id ?? '';
    const isScrollingTo = { current: false };

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingTo.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length === 0) return;
        const id = visible[0]?.target.getAttribute('data-mobile-section-id');
        if (id && id !== activeId) {
          activeId = id;
          post('mobile-section-active', { id });
        }
      },
      {
        rootMargin: '-120px 0px -55% 0px',
        threshold: 0,
      },
    );

    for (const section of scrollSections) {
      const el = resolveScrollTarget(section.id);
      if (!el) continue;
      el.setAttribute('data-mobile-section-id', section.id);
      observer.observe(el);
    }

    post('mobile-section-active', { id: activeId });

    return () => observer.disconnect();
  }, [sections, mode]);

  return null;
}

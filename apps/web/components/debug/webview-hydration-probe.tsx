'use client';

import { useEffect } from 'react';

export function WebViewHydrationProbe() {
  useEffect(() => {
    if (!document.documentElement.dataset.embeddedApp) return;
    console.info('[webview-hydration] react-mounted', {
      href: window.location.href,
      pathname: window.location.pathname,
    });
  }, []);

  return null;
}

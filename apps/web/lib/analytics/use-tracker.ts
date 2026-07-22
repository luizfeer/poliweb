'use client';

import { useCallback } from 'react';

export type ClientEventType =
  | 'phone_click'
  | 'whatsapp_click'
  | 'website_click'
  | 'directions_click'
  | 'share'
  | 'favorite_add';

function getSessionHash(): string {
  if (typeof window === 'undefined') return '';
  const ua = navigator.userAgent;
  const today = new Date().toISOString().slice(0, 10);
  const raw = `${ua}:${today}:${window.location.hostname}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0').repeat(4).slice(0, 64);
}

export function useBusinessTracker(businessId: string, cityId: string) {
  const track = useCallback(
    (eventType: ClientEventType) => {
      if (typeof window === 'undefined') return;
      const sessionHash = getSessionHash();
      fetch('/api/track/business-event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          businessId,
          cityId,
          eventType,
          sessionHash,
          source: 'internal',
          referrer: document.referrer ? new URL(document.referrer).hostname : null,
        }),
        keepalive: true,
      }).catch(() => {
        // fire-and-forget
      });
    },
    [businessId, cityId],
  );

  return { track };
}

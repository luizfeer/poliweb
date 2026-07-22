'use client';

import { useEffect, useRef } from 'react';
import { himetricaTrack } from '@/lib/analytics/himetrica';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';

export function NewsletterConfirmAnalytics() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    himetricaTrack(HI_METRICA_EVENTS.newsletter_subscribe_completed, { source: 'email_confirm' });
  }, []);

  return null;
}

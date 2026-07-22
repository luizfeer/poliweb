'use client';

import { useEffect, useRef } from 'react';
import { himetricaTrack } from '@/lib/analytics/himetrica';

type Props = {
  event: string;
  payload?: Record<string, unknown>;
};

export function HimetricaPageView({ event, payload }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    himetricaTrack(event, payload ?? {});
  }, [event, payload]);

  return null;
}

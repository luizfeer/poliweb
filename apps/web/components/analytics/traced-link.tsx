'use client';

import type { ComponentPropsWithoutRef } from 'react';
import { himetricaTrack } from '@/lib/analytics/himetrica';

type Props = ComponentPropsWithoutRef<'a'> & {
  trackEvent?: string;
  trackPayload?: Record<string, unknown>;
};

export function TracedLink({ trackEvent, trackPayload, onClick, ...rest }: Props) {
  return (
    <a
      {...rest}
      onClick={(event) => {
        if (trackEvent) himetricaTrack(trackEvent, trackPayload ?? {});
        onClick?.(event);
      }}
    />
  );
}

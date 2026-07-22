'use client';

import { Loader2 } from 'lucide-react';
import { useLinkPending } from './link';

type Props = {
  className?: string;
  variant?: 'overlay' | 'inline';
};

export function LinkPending({ className, variant = 'overlay' }: Props) {
  const pending = useLinkPending();
  if (!pending) return null;

  if (variant === 'inline') {
    return (
      <Loader2
        aria-hidden
        className={className ?? 'ml-1 inline-block h-3.5 w-3.5 animate-spin opacity-70'}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={
        className ??
        'absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-paper/55 backdrop-blur-[2px] animate-in fade-in duration-150'
      }
    >
      <Loader2 className="h-5 w-5 animate-spin text-[var(--carmo-clay-600)]" />
    </span>
  );
}

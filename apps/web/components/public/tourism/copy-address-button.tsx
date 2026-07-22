'use client';

import { Copy } from 'lucide-react';
import { useCallback, useState } from 'react';
import { himetricaTrack } from '@/lib/analytics/himetrica';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';
import { cn } from '@/lib/utils';

type Props = {
  address: string;
  variant?: 'default' | 'compact';
  analytics?: {
    entity_type: string;
    entity_slug: string;
    entity_id?: string;
  };
  className?: string;
};

export function CopyAddressButton({ address, variant = 'default', analytics, className }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      if (analytics) {
        himetricaTrack(HI_METRICA_EVENTS.address_copied, {
          entity_type: analytics.entity_type,
          entity_slug: analytics.entity_slug,
          ...(analytics.entity_id ? { entity_id: analytics.entity_id } : {}),
        });
      }
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [address, analytics]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Endereço copiado' : 'Copiar endereço para a área de transferência'}
      className={cn(
        variant === 'compact'
          ? 'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-ink-200 bg-paper-deep px-3 text-center text-[12px] font-bold text-ink-900 shadow-sm transition-colors hover:bg-white'
          : 'border-ink-100 text-ink-900 hover:bg-paper inline-flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 text-[13px] font-semibold transition-colors',
        className,
        copied &&
          variant === 'compact' &&
          'border-cerrado-300 bg-cerrado-50 text-cerrado-900 hover:bg-cerrado-50 border-l-4 border-l-cerrado-600',
      )}
    >
      <Copy className="size-4 shrink-0" aria-hidden="true" />
      {variant === 'compact' ? (copied ? 'Copiado' : 'Copiar') : copied ? 'Copiado!' : 'Copiar endereço'}
    </button>
  );
}

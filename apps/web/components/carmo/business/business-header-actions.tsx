'use client';

import { Heart, Share2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toggleBusinessFavoriteAction } from '@/app/comercio/actions';
import { cn } from '@/lib/utils';

type BusinessHeaderActionsProps = {
  businessId: string;
  businessSlug: string;
  businessName: string;
  initialSaved: boolean;
};

export function BusinessHeaderActions({
  businessId,
  businessSlug,
  businessName,
  initialSaved,
}: BusinessHeaderActionsProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  async function shareBusiness() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: businessName, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // O usuário pode cancelar o compartilhamento nativo.
    }
  }

  function toggleSaved() {
    setSaved((current) => !current);
    startTransition(async () => {
      try {
        const result = await toggleBusinessFavoriteAction({ businessId, businessSlug });
        setSaved(result.favorited);
      } catch (error) {
        setSaved((current) => !current);
        throw error;
      }
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-bold text-ink-900 underline underline-offset-2 hover:bg-paper-tint"
        onClick={() => void shareBusiness()}
      >
        <Share2 className="size-4" aria-hidden="true" />
        Compartilhar
      </button>
      <button
        type="button"
        className={cn(
          'inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-bold text-ink-900 underline underline-offset-2 hover:bg-paper-tint',
          isPending && 'opacity-70',
        )}
        aria-pressed={saved}
        disabled={isPending}
        onClick={toggleSaved}
      >
        <Heart className={saved ? 'size-4 fill-clay-500 text-clay-500' : 'size-4'} aria-hidden="true" />
        {saved ? 'Salvo' : 'Salvar'}
      </button>
    </div>
  );
}

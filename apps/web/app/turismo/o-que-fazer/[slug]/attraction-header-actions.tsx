'use client';

import { Heart, Share2 } from 'lucide-react';
import { useState } from 'react';

type AttractionHeaderActionsProps = {
  attractionName: string;
};

export function AttractionHeaderActions({ attractionName }: AttractionHeaderActionsProps) {
  const [saved, setSaved] = useState(false);

  async function shareAttraction() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: attractionName, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // O usuário pode cancelar o compartilhamento nativo; não há ação necessária.
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-bold text-ink-900 underline underline-offset-2 hover:bg-paper-tint"
        onClick={() => void shareAttraction()}
      >
        <Share2 className="size-4" aria-hidden="true" />
        Compartilhar
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-bold text-ink-900 underline underline-offset-2 hover:bg-paper-tint"
        aria-pressed={saved}
        onClick={() => setSaved((current) => !current)}
      >
        <Heart className={saved ? 'size-4 fill-ink-900' : 'size-4'} aria-hidden="true" />
        Salvar
      </button>
    </div>
  );
}

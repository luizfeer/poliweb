'use client';

import { Share2 } from 'lucide-react';

type CommunityGroupShareButtonProps = {
  title: string;
};

export function CommunityGroupShareButton({ title }: CommunityGroupShareButtonProps) {
  async function shareGroup() {
    const url = window.location.href;
    try {
      if (navigator.share && window.isSecureContext) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // Cancelar o share nativo não precisa de tratamento.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void shareGroup()}
      className="rounded-md border px-4 py-2 text-sm"
    >
      <span className="inline-flex items-center gap-2">
        <Share2 className="size-4" aria-hidden="true" />
        Compartilhar
      </span>
    </button>
  );
}

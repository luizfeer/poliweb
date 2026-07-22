'use client';

import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

import { shouldHideChatFab } from '@/lib/chat/hide-chat-fab';
import { LAST_SESSION_STORAGE_KEY } from '@/lib/chat/storage';
import { FloatingPortal } from '@/lib/ui/floating-portal';
import { useIosTap } from '@/lib/ui/use-ios-tap';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

type Props = {
  cityName: string;
};

/**
 * FAB do assistente dentro do app nativo (WebView).
 * Some em /comercio — lá o dono usa o FAB de postar mídia.
 */
export function EmbeddedChatFab({ cityName }: Props) {
  const pathname = usePathname();

  const handleOpen = useCallback(() => {
    const lastId =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(LAST_SESSION_STORAGE_KEY)
        : null;
    const href = lastId ? `/assistente?id=${encodeURIComponent(lastId)}` : '/assistente';

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'navigate', payload: href }),
      );
      return;
    }

    window.location.href = href;
  }, []);

  const fabTap = useIosTap(handleOpen);

  if (shouldHideChatFab(pathname)) return null;

  return (
    <FloatingPortal>
      <button
        type="button"
        data-show-in-embedded-app
        data-floating-action
        {...fabTap}
        className="carmo-embedded-chat-fab fixed z-50 flex h-14 w-14 touch-manipulation items-center justify-center rounded-full bg-[#00a884] text-white shadow-lg shadow-[#00000026] transition-transform active:scale-95"
        aria-label={`Abrir assistente de ${cityName}`}
      >
        <MessageCircle size={24} />
      </button>
    </FloatingPortal>
  );
}

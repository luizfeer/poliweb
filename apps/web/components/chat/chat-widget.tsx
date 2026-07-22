'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Maximize2, MessageCircle, X } from 'lucide-react';
import { ChatApp } from './chat-app';
import { LAST_SESSION_STORAGE_KEY } from '@/lib/chat/storage';
import { shouldHideChatFab } from '@/lib/chat/hide-chat-fab';
import { FloatingPortal } from '@/lib/ui/floating-portal';
import { useIosTap } from '@/lib/ui/use-ios-tap';

type Props = {
  cityName: string;
};

export function ChatWidget({ cityName }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleFabClick = useCallback(() => {
    if (window.matchMedia('(max-width: 639px)').matches) {
      const lastId = window.localStorage.getItem(LAST_SESSION_STORAGE_KEY);
      const href = lastId ? `/assistente?id=${encodeURIComponent(lastId)}` : '/assistente';
      router.push(href);
      return;
    }
    setOpen((value) => !value);
  }, [router]);

  const fabTap = useIosTap(handleFabClick);

  if (shouldHideChatFab(pathname)) {
    return null;
  }

  return (
    <>
      <FloatingPortal>
        <button
          type="button"
          data-hide-in-embedded-app
          data-floating-action
          {...fabTap}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom)+60px)] right-4 z-50 flex h-14 w-14 touch-manipulation items-center justify-center rounded-full bg-[#00a884] text-white shadow-lg shadow-[#00000026] transition-all duration-200 ease-out hover:scale-105 active:scale-95 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
          aria-label={open ? 'Fechar chat' : 'Abrir chat'}
        >
          {open ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </FloatingPortal>

      {open ? (
        <FloatingPortal>
          <div
            data-hide-in-embedded-app
            className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom)+60px)] right-4 z-50 flex h-[70vh] w-[calc(100vw-2rem)] max-w-[380px] origin-bottom-right animate-in flex-col overflow-hidden rounded-2xl shadow-2xl duration-300 fade-in zoom-in-95 slide-in-from-bottom-4 sm:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:right-6"
          >
            <button
              type="button"
              onClick={() => {
                const lastId = window.localStorage.getItem(LAST_SESSION_STORAGE_KEY);
                router.push(lastId ? `/assistente?id=${encodeURIComponent(lastId)}` : '/assistente');
              }}
              className="absolute right-12 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
              aria-label="Abrir chat em tela cheia"
              title="Abrir em tela cheia"
            >
              <Maximize2 size={17} />
            </button>
            <ChatApp cityName={cityName} embedded />
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}

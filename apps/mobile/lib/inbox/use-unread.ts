import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

import { fetchUnreadCount } from './notifications-feed';

const POLL_INTERVAL_MS = 60_000;

// Emitter pra outras telas pedirem refresh imediato do badge
// (ex: tela de Avisos depois de marcar como lida).
const listeners = new Set<() => void>();
export function notifyUnreadChanged(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}

/**
 * Hook que mantém o contador de não-lidas. Atualiza via:
 *  - Realtime do Supabase (inserts/updates em notifications)
 *  - Poll de 60s (fallback se realtime não estiver habilitado)
 *  - App volta pra foreground
 *  - Emitter `notifyUnreadChanged()` chamado por outras telas
 */
export function useUnreadNotifications(): { count: number; refresh: () => Promise<void> } {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [count, setCount] = useState(0);
  const inflight = useRef(false);
  const requestSeq = useRef(0);

  const refresh = useCallback(async () => {
    const requestUserId = userId;
    const seq = ++requestSeq.current;
    if (!userId) {
      setCount(0);
      return;
    }
    if (inflight.current) return;
    inflight.current = true;
    try {
      const n = await fetchUnreadCount();
      if (requestUserId === userId && seq === requestSeq.current) {
        setCount(n);
      }
    } finally {
      inflight.current = false;
    }
  }, [userId]);

  useEffect(() => {
    requestSeq.current += 1;
    setCount(0);
    inflight.current = false;
  }, [userId]);

  // fetch inicial + polling de fallback
  useEffect(() => {
    void refresh();
    const id = setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // emitter de outras telas
  useEffect(() => {
    const fn = () => void refresh();
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, [refresh]);

  // Realtime — se a publication estiver habilitada no Supabase,
  // o badge atualiza instantâneo (sem polling). Senão, cai pro poll de 60s.
  // Nome único por instância pra permitir múltiplos consumidores do hook
  // (ex: tab Mensagens + tela InboxScreen) sem colidir.
  useEffect(() => {
    if (!userId) return;
    const channelName = `notifications:${userId}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_profile_id=eq.${userId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return { count, refresh };
}

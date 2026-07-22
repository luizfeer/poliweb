import * as Notifications from 'expo-notifications';
import { useEffect, useRef, type ReactNode } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { notifyUnreadChanged } from '@/lib/inbox/use-unread';
import { smartNavigate } from '@/lib/navigation/smart-route';

import { registerForPush, syncPushTokenWithBackend } from './notifications';

/**
 * Bootstraps push notifications:
 * - Requests permission once the user has a session (avoids prompts on the splash).
 * - Sends the Expo push token to the web app to be persisted in Supabase.
 * - Handles deep links from notification taps.
 */
export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) return;
    let cancelled = false;

    (async () => {
      const result = await registerForPush();
      if (cancelled || !result.ok) return;
      tokenRef.current = result.token;
      await syncPushTokenWithBackend(result.token, session.access_token);
    })();

    return () => {
      cancelled = true;
    };
  }, [session, loading]);

  useEffect(() => {
    // Notif chega com app aberto → atualiza badge na hora
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      notifyUnreadChanged();
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        url?: string;
        route?: string;
        target_url?: string;
      };
      // Ordem de prioridade: route (rota nativa explícita) → target_url (do servidor) → url (legado)
      const href =
        (typeof data?.route === 'string' && data.route) ||
        (typeof data?.target_url === 'string' && data.target_url) ||
        (typeof data?.url === 'string' && data.url) ||
        null;
      if (href) smartNavigate(href);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return <>{children}</>;
}

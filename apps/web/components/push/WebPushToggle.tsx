'use client';

import { useEffect, useState } from 'react';

import {
  getCurrentSubscription,
  isWebPushSupported,
  subscribeWebPush,
  subscriptionToPayload,
  unsubscribeWebPush,
} from '@/lib/push/web-push-client';

type Props = {
  vapidPublicKey: string | null;
  cityId?: string | null;
};

export function WebPushToggle({ vapidPublicKey, cityId }: Props) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isWebPushSupported());
    void getCurrentSubscription().then((s) => setSubscribed(Boolean(s)));
  }, []);

  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        Este navegador não suporta notificações push.
      </p>
    );
  }

  if (!vapidPublicKey) {
    return (
      <p className="text-sm text-muted-foreground">
        Notificações web ainda não configuradas (VAPID ausente).
      </p>
    );
  }

  async function handleToggle() {
    setError(null);
    setLoading(true);
    try {
      if (subscribed) {
        const sub = await getCurrentSubscription();
        if (sub) {
          await fetch(
            `/api/push/web/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`,
            { method: 'DELETE' },
          );
        }
        await unsubscribeWebPush();
        setSubscribed(false);
      } else {
        const sub = await subscribeWebPush(vapidPublicKey!);
        const body = subscriptionToPayload(sub);
        const res = await fetch('/api/push/web/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...body,
            userAgent: navigator.userAgent.slice(0, 200),
            cityId: cityId ?? null,
          }),
        });
        if (!res.ok) throw new Error('falha ao registrar');
        setSubscribed(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
      >
        {loading ? 'Aguarde…' : subscribed ? 'Desativar neste navegador' : 'Ativar neste navegador'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

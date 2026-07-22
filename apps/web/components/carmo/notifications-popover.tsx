'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, BellOff, BellRing, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavNotification } from './global-nav-client';
import {
  getCurrentSubscription,
  isWebPushSupported,
  subscribeWebPush,
  subscriptionToPayload,
} from '@/lib/push/web-push-client';

type NotificationsPopoverProps = {
  unreadCount: number;
  notifications: NavNotification[];
  isAuthenticated: boolean;
  vapidPublicKey: string | null;
  cityId: string | null;
};

type PushCtaState = 'hidden' | 'available' | 'loading' | 'granted' | 'denied' | 'error';

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(1, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'agora';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `há ${diffD}d`;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(iso));
}

export function NotificationsPopover({
  unreadCount,
  notifications,
  isAuthenticated,
  vapidPublicKey,
  cityId,
}: NotificationsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [pushCta, setPushCta] = useState<PushCtaState>('hidden');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !isAuthenticated || !vapidPublicKey) {
      return;
    }
    if (!isWebPushSupported()) {
      setPushCta('hidden');
      return;
    }
    const perm = Notification.permission;
    if (perm === 'denied') {
      setPushCta('denied');
      return;
    }
    void getCurrentSubscription().then((sub) => {
      if (sub) {
        setPushCta('granted');
      } else {
        setPushCta('available');
      }
    });
  }, [open, isAuthenticated, vapidPublicKey]);

  async function handleEnablePush() {
    if (!vapidPublicKey) return;
    setPushCta('loading');
    try {
      const sub = await subscribeWebPush(vapidPublicKey);
      const body = subscriptionToPayload(sub);
      const res = await fetch('/api/push/web/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          userAgent: navigator.userAgent.slice(0, 200),
          cityId,
        }),
      });
      if (!res.ok) throw new Error('persist_failed');
      setPushCta('granted');
    } catch (err) {
      if (err instanceof Error && err.message.includes('Permissão')) {
        setPushCta('denied');
      } else {
        setPushCta('error');
      }
    }
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Not authenticated → behave as a link to /entrar
  if (!isAuthenticated) {
    return (
      <Link
        href="/entrar"
        aria-label="Entrar para ver notificações"
        className="relative flex size-10 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900 hover:no-underline"
      >
        <Bell size={18} strokeWidth={1.8} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notificações — ${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
            : 'Notificações'
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex size-10 items-center justify-center rounded-full transition-colors',
          open
            ? '!bg-white !text-ink-900 hover:!bg-white hover:!text-ink-900'
            : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
        )}
      >
        <Bell size={18} strokeWidth={1.8} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-clay-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_18px_48px_rgba(25,25,25,0.16)]"
        >
          <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <div>
              <h2 className="text-[14px] font-semibold leading-tight text-ink-900">Notificações</h2>
              <p className="text-[12px] text-ink-500">
                {unreadCount > 0
                  ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
                  : 'Tudo em dia'}
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-clay-500 px-2 text-[11px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </header>

          {pushCta !== 'hidden' && pushCta !== 'granted' && (
            <div className="border-b border-ink-100 bg-clay-50/50 px-4 py-3">
              {pushCta === 'denied' ? (
                <p className="text-[12px] leading-snug text-ink-600">
                  Notificações bloqueadas neste navegador. Libere nas configurações do site
                  para receber alertas.
                </p>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-clay-100 text-clay-700">
                    <BellRing size={16} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold leading-snug text-ink-900">
                      Receber avisos neste navegador
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-ink-600">
                      Alertas em tempo real, mesmo com a aba fechada.
                    </p>
                    {pushCta === 'error' && (
                      <p className="mt-1 text-[11px] font-medium text-red-600">
                        Não foi possível ativar. Tente novamente.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      disabled={pushCta === 'loading'}
                      className="mt-2 inline-flex items-center justify-center rounded-md bg-clay-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-clay-700 disabled:opacity-60"
                    >
                      {pushCta === 'loading' ? 'Ativando…' : 'Ativar notificações'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-ink-50 text-ink-400">
                <BellOff size={20} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <p className="text-[13px] font-medium text-ink-700">Nenhuma notificação nova</p>
              <p className="text-[12px] text-ink-500">Você está em dia. Volte mais tarde.</p>
            </div>
          ) : (
            <ul className="max-h-[400px] overflow-y-auto divide-y divide-ink-100">
              {notifications.map((notif) => {
                const isRead = Boolean(notif.readAt);
                const isHighPriority =
                  notif.priority === 'high' || notif.priority === 'urgent';
                return (
                  <li key={notif.id}>
                    <Link
                      href={notif.targetUrl}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex gap-3 px-4 py-3 transition-colors hover:bg-clay-50/60 hover:no-underline',
                        !isRead && 'bg-clay-50/30',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1.5 size-2 shrink-0 rounded-full',
                          isRead
                            ? 'bg-transparent'
                            : isHighPriority
                              ? 'bg-clay-500'
                              : 'bg-sky-500',
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'line-clamp-2 text-[13px] leading-snug text-ink-900',
                            isRead ? 'font-medium text-ink-700' : 'font-semibold',
                          )}
                        >
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-600">
                            {notif.body}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] font-medium text-ink-500">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <footer className="border-t border-ink-100 bg-paper-deep/40">
            <Link
              href="/painel/notificacoes"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 px-4 py-3 text-[13px] font-semibold text-clay-700 hover:bg-clay-50 hover:no-underline"
            >
              Ver todas as notificações
              <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </footer>
        </div>
      )}
    </div>
  );
}

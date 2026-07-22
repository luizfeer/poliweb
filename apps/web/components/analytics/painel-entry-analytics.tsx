'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { himetricaTrack } from '@/lib/analytics/himetrica';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';

export function PainelEntryAnalytics() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith('/painel')) return;

    const cadastro = searchParams.get('cadastro');
    const login = searchParams.get('login');
    if (cadastro !== 'ok' && login !== 'ok') return;

    if (cadastro === 'ok') {
      himetricaTrack(HI_METRICA_EVENTS.signup_completed, { method: 'email' });
    }
    if (login === 'ok') {
      himetricaTrack(HI_METRICA_EVENTS.login_completed, { method: 'password' });
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete('cadastro');
    next.delete('login');
    const qs = next.toString();
    window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

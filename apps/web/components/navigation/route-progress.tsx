'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, startTransition } from 'react';

const TRICKLE_STEP_MS = 200;
const FINISH_MS = 260;

function isInternalNavigation(target: HTMLAnchorElement, event: MouseEvent): boolean {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (target.target && target.target !== '_self') return false;
  if (target.hasAttribute('download')) return false;

  const href = target.getAttribute('href');
  if (!href) return false;
  if (href.startsWith('#')) return false;
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;

  try {
    const url = new URL(target.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest('a');
      if (!(target instanceof HTMLAnchorElement)) return;
      if (!isInternalNavigation(target, event)) return;

      if (finishTimer.current) {
        clearTimeout(finishTimer.current);
        finishTimer.current = null;
      }
      setActive(true);
      setProgress(18);
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  useEffect(() => {
    if (!active) return;
    startTransition(() => {
      setProgress(100);
    });
    finishTimer.current = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, FINISH_MS);
    return () => {
      if (finishTimer.current) clearTimeout(finishTimer.current);
    };
    // pathname changes signal navigation completion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!active) return;
    if (progress >= 90) return;
    const t = setTimeout(() => {
      setProgress((p) => Math.min(p + Math.random() * 14 + 4, 90));
    }, TRICKLE_STEP_MS);
    return () => clearTimeout(t);
  }, [active, progress]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[5px]"
    >
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-[var(--carmo-ink-900)] via-[var(--carmo-ink-700)] to-[var(--carmo-cerrado-500)] shadow-[0_0_10px_rgba(60,107,54,0.55)] transition-[width,opacity]"
        style={{
          width: `${progress}%`,
          opacity: active ? 1 : 0,
          transitionDuration: active ? '220ms' : '320ms',
          transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />
    </div>
  );
}

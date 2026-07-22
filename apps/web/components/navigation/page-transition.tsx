'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Aplica stagger nos filhos diretos (até ~8 itens). */
  stagger?: boolean;
  className?: string;
  embeddedApp?: boolean;
};

export function PageTransition({ children, stagger = false, className, embeddedApp = false }: Props) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embeddedApp) return;
    const el = ref.current;
    if (!el) return;
    el.classList.remove('page-enter');
    void el.offsetWidth;
    el.classList.add('page-enter');
  }, [pathname, embeddedApp]);

  if (embeddedApp) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={
        (stagger ? 'page-enter page-enter-stagger ' : 'page-enter ') + (className ?? '')
      }
    >
      {children}
    </div>
  );
}

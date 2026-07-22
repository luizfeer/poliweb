'use client';

import NextLink, { useLinkStatus } from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
  type TouchEvent,
} from 'react';

type Props = ComponentProps<typeof NextLink>;

const LinkPendingContext = createContext(false);

export function useLinkPending() {
  return useContext(LinkPendingContext);
}

function PendingProvider({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <LinkPendingContext.Provider value={pending}>{children}</LinkPendingContext.Provider>
  );
}

export function Link({ children, href, onTouchStart, prefetch, ...rest }: Props) {
  const router = useRouter();

  const handleTouchStart = (event: TouchEvent<HTMLAnchorElement>) => {
    if (typeof href === 'string' && href.startsWith('/')) {
      try {
        router.prefetch(href);
      } catch {
        // prefetch is best-effort
      }
    }
    onTouchStart?.(event);
  };

  return (
    <NextLink
      {...rest}
      href={href}
      prefetch={prefetch}
      onTouchStart={handleTouchStart}
    >
      <PendingProvider>{children}</PendingProvider>
    </NextLink>
  );
}

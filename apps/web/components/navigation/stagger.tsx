import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
};

/**
 * Aplica entrada com stagger nos filhos diretos (cards de lista, grid).
 * É um wrapper puramente CSS — funciona em Server Components.
 */
export function Stagger<T extends ElementType = 'div'>({
  as,
  children,
  className,
}: Props<T>) {
  const Comp = (as ?? 'div') as ElementType;
  return <Comp className={cn('stagger-rise', className)}>{children}</Comp>;
}

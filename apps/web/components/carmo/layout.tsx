import { cn } from '@/lib/utils';

type BandProps = {
  children: React.ReactNode;
  variant?: 'paper' | 'paper-deep' | 'paper-card';
  className?: string;
  id?: string;
};

/** Faixa de seção com background variável — usada para separar blocos densos. */
export function Band({ children, variant = 'paper', className, id }: BandProps) {
  const bg =
    variant === 'paper-card' ? 'bg-white'
    : variant === 'paper-deep' ? 'bg-paper-deep'
    : 'bg-paper';
  return (
    <section id={id} className={cn(bg, className)}>
      {children}
    </section>
  );
}

/** Divisor horizontal de 8px usado entre blocos no app mobile. */
export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-2 bg-paper', className)} />;
}

type AppFrameProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Container de app mobile centralizado. O respiro inferior evita que a nav fixa cubra conteúdo.
 */
export function AppFrame({ children, className }: AppFrameProps) {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[var(--app-max-w)] min-h-svh bg-paper pb-[72px] pb-mobile-tab-bar',
        'lg:border-x lg:border-ink-200/70 lg:shadow-[0_0_30px_rgba(25,25,25,0.06)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Carrossel horizontal com scroll-snap e padding lateral 16px. */
export function HScroll({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex gap-3 overflow-x-auto no-scrollbar px-3.5 pb-2 snap-x snap-mandatory',
        'md:px-6 lg:px-8 lg:gap-4',
        className,
      )}
      style={{ scrollPaddingLeft: 14 }}
    >
      {children}
    </div>
  );
}

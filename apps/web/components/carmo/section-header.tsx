import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type SectionHeaderProps = {
  title: string;
  kicker?: string;
  action?: { label: string; href: string };
  className?: string;
};

/**
 * Cabeçalho de seção: kicker pequeno em laranja (opcional) + título Inter 800.
 * Action à direita vira link azul-cidadania com chevron.
 */
export function SectionHeader({ title, kicker, action, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'px-4 pt-4 pb-2 flex items-baseline justify-between gap-2',
        'md:px-6 lg:px-8 lg:pt-5',
        className,
      )}
    >
      <div className="min-w-0">
        {kicker && (
          <div className="text-[11px] font-bold tracking-[0.04em] uppercase text-clay-600 mb-0.5">
            {kicker}
          </div>
        )}
        <h2 className="m-0 font-sans font-extrabold text-[18px] tracking-[-0.01em] text-ink-900 truncate">
          {title}
        </h2>
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-[13px] font-medium text-sky-700 hover:underline flex items-center gap-0.5 shrink-0"
        >
          {action.label}
          <ChevronRight size={14} strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
}

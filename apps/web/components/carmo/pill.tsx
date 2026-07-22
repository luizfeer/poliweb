import * as React from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type PillProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  label: string;
  chevron?: boolean;
  active?: boolean;
  /** Use no header laranja (chapado). Por padrão é "filter" (fundo branco com borda). */
  variant?: 'header' | 'filter';
};

/**
 * Pill — chip arredondado clicável.
 * - `variant="header"`: fundo branco semi-transparente sobre o header clay
 * - `variant="filter"` (default): fundo branco com borda; ativo usa tint clay-50 + borda clay-500
 */
export function Pill({
  icon: Icon,
  label,
  chevron,
  active = false,
  variant = 'filter',
  className,
  ...props
}: PillProps) {
  if (variant === 'header') {
    return (
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors',
          'bg-white/95 text-ink-900 hover:bg-white',
          active && 'border-[1.5px] border-ink-900',
          className,
        )}
        {...props}
      >
        {Icon && <Icon size={14} strokeWidth={2.2} />}
        <span>{label}</span>
        {chevron && <ChevronDown size={14} strokeWidth={2.5} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors',
        'border-[1.5px]',
        active
          ? 'bg-clay-50 text-clay-600 border-clay-500'
          : 'bg-white text-ink-900 border-ink-200 hover:border-ink-300',
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={14} strokeWidth={2.2} />}
      <span>{label}</span>
      {chevron && <ChevronDown size={14} strokeWidth={2.5} />}
    </button>
  );
}

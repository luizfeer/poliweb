import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ListItemProps = {
  icon: LucideIcon;
  title: string;
  /** Sub-texto cinza (ex: endereço, categoria). */
  sub?: string;
  /** Quando definido, vira destaque clay (ex: "Coleta hoje"). Não usar junto com `sub`. */
  when?: string;
  iconBg?: 'paper' | 'clay-50' | 'cerrado-100' | 'sky-100' | 'sun-100';
  iconFg?: 'ink-900' | 'clay-600' | 'cerrado-700' | 'sky-700';
  divider?: boolean;
  href?: string;
  className?: string;
};

const ICON_BG: Record<NonNullable<ListItemProps['iconBg']>, string> = {
  paper: 'bg-paper',
  'clay-50': 'bg-clay-50',
  'cerrado-100': 'bg-cerrado-100',
  'sky-100': 'bg-sky-100',
  'sun-100': 'bg-sun-100',
};

const ICON_FG: Record<NonNullable<ListItemProps['iconFg']>, string> = {
  'ink-900': 'text-ink-900',
  'clay-600': 'text-clay-600',
  'cerrado-700': 'text-cerrado-700',
  'sky-700': 'text-sky-700',
};

/**
 * Linha compacta de lista — usado em Serviços públicos, Telefones úteis, Achados.
 * Quadrado de ícone à esquerda + título e subtítulo + chevron.
 */
export function ListItem({
  icon: Icon,
  title,
  sub,
  when,
  iconBg = 'paper',
  iconFg = 'ink-900',
  divider = true,
  href,
  className,
}: ListItemProps) {
  const inner = (
    <div
      className={cn(
        'flex items-center gap-3 px-3.5 py-3 bg-white',
        divider && 'border-b border-ink-100',
        className,
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-md flex items-center justify-center shrink-0',
          ICON_BG[iconBg],
          ICON_FG[iconFg],
        )}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-ink-900 leading-snug">{title}</div>
        {when ? (
          <div className="text-[12px] text-clay-600 font-semibold mt-0.5">{when}</div>
        ) : sub ? (
          <div className="text-[12px] text-ink-600 leading-snug mt-0.5">{sub}</div>
        ) : null}
      </div>
      <ChevronRight size={18} strokeWidth={2} className="text-ink-400 shrink-0" />
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

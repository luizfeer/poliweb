import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type RoundCatProps = {
  label: string;
  /** Ícone Lucide (preferido) ou emoji/texto curto (fallback). */
  icon?: LucideIcon;
  illo?: string;
  href?: string;
  bg?: 'clay' | 'cerrado' | 'sun' | 'sky' | 'paper-deep';
  className?: string;
};

const BG: Record<NonNullable<RoundCatProps['bg']>, { bg: string; fg: string }> = {
  clay:        { bg: 'bg-clay-500', fg: 'text-white' },
  cerrado:     { bg: 'bg-cerrado-500', fg: 'text-white' },
  sun:         { bg: 'bg-sun-300', fg: 'text-ink-900' },
  sky:         { bg: 'bg-sky-700', fg: 'text-white' },
  'paper-deep':{ bg: 'bg-paper-deep', fg: 'text-ink-900' },
};

/**
 * Categoria circular grande (76px). Padrão grid de 5 colunas no mobile.
 * Use ícone Lucide. `illo` é fallback para emoji em prototipagem.
 */
export function RoundCat({ label, icon: Icon, illo, href, bg = 'clay', className }: RoundCatProps) {
  const { bg: bgCls, fg: fgCls } = BG[bg];

  const Inner = (
    <div className={cn('flex flex-col items-center gap-1.5 w-[76px] shrink-0', className)}>
      <div
        className={cn(
          'w-[70px] h-[70px] rounded-full flex items-center justify-center',
          bgCls,
          fgCls,
        )}
      >
        {Icon ? (
          <Icon size={30} strokeWidth={2.2} />
        ) : (
          <span className="text-[30px] leading-none font-extrabold">{illo}</span>
        )}
      </div>
      <span className="text-[12px] leading-tight text-ink-900 text-center font-medium px-0.5">
        {label}
      </span>
    </div>
  );

  return href ? (
    <Link href={href} className="shrink-0">
      {Inner}
    </Link>
  ) : (
    Inner
  );
}

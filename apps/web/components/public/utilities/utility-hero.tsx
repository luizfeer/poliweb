import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type UtilityHeroTone = 'clay' | 'cerrado' | 'sky' | 'ink' | 'sun' | 'white';

const toneClasses: Record<
  UtilityHeroTone,
  {
    shell: string;
    kicker: string;
    title: string;
    description: string;
    icon: string;
    stat: string;
  }
> = {
  clay: {
    shell: 'border-clay-200 bg-clay-50 text-clay-950',
    kicker: 'text-clay-700',
    title: 'text-clay-950',
    description: 'text-ink-700',
    icon: 'text-clay-700/10',
    stat: 'text-clay-700',
  },
  cerrado: {
    shell: 'border-cerrado-700/20 bg-cerrado-700 text-white',
    kicker: 'text-cerrado-100',
    title: 'text-white',
    description: 'text-cerrado-50',
    icon: 'text-white/10',
    stat: 'text-cerrado-100',
  },
  sky: {
    shell: 'border-sky-200 bg-sky-50 text-sky-950',
    kicker: 'text-sky-700',
    title: 'text-sky-950',
    description: 'text-ink-700',
    icon: 'text-sky-900/10',
    stat: 'text-sky-700',
  },
  ink: {
    shell: 'border-ink-100 bg-ink-900 text-white',
    kicker: 'text-sun-100',
    title: 'text-white',
    description: 'text-white/82',
    icon: 'text-white/10',
    stat: 'text-sun-100',
  },
  sun: {
    shell: 'border-sun-100 bg-sun-100 text-ink-900',
    kicker: 'text-clay-700',
    title: 'text-ink-900',
    description: 'text-ink-700',
    icon: 'text-clay-700/10',
    stat: 'text-clay-700',
  },
  white: {
    shell: 'border-ink-100 bg-white text-ink-900',
    kicker: 'text-clay-700',
    title: 'text-ink-900',
    description: 'text-ink-700',
    icon: 'text-clay-700/10',
    stat: 'text-clay-700',
  },
};

export function UtilityHero({
  icon: Icon,
  kicker,
  title,
  description,
  stat,
  tone = 'white',
  children,
  footer,
}: {
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
  stat?: string;
  tone?: UtilityHeroTone;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const classes = toneClasses[tone];

  return (
    <section
      className={cn('shadow-card relative overflow-hidden rounded-2xl border', classes.shell)}
    >
      <Icon
        className={cn('pointer-events-none absolute -bottom-10 -right-8 h-44 w-44', classes.icon)}
        aria-hidden="true"
      />
      <div className="relative grid gap-5 p-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.38fr)] md:p-6 lg:p-8">
        <div className="min-w-0">
          <p
            className={cn(
              'm-0 flex items-center gap-1.5 text-[12px] font-bold uppercase',
              classes.kicker,
            )}
          >
            <Icon size={15} aria-hidden="true" />
            {kicker}
          </p>
          <h1
            className={cn(
              'font-display m-0 mt-3 max-w-3xl text-[32px] font-extrabold leading-none md:text-[46px]',
              classes.title,
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              'm-0 mt-3 max-w-3xl text-[15px] font-medium leading-relaxed md:text-[17px]',
              classes.description,
            )}
          >
            {description}
          </p>
          {stat ? (
            <p className={cn('m-0 mt-3 text-[13px] font-bold', classes.stat)}>{stat}</p>
          ) : null}
        </div>
        {children ? <div className="relative z-10 grid gap-2 self-start">{children}</div> : null}
      </div>
      {footer ? (
        <div className="bg-white/12 relative border-t border-black/10 p-4 md:px-6">{footer}</div>
      ) : null}
    </section>
  );
}

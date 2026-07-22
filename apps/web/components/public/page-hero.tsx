import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Band } from '@/components/carmo';
import { cn } from '@/lib/utils';

type PublicHeroTone = 'green' | 'clay' | 'sky' | 'sun' | 'paper' | 'ink';

const tones: Record<
  PublicHeroTone,
  {
    shell: string;
    kicker: string;
    title: string;
    body: string;
    icon: string;
  }
> = {
  green: {
    shell: 'border-cerrado-100 bg-cerrado-100/65',
    kicker: 'text-cerrado-700',
    title: 'text-cerrado-700',
    body: 'text-ink-700',
    icon: 'text-cerrado-700/10',
  },
  clay: {
    shell: 'border-clay-200 bg-clay-50',
    kicker: 'text-clay-700',
    title: 'text-clay-950',
    body: 'text-ink-700',
    icon: 'text-clay-700/10',
  },
  sky: {
    shell: 'border-sky-200 bg-sky-50',
    kicker: 'text-sky-700',
    title: 'text-sky-950',
    body: 'text-ink-700',
    icon: 'text-sky-900/10',
  },
  sun: {
    shell: 'border-sun-100 bg-sun-100',
    kicker: 'text-clay-700',
    title: 'text-ink-900',
    body: 'text-ink-700',
    icon: 'text-clay-700/10',
  },
  paper: {
    shell: 'border-ink-100 bg-white',
    kicker: 'text-clay-700',
    title: 'text-ink-900',
    body: 'text-ink-700',
    icon: 'text-clay-700/10',
  },
  ink: {
    shell: 'border-ink-900 bg-ink-900',
    kicker: 'text-sun-100',
    title: 'text-white',
    body: 'text-white/82',
    icon: 'text-white/10',
  },
};

export function PublicHero({
  icon: Icon,
  kicker,
  title,
  description,
  tone = 'paper',
  action,
  meta,
}: {
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
  tone?: PublicHeroTone;
  action?: ReactNode;
  meta?: ReactNode;
}) {
  const styles = tones[tone];

  return (
    <Band className="px-3.5 py-4 md:px-6 lg:px-8">
      <section
        className={cn(
          'shadow-card relative overflow-hidden rounded-2xl border p-4 md:p-6',
          styles.shell,
        )}
      >
        <Icon
          className={cn(
            'pointer-events-none absolute -bottom-10 -right-8 h-40 w-40 md:h-48 md:w-48',
            styles.icon,
          )}
          aria-hidden="true"
        />
        <div className="relative grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0">
            <p
              className={cn(
                'm-0 flex items-center gap-1.5 text-[12px] font-bold uppercase',
                styles.kicker,
              )}
            >
              <Icon size={15} aria-hidden="true" />
              {kicker}
            </p>
            <h1
              className={cn(
                'font-display m-0 mt-2 max-w-3xl text-[32px] font-extrabold leading-none md:text-[44px]',
                styles.title,
              )}
            >
              {title}
            </h1>
            <p
              className={cn(
                'm-0 mt-3 max-w-2xl text-[14px] font-medium leading-relaxed md:text-[16px]',
                styles.body,
              )}
            >
              {description}
            </p>
            {meta ? <div className="mt-4 flex flex-wrap gap-2">{meta}</div> : null}
          </div>
          {action ? (
            <div className="relative z-10 flex flex-wrap gap-2 md:justify-end">{action}</div>
          ) : null}
        </div>
      </section>
    </Band>
  );
}

export function PublicHeroPill({
  children,
  icon: Icon,
  tone = 'paper',
}: {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: PublicHeroTone;
}) {
  const styles = tones[tone];
  return (
    <span
      className={cn(
        'bg-white/82 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-extrabold',
        styles.kicker,
      )}
    >
      {Icon ? <Icon size={13} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

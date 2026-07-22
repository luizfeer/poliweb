import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyCtaProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  href: string;
  tone?: 'cerrado' | 'clay' | 'sky' | 'sun';
  className?: string;
};

const TONE: Record<NonNullable<EmptyCtaProps['tone']>, { bg: string; fg: string; ring: string }> = {
  cerrado: { bg: 'bg-cerrado-100', fg: 'text-cerrado-700', ring: 'ring-cerrado-200' },
  clay: { bg: 'bg-clay-100', fg: 'text-clay-700', ring: 'ring-clay-200' },
  sky: { bg: 'bg-sky-100', fg: 'text-sky-700', ring: 'ring-sky-200' },
  sun: { bg: 'bg-sun-100', fg: 'text-ink-900', ring: 'ring-sun-200' },
};

export function EmptyCta({
  icon: Icon,
  title,
  description,
  cta,
  href,
  tone = 'cerrado',
  className,
}: EmptyCtaProps) {
  const t = TONE[tone];
  return (
    <Link
      href={href}
      className={cn(
        'shadow-card border-ink-100 rounded-xs flex items-start gap-3 border border-dashed bg-white px-3.5 py-3 hover:no-underline',
        className,
      )}
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md', t.bg, t.fg)}>
        <Icon size={20} strokeWidth={2.1} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-ink-900 m-0 text-[14px] font-extrabold leading-tight">{title}</div>
        <p className="text-ink-600 m-0 mt-0.5 text-[12px] leading-snug">{description}</p>
        <span className={cn('mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold', t.fg)}>
          {cta} <ArrowRight size={12} aria-hidden />
        </span>
      </div>
    </Link>
  );
}

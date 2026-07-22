import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/components/navigation/link';
import { SectionHeader } from '@/components/carmo';
import { cn } from '@/lib/utils';
import type { FeaturedPromoGridConfig, FeaturedPromoTone } from '@/lib/home';

type Props = { config: FeaturedPromoGridConfig; title: string | null };

const TONE: Record<FeaturedPromoTone, { bg: string; badge: string; arrow: string }> = {
  cerrado: { bg: 'bg-cerrado-700', badge: 'bg-sun-300 text-ink-900', arrow: 'text-cerrado-700' },
  sky:     { bg: 'bg-sky-700',     badge: 'bg-sun-300 text-ink-900', arrow: 'text-sky-700' },
  clay:    { bg: 'bg-clay-600',    badge: 'bg-sun-300 text-ink-900', arrow: 'text-clay-600' },
  sun:     { bg: 'bg-sun-300',     badge: 'bg-ink-900 text-white',   arrow: 'text-ink-900' },
};

const TONE_CYCLE: FeaturedPromoTone[] = ['cerrado', 'sky', 'clay', 'sun'];

export function FeaturedPromoGridBlock({ config, title }: Props) {
  const items = config.items ?? [];
  if (items.length === 0) return null;
  const columns = config.columns ?? 3;
  const gridCols = columns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3';
  const isSunTone = (t: FeaturedPromoTone) => t === 'sun';

  return (
    <>
      {title ? <SectionHeader title={title} /> : null}
      <div
        className={cn(
          'flex gap-3 overflow-x-auto no-scrollbar px-3.5 pb-2 snap-x snap-mandatory',
          'md:px-6 lg:px-8 lg:gap-4',
          'lg:grid lg:overflow-visible lg:snap-none',
          gridCols,
        )}
      >
        {items.map((item, index) => {
          const tone = item.tone ?? TONE_CYCLE[index % TONE_CYCLE.length]!;
          const { bg, badge, arrow } = TONE[tone];
          const textColor = isSunTone(tone) ? 'text-ink-900' : 'text-white';
          const subtitleColor = isSunTone(tone) ? 'text-ink-700' : 'text-white/85';

          return (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              className={cn(
                'group relative shrink-0 snap-start overflow-hidden rounded-2xl',
                'w-[85%] min-w-[280px] sm:w-[420px] lg:w-auto',
                'aspect-[16/7] lg:aspect-[16/8]',
                bg,
                'hover:no-underline',
              )}
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width:1024px) 33vw, 85vw"
                  className="absolute inset-0 object-cover opacity-30 lg:opacity-25"
                  aria-hidden
                />
              ) : null}

              <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col gap-2">
                  {item.badge ? (
                    <span
                      className={cn(
                        'w-fit rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em]',
                        badge,
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                  <h3
                    className={cn(
                      'font-serif text-[22px] leading-[1.05] sm:text-[26px] lg:text-[30px]',
                      'font-extrabold tracking-[-0.01em]',
                      textColor,
                    )}
                  >
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-end justify-between gap-3">
                  {item.subtitle ? (
                    <p className={cn('max-w-[75%] text-[12px] leading-snug sm:text-[13px]', subtitleColor)}>
                      {item.subtitle}
                    </p>
                  ) : <span />}
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition group-hover:translate-x-0.5',
                      arrow,
                    )}
                    aria-hidden
                  >
                    <ArrowRight size={18} strokeWidth={2.4} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

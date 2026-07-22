import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Fragment } from 'react';
import { Link } from '@/components/navigation/link';
import { cn } from '@/lib/utils';
import type { HeroCompositeConfig, HeroCompositeCtaTone } from '@/lib/home';
import { getIcon } from '../icon-map';
import { loadHeroCompositeQuickSlots, type HeroCompositeQuickSlot } from './hero-composite-quick';

type Props = { config: HeroCompositeConfig; cityId: string; modules: string[] };

type QuickTone = HeroCompositeQuickSlot['tone'];

const CTA_TONE: Record<HeroCompositeCtaTone, { bg: string; btn: string; btnText: string }> = {
  clay:    { bg: 'bg-clay-500',    btn: 'bg-white',   btnText: 'text-clay-700' },
  cerrado: { bg: 'bg-cerrado-700', btn: 'bg-white',   btnText: 'text-cerrado-700' },
  sky:     { bg: 'bg-sky-700',     btn: 'bg-white',   btnText: 'text-sky-700' },
  ink:     { bg: 'bg-ink-900',     btn: 'bg-sun-300', btnText: 'text-ink-900' },
};

const QUICK_TONE: Record<QuickTone, { iconBg: string; iconFg: string }> = {
  cerrado:      { iconBg: 'bg-cerrado-100', iconFg: 'text-cerrado-700' },
  clay:         { iconBg: 'bg-clay-50',     iconFg: 'text-clay-600' },
  sky:          { iconBg: 'bg-sky-100',     iconFg: 'text-sky-700' },
  sun:          { iconBg: 'bg-sun-100',     iconFg: 'text-ink-900' },
  'paper-deep': { iconBg: 'bg-paper-deep',  iconFg: 'text-ink-900' },
};

/** Renderiza headline com trechos `*assim*` em itálico + cor sun. */
function HeadlineWithHighlights({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = /^\*([^*]+)\*$/.exec(part);
        if (m) {
          return (
            <em key={i} className="font-serif italic text-sun-300">
              {m[1]}
            </em>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export async function HeroCompositeBlock({ config, cityId, modules }: Props) {
  const { hero, cta } = config;
  const ctaTone = CTA_TONE[cta.tone ?? 'clay'];
  const quick = await loadHeroCompositeQuickSlots(cityId, modules);

  return (
    <div className="hidden px-4 md:px-6 lg:block lg:px-8">
      <div className="grid items-stretch gap-4 lg:grid-cols-3 lg:gap-5">
        {/* HERO — esquerda, 2/3 */}
        <div className="relative col-span-2 flex h-full min-h-[560px] overflow-hidden rounded-2xl bg-ink-900 text-white">
          {hero.imageUrl ? (
            <Image
              src={hero.imageUrl}
              alt={hero.imageAlt ?? ''}
              fill
              priority
              sizes="(min-width:1024px) 66vw, 100vw"
              className="absolute inset-0 object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900/85 via-ink-900/55 to-ink-900/20" />

          <div className="relative z-10 flex h-full min-h-[560px] w-full flex-col justify-between p-6 lg:p-8">
            {hero.kicker ? (
              <span className="flex w-fit shrink-0 items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-white backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-sun-300" />
                {hero.kicker}
              </span>
            ) : (
              <span />
            )}

            <div className="flex flex-col gap-5">
              <h2 className="max-w-[14ch] font-serif text-[44px] font-extrabold leading-[1.02] tracking-[-0.015em] lg:text-[56px]">
                <HeadlineWithHighlights text={hero.headline} />
              </h2>

              <div className="flex flex-wrap items-end justify-between gap-4">
                {hero.subtitle ? (
                  <p className="max-w-[44ch] text-[14px] leading-snug text-white/85 lg:text-[15px]">
                    {hero.subtitle}
                  </p>
                ) : (
                  <span />
                )}

                {hero.actions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {hero.actions.map((action, i) => {
                      const Icon = action.icon ? getIcon(action.icon) : null;
                      return (
                        <Link
                          key={`${action.href}-${i}`}
                          href={action.href}
                          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 hover:no-underline"
                        >
                          {Icon ? <Icon size={15} strokeWidth={2.2} /> : null}
                          {action.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="col-span-1 flex flex-col gap-4">
          {/* CTA */}
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl p-5 text-white lg:p-6',
              ctaTone.bg,
            )}
          >
            <div
              aria-hidden
              className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10"
            />
            <div className="relative z-10 flex flex-col gap-3">
              {cta.badge ? (
                <span className="w-fit rounded-md bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-ink-900">
                  {cta.badge}
                </span>
              ) : null}
              <h3 className="font-serif text-[26px] font-extrabold leading-[1.05] tracking-[-0.01em] lg:text-[30px]">
                {cta.headline}
              </h3>
              {cta.description ? (
                <p className="text-[13px] leading-snug text-white/90 lg:text-[14px]">
                  {cta.description}
                </p>
              ) : null}
              <Link
                href={cta.ctaHref}
                className={cn(
                  'mt-1 flex w-fit items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-bold shadow-sm hover:no-underline',
                  ctaTone.btn,
                  ctaTone.btnText,
                )}
              >
                {cta.ctaLabel}
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              {cta.footerNote ? (
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-white/80">
                  <span className="inline-block h-1 w-1 rounded-full bg-white/60" />
                  {cta.footerNote}
                </p>
              ) : null}
            </div>
          </div>

          {/* QUICK GRID 2x2 */}
          {quick.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-ink-200/60 bg-white p-2">
              {quick.slice(0, 4).map((item, i) => {
                const tone = QUICK_TONE[item.tone ?? 'paper-deep'];
                const Icon = item.icon ? getIcon(item.icon) : null;
                const className =
                  'flex flex-col gap-1.5 rounded-xl p-3 transition hover:bg-paper hover:no-underline';
                const body = (
                  <>
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md',
                        tone.iconBg,
                        tone.iconFg,
                      )}
                    >
                      {Icon ? <Icon size={16} strokeWidth={2.2} /> : null}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-ink-600">
                      {item.kicker}
                    </span>
                    <span className="text-[14px] font-bold leading-tight text-ink-900">
                      {item.title}
                    </span>
                    {item.sub ? (
                      <span className="text-[11px] leading-tight text-ink-600">{item.sub}</span>
                    ) : null}
                  </>
                );
                return item.href ? (
                  <Link key={`${item.title}-${i}`} href={item.href} className={className}>
                    {body}
                  </Link>
                ) : (
                  <div key={`${item.title}-${i}`} className={className}>
                    {body}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

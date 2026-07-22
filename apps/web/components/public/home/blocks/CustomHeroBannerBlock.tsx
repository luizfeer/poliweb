import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from '@/components/navigation/link';
import type { CustomHeroBannerConfig, HomeBanner } from '@/lib/home';
import { cn } from '@/lib/utils';

type Props = {
  banners: HomeBanner[];
  config: CustomHeroBannerConfig;
};

const HEIGHT_CLASS: Record<NonNullable<CustomHeroBannerConfig['height']>, string> = {
  compact: 'min-h-[250px] md:min-h-[300px]',
  standard: 'min-h-[330px] md:min-h-[420px]',
  tall: 'min-h-[440px] md:min-h-[560px]',
};

const LAYOUT_CLASS: Record<NonNullable<CustomHeroBannerConfig['layout']>, string> = {
  text_left: 'items-start justify-center text-left',
  text_center: 'items-center justify-center text-center',
  text_right: 'items-end justify-center text-right',
  split_left: 'items-start justify-center text-left md:max-w-[58%]',
  split_right: 'items-start justify-center text-left md:ml-auto md:max-w-[52%]',
};

const FONT_CLASS: Record<NonNullable<CustomHeroBannerConfig['font']>, string> = {
  display: 'font-display',
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
};

const TITLE_SIZE_CLASS: Record<NonNullable<CustomHeroBannerConfig['headlineSize']>, string> = {
  sm: 'text-[30px] md:text-[44px]',
  md: 'text-[38px] md:text-[58px]',
  lg: 'text-[46px] md:text-[72px]',
};

const ANIMATION_CLASS: Record<NonNullable<CustomHeroBannerConfig['animation']>, string> = {
  soft: 'custom-hero-kenburns',
  shine: 'custom-hero-kenburns',
  float: 'custom-hero-float',
  none: '',
};

export function CustomHeroBannerBlock({ banners, config }: Props) {
  const banner = banners[0];
  if (!banner) return null;

  const layout = config.layout ?? 'text_left';
  const height = config.height ?? 'standard';
  const font = config.font ?? 'display';
  const headlineSize = config.headlineSize ?? 'lg';
  const animation = config.animation ?? 'shine';
  const accentColor = config.accentColor ?? '#f4a23a';
  const textColor = config.textColor ?? '#ffffff';
  const backgroundColor = config.backgroundColor ?? '#7a2d14';
  const imagePositionX = clampPercent(config.imagePositionX ?? 50);
  const imagePositionY = clampPercent(config.imagePositionY ?? 50);
  const overlayOpacity = clampPercent(config.overlayOpacity ?? 64) / 100;
  const imagePlacement = config.imagePlacement ?? 'background';
  const isSideImage = imagePlacement === 'left' || imagePlacement === 'right';

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={banner.imageUrl}
      alt={banner.imageAlt ?? config.headline ?? banner.title ?? ''}
      loading="lazy"
      className={cn(
        'h-full w-full',
        config.imageFit === 'contain' ? 'object-contain' : 'object-cover',
        ANIMATION_CLASS[animation],
      )}
      style={{ objectPosition: `${imagePositionX}% ${imagePositionY}%` }}
    />
  );

  const text = (
    <div
      className={cn(
        'relative z-10 flex h-full min-h-[inherit] flex-col px-5 py-7 md:px-10 md:py-10',
        LAYOUT_CLASS[layout],
      )}
    >
      {config.badge ? (
        <span
          className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold uppercase text-ink-900 shadow-sm"
          style={{ color: backgroundColor }}
        >
          <Sparkles className="size-3" aria-hidden />
          {config.badge}
        </span>
      ) : null}
      {config.eyebrow ? (
        <p className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.16em] drop-shadow">
          {config.eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          'max-w-[820px] text-balance font-extrabold leading-[0.95] drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]',
          FONT_CLASS[font],
          TITLE_SIZE_CLASS[headlineSize],
        )}
      >
        {config.headline || banner.title || 'Banner em destaque'}
      </h2>
      {(config.subtitle || banner.subtitle) ? (
        <p className="mt-4 max-w-[620px] text-[15px] font-semibold leading-snug text-white/92 drop-shadow md:text-[18px]">
          {config.subtitle || banner.subtitle}
        </p>
      ) : null}
      {(config.ctaLabel || config.secondaryLabel) ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {config.ctaLabel ? (
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold text-ink-900 shadow-lg transition-transform group-hover/custom-hero:translate-x-0.5"
              style={{ backgroundColor: accentColor }}
            >
              {config.ctaLabel}
              <ArrowRight className="size-4" aria-hidden />
            </span>
          ) : null}
          {config.secondaryLabel ? (
            <span className="rounded-full bg-white/14 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/35 backdrop-blur-sm">
              {config.secondaryLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      {config.footerNote ? (
        <p className="mt-5 max-w-[560px] text-xs font-semibold text-white/82">
          {config.footerNote}
        </p>
      ) : null}
    </div>
  );

  const content = (
    <section
      className={cn(
        'group/custom-hero relative isolate overflow-hidden text-white',
        HEIGHT_CLASS[height],
        config.fullBleed === false ? 'mx-3.5 rounded-lg shadow-card md:mx-6' : '',
      )}
      style={{ backgroundColor, color: textColor }}
    >
      {isSideImage ? (
        <div
          className={cn(
            'grid min-h-[inherit] md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]',
            imagePlacement === 'right' ? 'md:[&>*:first-child]:order-2' : '',
          )}
        >
          <div className="min-h-[220px] bg-black/10">{image}</div>
          <div className="relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{ background: getOverlay('left', backgroundColor, overlayOpacity) }}
              aria-hidden
            />
            {text}
          </div>
        </div>
      ) : (
        <>
          <div className="absolute inset-0">{image}</div>
          <div
            className="absolute inset-0"
            style={{
              background: getOverlay(
                config.overlayDirection ?? 'left',
                backgroundColor,
                overlayOpacity,
              ),
            }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.18),transparent_34%)]" aria-hidden />
          {animation === 'shine' ? <div className="custom-hero-shine" aria-hidden /> : null}
          {animation === 'float' ? (
            <>
              <Sparkles
                className="custom-hero-sparkle absolute right-8 top-8 size-5"
                style={{ color: accentColor }}
                aria-hidden
              />
              <Sparkles
                className="custom-hero-sparkle absolute bottom-10 left-8 size-4"
                style={{ color: accentColor, animationDelay: '1.2s' }}
                aria-hidden
              />
            </>
          ) : null}
          {text}
        </>
      )}
    </section>
  );

  if (banner.linkType === 'none' || !banner.linkUrl) {
    return content;
  }

  if (banner.linkType === 'external') {
    return (
      <a
        href={banner.linkUrl}
        target={banner.linkTarget}
        rel={banner.linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
        className="block hover:no-underline"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={banner.linkUrl} className="block hover:no-underline">
      {content}
    </Link>
  );
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, value));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return { r: 0, g: 0, b: 0 };
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function getOverlay(
  direction: NonNullable<CustomHeroBannerConfig['overlayDirection']>,
  color: string,
  opacity: number,
): string {
  if (direction === 'none') return 'transparent';
  const { r, g, b } = hexToRgb(color);
  const strong = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  const soft = `rgba(${r}, ${g}, ${b}, ${Math.max(0, opacity - 0.32)})`;
  const clear = `rgba(${r}, ${g}, ${b}, 0)`;
  const angle = {
    left: '90deg',
    right: '270deg',
    bottom: '0deg',
  }[direction];
  return `linear-gradient(${angle}, ${strong} 0%, ${soft} 42%, ${clear} 100%)`;
}

import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoProps = {
  variant?: 'mark' | 'lockup' | 'mono' | 'app' | 'appIcon';
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  /** Só no variant `app`: halo escuro + borda. Navbar usa `false`. */
  framed?: boolean;
};

const SOURCES = {
  mark: { src: '/logo-mark.svg', defaultW: 40, defaultH: 40, alt: 'Portal Carmelitano' },
  lockup: { src: '/logo-lockup.svg', defaultW: 160, defaultH: 40, alt: 'Portal Carmelitano' },
  mono: { src: '/logo-mono.svg', defaultW: 40, defaultH: 40, alt: 'Portal Carmelitano' },
  app: { src: '/brand/app-mark.webp', defaultW: 44, defaultH: 44, alt: 'Portal Carmelitano' },
  appIcon: { src: '/brand/app-icon.webp', defaultW: 52, defaultH: 52, alt: 'Portal Carmelitano' },
} as const;

/** Raio contínuo aproximado do ícone iOS (~22,37% do lado). */
const IOS_APP_ICON_RADIUS_RATIO = 0.2237;

export function Logo({
  variant = 'mark',
  width,
  height,
  className,
  priority,
  framed = true,
}: LogoProps) {
  const { src, defaultW, defaultH, alt } = SOURCES[variant];
  const w = width ?? defaultW;
  const h = height ?? defaultH;
  const iosRadius =
    variant === 'app' || variant === 'appIcon'
      ? `${Math.round(Math.min(w, h) * IOS_APP_ICON_RADIUS_RATIO * 100) / 100}px`
      : undefined;

  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      priority={priority}
      unoptimized={variant === 'app' || variant === 'appIcon'}
      sizes={variant === 'app' || variant === 'appIcon' ? `${w}px` : undefined}
      className={cn(
        'select-none',
        variant === 'app' &&
          framed &&
          'bg-ink-900/35 shadow-[0_2px_10px_rgba(0,0,0,0.28)] ring-1 ring-white/25',
        className,
      )}
      style={iosRadius ? { borderRadius: iosRadius } : undefined}
    />
  );
}

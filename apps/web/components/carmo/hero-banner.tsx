import Image from 'next/image';
import { cn } from '@/lib/utils';

type HeroBannerProps = {
  kicker?: string;
  title: string;
  pills?: string[];
  legal?: string;
  /** Foto de fundo (cobre, com overlay escuro). */
  photo?: string;
  /** Cor de acento na diagonal quando não há foto. Default: cerrado-700. */
  accent?: 'cerrado' | 'sky' | 'sun';
  className?: string;
};

const ACCENT_BG: Record<NonNullable<HeroBannerProps['accent']>, string> = {
  cerrado: 'var(--carmo-cerrado-700)',
  sky: 'var(--carmo-sky-700)',
  sun: 'var(--carmo-sun-500)',
};

/**
 * Banner full-bleed com fundo clay e diagonal de acento.
 * Suporta foto de fundo com overlay escuro pra texto branco legível.
 */
export function HeroBanner({
  kicker,
  title,
  pills,
  legal,
  photo,
  accent = 'cerrado',
  className,
}: HeroBannerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md text-white mx-3 mt-2.5 px-4 pt-4 pb-4',
        'min-h-[220px] bg-clay-500 md:mx-6 md:px-6 md:pt-6 lg:mx-8 lg:min-h-[260px] lg:px-8',
        className,
      )}
    >
      {photo ? (
        <>
          <Image
            src={photo}
            alt=""
            fill
            sizes="430px"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(196,82,42,0.7)] to-[rgba(0,0,0,0.55)]" />
        </>
      ) : (
        <div
          className="absolute inset-0 opacity-85"
          style={{
            background: `linear-gradient(155deg, transparent 55%, ${ACCENT_BG[accent]} 55.5%)`,
          }}
        />
      )}

      <div className="relative z-10">
        {kicker && <div className="text-[13px] font-semibold mb-1">{kicker}</div>}
        <h2 className="font-display font-extrabold text-[30px] leading-[1.05] tracking-[-0.01em] max-w-[75%] text-white m-0 lg:max-w-[520px] lg:text-[42px]">
          {title}
        </h2>
        {pills && pills.length > 0 && (
          <div className="flex gap-2 mt-3.5">
            {pills.map((p) => (
              <span
                key={p}
                className="bg-white text-ink-900 text-[13px] font-semibold px-3 py-1.5 rounded-full"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      {legal && (
        <div className="absolute bottom-2 left-4 text-[10px] opacity-90 z-20">{legal}</div>
      )}
    </div>
  );
}

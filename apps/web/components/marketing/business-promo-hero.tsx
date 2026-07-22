import Link from 'next/link';
import { ArrowRight, BadgeCheck, Sparkles, Store, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  href?: string;
  className?: string;
};

export function BusinessPromoHero({ href = '/comercio/cadastro', className }: Props) {
  return (
    <Link
      href={href}
      aria-label="Cadastre seu comércio no Portal Carmelitano e ganhe 1 mês grátis"
      className={cn(
        'relative mx-3 mt-2.5 block overflow-hidden rounded-md text-white md:mx-6 lg:mx-8',
        'min-h-[220px] lg:min-h-[260px]',
        'shadow-[0_10px_30px_-12px_rgba(196,82,42,0.6)] transition-transform duration-300 hover:scale-[1.005]',
        className,
      )}
    >
      <div
        className="promo-bg-anim absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(135deg, #c4522a 0%, #e07a3b 25%, #f4a23a 50%, #c4522a 75%, #7a2d14 100%)',
        }}
        aria-hidden
      />

      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            'linear-gradient(155deg, transparent 52%, var(--carmo-cerrado-700, #2f6b3a) 52.5%)',
        }}
        aria-hidden
      />

      <div
        className="absolute -right-8 -top-8 size-40 rounded-full bg-white/15 blur-2xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-10 left-1/3 size-32 rounded-full bg-amber-200/30 blur-2xl"
        aria-hidden
      />

      <Sparkle className="absolute right-6 top-3 size-4 text-white/90" delay="0s" />
      <Sparkle className="absolute right-16 top-10 size-3 text-white/80" delay="0.8s" />
      <Sparkle className="absolute right-10 top-20 size-3.5 text-white/80" delay="1.6s" />

      <FloatingBadge
        className="promo-float-slow absolute right-4 top-12 hidden md:block lg:right-8 lg:top-10"
        ariaHidden
      >
        <Store className="size-3.5" />
        Pousada do Lago
        <Stars />
      </FloatingBadge>

      <FloatingBadge
        className="promo-float-fast absolute right-20 top-28 hidden md:block lg:right-28 lg:top-32"
        tone="amber"
        ariaHidden
      >
        <Tag className="size-3.5" />
        Restaurante da Praça
      </FloatingBadge>

      <div className="promo-shine" aria-hidden />

      <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-between px-4 pb-4 pt-4 md:px-6 md:pt-6 lg:min-h-[260px] lg:px-8">
        <div>
          <span className="promo-tag-pop inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#c4522a] shadow-sm">
            <Sparkles className="size-3" />
            1 mês grátis
          </span>
          <div className="mt-1.5 text-[13px] font-semibold drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
            Pro seu comércio
          </div>
          <h2 className="font-display m-0 mt-1 max-w-[78%] text-[28px] font-extrabold leading-[1.05] tracking-[-0.01em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] lg:max-w-[520px] lg:text-[40px]">
            Apareça no Portal Carmelitano
          </h2>
          <p className="mt-2 max-w-[72%] text-[13px] font-medium text-white/95 drop-shadow-sm lg:max-w-[460px] lg:text-[15px]">
            Cadastre seu negócio em 2 minutos. Sem fidelidade, cancele quando quiser.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2f6b3a] px-3.5 py-2 text-[13px] font-bold text-white shadow-md ring-1 ring-white/30 transition-transform group-hover:translate-x-0.5">
            Quero cadastrar
            <ArrowRight className="size-3.5" />
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            <BadgeCheck className="size-3" />
            Aprovação manual
          </span>
        </div>
      </div>

      <div className="absolute bottom-2 left-4 z-20 text-[10px] opacity-90">
        Oferta de lançamento • Carmo do Rio Claro/MG
      </div>
    </Link>
  );
}

function Sparkle({ className, delay }: { className?: string; delay: string }) {
  return (
    <Sparkles
      aria-hidden
      className={cn('promo-sparkle', className)}
      style={{ animationDelay: delay }}
    />
  );
}

function FloatingBadge({
  children,
  className,
  tone = 'white',
  ariaHidden,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'white' | 'amber';
  ariaHidden?: boolean;
}) {
  return (
    <div
      aria-hidden={ariaHidden}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shadow-lg ring-1 ring-black/5',
        tone === 'amber'
          ? 'bg-amber-50 text-[#7a2d14]'
          : 'bg-white text-[#2f6b3a]',
        className,
      )}
    >
      {children}
    </div>
  );
}

function Stars() {
  return (
    <span className="ml-1 inline-flex text-[10px] text-amber-500">
      ★★★★★
    </span>
  );
}

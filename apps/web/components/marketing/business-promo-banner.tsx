import Link from 'next/link';
import { Sparkles, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'full' | 'slim' | 'card';

type Props = {
  variant?: Variant;
  href?: string;
  className?: string;
};

const HEADLINE = '1 mês grátis pro seu comércio no Portal Carmelitano';
const SUB =
  'Cadastre seu negócio em 2 minutos. Aparece nas buscas locais, ficha completa e suporte. Só paga depois do trial.';

export function BusinessPromoBanner({
  variant = 'full',
  href = '/comercio/cadastro',
  className,
}: Props) {
  if (variant === 'slim') {
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center justify-between gap-3 border-b border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/15 md:px-6 lg:px-8',
          className,
        )}
      >
        <span className="flex items-center gap-2 font-medium">
          <Sparkles className="size-4" />
          <span>1 mês grátis — coloque seu comércio no portal</span>
        </span>
        <span className="hidden text-xs underline underline-offset-2 sm:inline">
          Cadastrar agora →
        </span>
        <span className="text-xs sm:hidden">Cadastrar →</span>
      </Link>
    );
  }

  if (variant === 'card') {
    return (
      <Link
        href={href}
        className={cn(
          'group flex items-start gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4 transition-colors hover:border-primary/40',
          className,
        )}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Store className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="size-3" /> 1 mês grátis
            </span>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-foreground">
            É dono de comércio em Carmo?
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{SUB}</p>
          <span className="mt-2 inline-block text-xs font-medium text-primary underline underline-offset-2 group-hover:no-underline">
            Quero cadastrar meu comércio →
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 transition-colors hover:border-primary/40 md:p-6',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="size-3.5" /> 1 mês grátis
      </span>
      <h3 className="mt-3 text-lg font-bold text-foreground md:text-xl">{HEADLINE}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{SUB}</p>
      <span className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-2 group-hover:no-underline">
        Quero cadastrar meu comércio →
      </span>
    </Link>
  );
}

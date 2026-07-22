import { cn } from '@/lib/utils';

type CupomCardProps = {
  brand: string;
  off: string;
  /** Emoji/illo curto pra prototipagem. */
  illo?: string;
  className?: string;
};

/**
 * Cupom Card — quadrado clay chapado, padrão Amazon "Cupons da semana".
 */
export function CupomCard({ brand, off, illo, className }: CupomCardProps) {
  return (
    <div className={cn('shrink-0 w-[130px]', className)}>
      <div className="w-[130px] h-[130px] bg-clay-500 rounded-xs flex items-center justify-center overflow-hidden relative">
        {illo && <span className="text-[56px] leading-none">{illo}</span>}
      </div>
      <div className="text-[13px] text-ink-900 text-center leading-snug mt-2 px-1">
        <strong className="font-bold">{off} off</strong> em
        <br />
        {brand}
      </div>
    </div>
  );
}

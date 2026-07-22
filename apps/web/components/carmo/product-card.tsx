import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ProductCardProps = {
  title: string;
  /** Reais (sem o R$). Ex: "1.069". */
  price: string;
  /** Centavos. Ex: "00". */
  frac?: string;
  photo?: string;
  illo?: string;
  off?: string;
  /** Subtexto promocional (vira magenta). Ex: "Frete grátis hoje". */
  kicker?: string;
  href?: string;
  width?: number;
  className?: string;
};

/**
 * Product Card — denso, fundo paper na foto. Padrão "carrosséis Amazon".
 * Preço com R$ pequeno + reais grandes + centavos pequenos.
 */
export function ProductCard({
  title,
  price,
  frac = '00',
  photo,
  illo,
  off,
  kicker,
  href,
  width = 162,
  className,
}: ProductCardProps) {
  const content = (
    <div
      className={cn(
        'shrink-0 bg-white rounded-xs overflow-hidden border border-ink-100',
        className,
      )}
      style={{ width }}
    >
      <div className="w-full aspect-square bg-paper relative flex items-center justify-center overflow-hidden">
        {photo ? (
          <Image src={photo} alt={title} fill className="object-cover" sizes={`${width}px`} />
        ) : (
          <span className="text-[56px] leading-none">{illo}</span>
        )}
        {off && (
          <div className="absolute bottom-1.5 left-1.5 bg-discount text-white text-[12px] font-bold px-1.5 py-0.5 rounded-[2px]">
            {off} off
          </div>
        )}
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <div className="text-[13px] leading-tight text-ink-900 mb-1 line-clamp-2 min-h-[34px]">
          {title}
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-[12px] font-semibold">R$</span>
          <span className="text-[22px] font-bold leading-none tracking-[-0.01em]">{price}</span>
          <span className="text-[12px] font-bold self-start mt-0.5">{frac}</span>
        </div>
        {kicker && (
          <div className="text-[12px] text-discount font-medium mt-0.5">{kicker}</div>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

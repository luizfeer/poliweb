import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type PousadaCardProps = {
  name: string;
  /** Distância ou bairro. Ex: "2,4 km · Beira Rio". */
  dist?: string;
  /** Diária em reais (sem R$). Ex: "320". Quando ausente, esconde a linha de preço. */
  price?: string;
  rating?: number;
  photo?: string;
  illo?: string;
  tags?: string[];
  href?: string;
  className?: string;
};

/**
 * Card de pousada/hospedagem — usado em listagens de turismo.
 * Topo: foto com badge de rating; corpo: nome + distância + tags + diária.
 */
export function PousadaCard({
  name,
  dist,
  price,
  rating,
  photo,
  illo,
  tags = [],
  href,
  className,
}: PousadaCardProps) {
  const content = (
    <div
      className={cn(
        'shrink-0 w-[220px] bg-white border border-ink-100 rounded-xs overflow-hidden',
        className,
      )}
    >
      <div className="h-[130px] relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-cerrado-300 to-cerrado-700">
        {photo ? (
          <Image src={photo} alt={name} fill className="object-cover" sizes="220px" />
        ) : (
          <span className="text-[64px] leading-none">{illo}</span>
        )}
        {rating !== undefined && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-[12px] font-semibold px-2 py-0.5 rounded-xs flex items-center gap-1">
            <Star size={11} className="fill-sun-500 text-sun-500" strokeWidth={3} />
            {rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <div className="text-[14px] font-bold text-ink-900 leading-tight">{name}</div>
        {dist && <div className="text-[12px] text-ink-600 mt-0.5">{dist}</div>}
        {tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {tags.map((t) => (
              <span
                key={t}
                className="text-[11px] px-2 py-0.5 rounded-full bg-cerrado-100 text-cerrado-700 font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        {price ? (
          <div className="flex items-baseline mt-2 gap-1">
            <span className="text-[11px] font-semibold">R$</span>
            <span className="text-[20px] font-bold leading-none">{price}</span>
            <span className="text-[12px] text-ink-600">/ noite</span>
          </div>
        ) : (
          <div className="text-[12px] text-ink-600 mt-2">Diária sob consulta</div>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

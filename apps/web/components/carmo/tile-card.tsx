import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type TileCardProps = {
  title: string;
  /** Foto top-aligned dentro do tile. */
  photo?: string;
  illo?: string;
  subtitle?: string;
  off?: string;
  href?: string;
  width?: number;
  className?: string;
};

/**
 * Tile Card — quadrado branco com título bold em cima e foto/illo no meio.
 * Padrão "Mais comprados", "Compre por categoria".
 */
export function TileCard({
  title,
  photo,
  illo,
  subtitle,
  off,
  href,
  width = 168,
  className,
}: TileCardProps) {
  const content = (
    <div
      className={cn(
        'shrink-0 bg-white rounded-xs px-3.5 pt-3.5 pb-3 border border-ink-100 relative',
        className,
      )}
      style={{ width }}
    >
      <div className="font-sans font-extrabold text-[15px] leading-tight text-ink-900 mb-2.5 min-h-[36px]">
        {title}
      </div>
      <div className="w-full aspect-[1.1/1] bg-paper rounded-[2px] flex items-center justify-center overflow-hidden">
        {photo ? (
          <Image src={photo} alt="" fill className="object-cover" sizes={`${width}px`} />
        ) : (
          <span className="text-[64px] leading-none">{illo}</span>
        )}
      </div>
      {subtitle && <div className="text-[12px] text-ink-700 mt-2">{subtitle}</div>}
      {off && (
        <div className="absolute left-2 bottom-[44%] bg-discount text-white text-[12px] font-bold px-1.5 py-0.5 rounded-[2px]">
          {off} off
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

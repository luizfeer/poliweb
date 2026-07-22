import { Link } from '@/components/navigation/link';
import { Band, HScroll } from '@/components/carmo';
import type { BannerAspectRatio, BannerCarouselConfig, HomeBanner } from '@/lib/home';
import { BannerMedia } from './BannerMedia';

export const ASPECT_CLASS: Record<BannerAspectRatio, string> = {
  '16:9': 'aspect-[16/9]',
  '4:5': 'aspect-[4/5]',
  '1:1': 'aspect-square',
  '3:1': 'aspect-[3/1]',
  '9:16': 'aspect-[9/16]',
  '5:1': 'aspect-[5/1]',
};

/**
 * Tamanho do slide no carrossel. Pra evitar slides absurdamente altos em
 * mobile, proporções verticais (9:16, 4:5, 1:1) são ancoradas em ALTURA fixa
 * (e a largura cai naturalmente do aspect-ratio). Proporções horizontais
 * são ancoradas em largura percentual da viewport.
 */
const SLIDE_SIZE_BY_RATIO: Record<BannerAspectRatio, string> = {
  '16:9': 'w-[88vw] max-w-[680px]',
  '3:1':  'w-[92vw] max-w-[960px]',
  '5:1':  'w-[94vw] max-w-[1200px]',
  '4:5':  'h-[440px] sm:h-[500px]',
  '1:1':  'h-[340px] sm:h-[400px]',
  '9:16': 'h-[520px] sm:h-[620px]',
};

type Props = {
  banners: HomeBanner[];
  config: BannerCarouselConfig;
  title: string | null;
};

export function BannerCarouselBlock({ banners, config, title }: Props) {
  if (banners.length === 0) return null;

  const ratio = config.aspectRatio ?? '4:5';
  const aspectClass = ASPECT_CLASS[ratio];
  const sizeClass = SLIDE_SIZE_BY_RATIO[ratio];

  return (
    <Band className="px-3.5 pb-3">
      {title ? (
        <h2 className="text-ink-900 mb-2 text-[14px] font-extrabold uppercase tracking-wide">
          {title}
        </h2>
      ) : null}
      <HScroll className="-mx-3.5 px-3.5">
        {banners.map((banner) => {
          const inner = (
            <BannerMedia
              banner={banner}
              className={`${aspectClass} ${sizeClass} shrink-0 rounded-lg shadow-card`}
            />
          );

          if (banner.linkType === 'none' || !banner.linkUrl) {
            return (
              <div key={banner.id} className="shrink-0">
                {inner}
              </div>
            );
          }

          if (banner.linkType === 'external') {
            return (
              <a
                key={banner.id}
                href={banner.linkUrl}
                target={banner.linkTarget}
                rel={banner.linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
                className="block shrink-0 hover:no-underline"
              >
                {inner}
              </a>
            );
          }

          return (
            <Link
              key={banner.id}
              href={banner.linkUrl}
              className="block shrink-0 hover:no-underline"
            >
              {inner}
            </Link>
          );
        })}
      </HScroll>
    </Band>
  );
}

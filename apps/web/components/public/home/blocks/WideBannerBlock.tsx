import { Link } from '@/components/navigation/link';
import type { HomeBanner, WideBannerConfig } from '@/lib/home';
import { BannerMedia } from './BannerMedia';
import { ASPECT_CLASS } from './BannerCarouselBlock';

type Props = {
  banners: HomeBanner[];
  config: WideBannerConfig;
  title: string | null;
};

/**
 * Banner unico full-width. Usa o primeiro banner ativo do bloco. Sem padding
 * lateral por padrao (fullBleed=true) — encosta nas bordas da tela.
 */
export function WideBannerBlock({ banners, config, title }: Props) {
  const banner = banners[0];
  if (!banner) return null;

  const aspectClass = ASPECT_CLASS[config.aspectRatio ?? '5:1'];
  const wrapperClass = config.fullBleed === false ? 'px-3.5' : '';

  const media = (
    <BannerMedia
      banner={{ ...banner, title: title ?? banner.title }}
      className={`${aspectClass} w-full ${config.fullBleed === false ? 'rounded-lg shadow-card' : ''}`}
    />
  );

  let content;
  if (banner.linkType === 'none' || !banner.linkUrl) {
    content = media;
  } else if (banner.linkType === 'external') {
    content = (
      <a
        href={banner.linkUrl}
        target={banner.linkTarget}
        rel={banner.linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
        className="block hover:no-underline"
      >
        {media}
      </a>
    );
  } else {
    content = (
      <Link href={banner.linkUrl} className="block hover:no-underline">
        {media}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}

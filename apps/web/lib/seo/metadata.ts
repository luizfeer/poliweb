import 'server-only';
import type { Metadata } from 'next';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';

type BuildMetadataInput = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  type?: 'website' | 'article' | 'profile';
  keywords?: string[];
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
};

const FALLBACK_OG = '/opengraph-image';

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const site = resolvePublicSiteOrigin();
  const path = input.path ?? '/';
  const canonical = `${site}${path}`;
  const image = input.image ?? FALLBACK_OG;
  const description = clamp(input.description, 158);

  return {
    title: input.title,
    description,
    keywords: input.keywords,
    alternates: { canonical },
    openGraph: {
      title: input.title,
      description,
      url: canonical,
      siteName: 'Portal Carmelitano',
      locale: 'pt_BR',
      type: input.type ?? 'website',
      images: [{ url: image, alt: input.imageAlt ?? input.title }],
      publishedTime: input.publishedTime,
      modifiedTime: input.modifiedTime,
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description,
      images: [image],
    },
    robots: input.noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
  };
}

function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}

import type { Metadata } from 'next';

type SocialImageInput = {
  ogImageUrl?: string | null;
  ogSquareImageUrl?: string | null;
  alt: string;
};

export function buildSocialImages(input: SocialImageInput): {
  openGraph?: NonNullable<Metadata['openGraph']>;
  twitter?: NonNullable<Metadata['twitter']>;
} {
  const landscape = input.ogImageUrl
    ? [{ url: input.ogImageUrl, width: 1200, height: 630, alt: input.alt }]
    : [];
  const square = input.ogSquareImageUrl
    ? [{ url: input.ogSquareImageUrl, width: 1080, height: 1080, alt: input.alt }]
    : [];

  if (landscape.length === 0 && square.length === 0) return {};

  return {
    openGraph: { images: [...square, ...landscape] },
    twitter: landscape[0]
      ? { card: 'summary_large_image', images: [landscape[0].url] }
      : { card: 'summary', images: square.map((image) => image.url) },
  };
}

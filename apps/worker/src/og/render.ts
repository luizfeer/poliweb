import fs from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const FONT_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const FONT_BOLD_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

let fontCache: ArrayBuffer | null = null;
let fontBoldCache: ArrayBuffer | null = null;

function loadFonts(): { regular: ArrayBuffer; bold: ArrayBuffer } {
  if (!fontCache) {
    fontCache = fs.readFileSync(FONT_PATH).buffer as ArrayBuffer;
  }
  if (!fontBoldCache) {
    fontBoldCache = fs.readFileSync(FONT_BOLD_PATH).buffer as ArrayBuffer;
  }
  return { regular: fontCache, bold: fontBoldCache };
}

function h(
  type: string,
  props?: Record<string, unknown> | null,
  ...children: unknown[]
): { type: string; props: Record<string, unknown>; key: null } {
  const c = children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
  return { type, props: { ...(props ?? {}), children: c }, key: null };
}

export type OgRenderInput = {
  title: string;
  tagline: string;
  typeLabel: string;
  cityName: string;
  heroBuffer: Buffer | null;
  variant?: 'landscape' | 'square';
};

export async function renderOgImage(input: OgRenderInput): Promise<Buffer> {
  const fonts = loadFonts();
  const variant = input.variant ?? 'landscape';
  const width = variant === 'square' ? 1080 : 1200;
  const height = variant === 'square' ? 1080 : 630;
  const padding = variant === 'square' ? 72 : 56;
  const titleSize = variant === 'square' ? 78 : 54;
  const taglineSize = variant === 'square' ? 34 : 24;
  const brandSize = variant === 'square' ? 19 : 13;
  const badgeSize = variant === 'square' ? 27 : 18;
  const maxTextWidth = variant === 'square' ? 880 : 980;

  const overlaySvg = await satori(
    h(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          fontFamily: 'DejaVu Sans, sans-serif',
        },
      },
      input.heroBuffer
        ? h('div', {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background:
                variant === 'square'
                  ? 'linear-gradient(180deg, rgba(25,25,25,0.22) 0%, rgba(31,74,44,0.78) 48%, rgba(25,25,25,0.94) 100%)'
                  : 'linear-gradient(115deg, rgba(31,74,44,0.92) 0%, rgba(25,25,25,0.78) 42%, rgba(25,25,25,0.55) 100%)',
            },
          })
        : h('div', {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background:
                'linear-gradient(135deg, #1F4A2C 0%, #C84810 54%, #F4B73A 100%)',
            },
          }),
      h('div', {
        style: {
          position: 'absolute',
          top: 44,
          right: 44,
          width: variant === 'square' ? 210 : 150,
          height: variant === 'square' ? 210 : 150,
          borderRadius: 999,
          background: 'rgba(244,183,58,0.22)',
          border: '2px solid rgba(244,183,58,0.36)',
        },
      }),
      h('div', {
        style: {
          position: 'absolute',
          bottom: variant === 'square' ? 250 : 80,
          right: variant === 'square' ? -74 : -42,
          width: variant === 'square' ? 260 : 170,
          height: variant === 'square' ? 260 : 170,
          borderRadius: 999,
          background: 'rgba(224,86,27,0.28)',
        },
      }),
      h(
        'div',
        {
          style: {
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            width: '100%',
            height: '100%',
            padding,
            paddingBottom: variant === 'square' ? 76 : 52,
          },
        },
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: 18 } },
          h(
            'div',
            {
              style: {
                fontSize: brandSize,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,209,191,0.95)',
              },
            },
            `Portal Carmelitano - CidadeViva · ${input.cityName}`,
          ),
          h(
            'div',
            {
              style: {
                fontSize: titleSize,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                maxWidth: maxTextWidth,
                color: '#FFF5EE',
              },
            },
            input.title,
          ),
          input.tagline
            ? h(
                'div',
                {
                  style: {
                    fontSize: taglineSize,
                    fontWeight: 600,
                    color: 'rgba(250,248,245,0.92)',
                    maxWidth: maxTextWidth,
                    lineHeight: 1.35,
                  },
                },
                input.tagline,
              )
            : null,
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 } },
            h(
              'div',
              {
                style: {
                  fontSize: badgeSize,
                  fontWeight: 700,
                  color: '#F4B73A',
                  padding: variant === 'square' ? '14px 24px' : '10px 18px',
                  borderRadius: 999,
                  border: '2px solid rgba(244,183,58,0.55)',
                  background: 'rgba(31,74,44,0.35)',
                },
              },
              input.typeLabel,
            ),
          ),
        ),
      ),
    ),
    {
      width,
      height,
      fonts: [
        { name: 'DejaVu Sans', data: fonts.regular, weight: 400, style: 'normal' },
        { name: 'DejaVu Sans', data: fonts.bold, weight: 700, style: 'normal' },
        { name: 'DejaVu Sans', data: fonts.bold, weight: 800, style: 'normal' },
      ],
    },
  );

  const resvg = new Resvg(overlaySvg, { fitTo: { mode: 'width', value: width } });
  const overlayPng = resvg.render().asPng();

  const useJpeg = variant === 'square';

  const encode = (pipeline: sharp.Sharp) =>
    useJpeg
      ? pipeline.jpeg({ quality: 82, mozjpeg: true })
      : pipeline.webp({ quality: 85, effort: 4 });

  if (input.heroBuffer) {
    const base = await encode(
      sharp(input.heroBuffer).resize(width, height, { fit: 'cover' }),
    ).toBuffer();

    const composed = await encode(
      sharp(base).composite([{ input: overlayPng, blend: 'over' }]),
    ).toBuffer();

    return composed;
  }

  const buffer = await encode(
    sharp(overlayPng).resize(width, height, { fit: 'cover' }),
  ).toBuffer();

  return buffer;
}

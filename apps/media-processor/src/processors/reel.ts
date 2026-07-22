import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { ensureBrowser, renderMedia, selectComposition } from '@remotion/renderer';
import { env } from '../env.js';

// Slide do documento do Studio (mesmo shape de apps/web/lib/studio/types.ts).
export type ReelSlide = {
  id: string;
  kind: string;
  theme: string;
  format: string;
  photo: string | null;
};

export type ReelDocument = { slides: ReelSlide[] };

function resolvePaths() {
  const webDir = env.REMOTION_WEB_DIR ?? path.resolve(process.cwd(), '..', 'web');
  const entryPoint = env.REMOTION_ENTRY_POINT ?? path.join(webDir, 'lib', 'studio', 'reels', 'remotion-entry.tsx');
  return { webDir, entryPoint };
}

// O bundle do Remotion é caro (webpack). Faz uma vez e reaproveita enquanto o
// worker vive — reiniciar o processo pega mudanças na composição.
let serveUrlPromise: Promise<string> | null = null;

function getServeUrl(): Promise<string> {
  if (!serveUrlPromise) {
    const { webDir, entryPoint } = resolvePaths();
    serveUrlPromise = bundle({
      entryPoint,
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...(config.resolve?.alias ?? {}),
            '@': webDir,
          },
        },
      }),
    });
  }
  return serveUrlPromise;
}

export type RenderedReel = {
  buffer: Buffer;
  width: number;
  height: number;
  extension: 'mp4';
  contentType: string;
};

export async function renderReel(input: { document: ReelDocument; ramo: string }): Promise<RenderedReel> {
  await ensureBrowser();
  const serveUrl = await getServeUrl();
  const inputProps = { document: input.document, ramo: input.ramo };

  const composition = await selectComposition({ serveUrl, id: 'reel', inputProps });

  const dir = await mkdtemp(path.join(os.tmpdir(), 'reel-'));
  const outputLocation = path.join(dir, 'reel.mp4');
  try {
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation,
      inputProps,
    });
    const buffer = await readFile(outputLocation);
    return {
      buffer,
      width: composition.width,
      height: composition.height,
      extension: 'mp4',
      contentType: 'video/mp4',
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// Smoke test: valida que a composição Remotion do apps/web bundla fora do Next.
// Roda só o bundle() (webpack, sem Chromium). Uso: pnpm --filter media-processor exec tsx scripts/smoke-bundle.ts
import path from 'node:path';
import { bundle } from '@remotion/bundler';

const webDir = path.resolve(process.cwd(), '..', 'web');
const entryPoint = path.join(webDir, 'lib', 'studio', 'reels', 'remotion-entry.tsx');

const serveUrl = await bundle({
  entryPoint,
  webpackOverride: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: { ...(config.resolve?.alias ?? {}), '@': webDir },
    },
  }),
});

console.log('BUNDLE_OK', serveUrl);

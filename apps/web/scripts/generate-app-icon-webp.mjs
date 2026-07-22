import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(webRoot, '../..');
const require = createRequire(path.join(repoRoot, 'apps/media-processor/package.json'));
const sharp = require('sharp');

const brandDir = path.join(webRoot, 'assets/brand/original');
const outDir = path.join(webRoot, 'public/brand');

const targets = [
  {
    source: path.join(brandDir, 'adaptive-icon.png'),
    output: path.join(outDir, 'app-mark.webp'),
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
  {
    source: path.join(brandDir, 'icon.png'),
    output: path.join(outDir, 'app-icon.webp'),
    fit: 'cover',
    background: null,
  },
];

await mkdir(outDir, { recursive: true });

for (const target of targets) {
  let pipeline = sharp(target.source).resize(128, 128, {
    fit: target.fit,
    ...(target.background ? { background: target.background } : {}),
  });

  const info = await pipeline.webp({ quality: 82, effort: 6, alphaQuality: 90 }).toFile(target.output);
  console.log(`${path.relative(repoRoot, target.output)} (${info.size} bytes)`);
}

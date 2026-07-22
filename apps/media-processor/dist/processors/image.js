import sharp from 'sharp';
import { env } from '../env.js';
export async function processImage(input) {
    const image = sharp(input, { limitInputPixels: 50_000_000 }).rotate();
    const metadata = await image.metadata();
    const resized = metadata.width && metadata.width > env.IMAGE_MAX_WIDTH ? image.resize({ width: env.IMAGE_MAX_WIDTH }) : image;
    const buffer = await resized.webp({ quality: env.IMAGE_WEBP_QUALITY, effort: 5 }).toBuffer();
    const outputMetadata = await sharp(buffer).metadata();
    return {
        buffer,
        contentType: 'image/webp',
        extension: 'webp',
        width: outputMetadata.width ?? null,
        height: outputMetadata.height ?? null,
    };
}

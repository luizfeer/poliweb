import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { env } from '../env.js';
export async function processVideo(input, filename) {
    const workdir = path.join(os.tmpdir(), `hail-mary-media-${crypto.randomUUID()}`);
    await mkdir(workdir, { recursive: true });
    const inputPath = path.join(workdir, safeFilename(filename));
    const outputPath = path.join(workdir, 'output.mp4');
    const thumbnailRawPath = path.join(workdir, 'thumb.png');
    try {
        await writeFile(inputPath, input);
        await runFfmpeg([
            '-y',
            '-i',
            inputPath,
            '-vf',
            `scale='min(${env.VIDEO_MAX_WIDTH},iw)':-2`,
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-crf',
            String(env.VIDEO_CRF),
            '-pix_fmt',
            'yuv420p',
            '-movflags',
            '+faststart',
            '-c:a',
            'aac',
            '-b:a',
            '128k',
            outputPath,
        ]);
        const thumbnail = await extractThumbnail(outputPath, thumbnailRawPath);
        return {
            buffer: await readFile(outputPath),
            contentType: 'video/mp4',
            extension: 'mp4',
            width: null,
            height: null,
            thumbnail,
        };
    }
    finally {
        await rm(workdir, { recursive: true, force: true });
    }
}
async function extractThumbnail(videoPath, rawOutputPath) {
    try {
        await runFfmpeg([
            '-y',
            '-ss',
            '00:00:01',
            '-i',
            videoPath,
            '-frames:v',
            '1',
            '-vf',
            `scale='min(${env.VIDEO_MAX_WIDTH},iw)':-2`,
            rawOutputPath,
        ]);
    }
    catch {
        try {
            await runFfmpeg([
                '-y',
                '-i',
                videoPath,
                '-frames:v',
                '1',
                '-vf',
                `scale='min(${env.VIDEO_MAX_WIDTH},iw)':-2`,
                rawOutputPath,
            ]);
        }
        catch {
            return null;
        }
    }
    const raw = await readFile(rawOutputPath).catch(() => null);
    if (!raw)
        return null;
    const buffer = await sharp(raw, { limitInputPixels: 50_000_000 })
        .webp({ quality: env.IMAGE_WEBP_QUALITY, effort: 5 })
        .toBuffer();
    const metadata = await sharp(buffer).metadata();
    return {
        buffer,
        contentType: 'image/webp',
        width: metadata.width ?? null,
        height: metadata.height ?? null,
    };
}
function runFfmpeg(args) {
    return new Promise((resolve, reject) => {
        const child = spawn(env.FFMPEG_BIN, args, { stdio: ['ignore', 'ignore', 'pipe'] });
        const errors = [];
        child.stderr.on('data', (chunk) => errors.push(chunk));
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`ffmpeg failed (${code}): ${Buffer.concat(errors).toString('utf8').slice(-2000)}`));
            }
        });
    });
}
function safeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'input.bin';
}

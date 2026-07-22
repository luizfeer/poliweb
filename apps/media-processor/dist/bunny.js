import crypto from 'node:crypto';
import { env } from './env.js';
export async function uploadProcessedToBunny(input) {
    const checksumSha256 = crypto.createHash('sha256').update(input.buffer).digest('hex').toUpperCase();
    const endpoint = env.BUNNY_STORAGE_ENDPOINT.replace(/\/$/, '');
    const cdnBaseUrl = env.NEXT_PUBLIC_BUNNY_CDN_URL.replace(/\/$/, '');
    const uploadUrl = `${endpoint}/${env.BUNNY_STORAGE_ZONE}/${input.storagePath
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`;
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            AccessKey: env.BUNNY_STORAGE_ACCESS_KEY,
            Checksum: checksumSha256,
            'Content-Type': input.contentType,
        },
        body: new Blob([new Uint8Array(input.buffer)]),
    });
    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Bunny upload failed (${response.status}): ${body}`);
    }
    return {
        bucket: env.BUNNY_STORAGE_ZONE,
        storagePath: input.storagePath,
        cdnUrl: `${cdnBaseUrl}/${input.storagePath}`,
        contentType: input.contentType,
        sizeBytes: input.buffer.byteLength,
        checksumSha256,
    };
}

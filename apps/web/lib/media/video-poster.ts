const VIDEO_EXTENSION = /\.mp4(\?|#|$)/i;

export function videoPosterUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  if (!VIDEO_EXTENSION.test(src)) return null;
  return src.replace(VIDEO_EXTENSION, '.poster.webp$1');
}

export function isVideoSrc(src: string | null | undefined, contentType?: string | null): boolean {
  if (contentType?.startsWith('video/')) return true;
  if (!src) return false;
  return /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(src);
}

/** Extrai o ID de 11 caracteres de URLs do YouTube (watch, embed, youtu.be, shorts). */
export function parseYouTubeVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = url.pathname.replace(/^\//, '').split('/')[0];
    return /^[\w-]{11}$/.test(id ?? '') ? id! : null;
  }

  if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
    if (url.pathname === '/watch' || url.pathname.startsWith('/watch')) {
      const v = url.searchParams.get('v');
      return v && /^[\w-]{11}$/.test(v) ? v : null;
    }
    const embedMatch = url.pathname.match(/^\/embed\/([\w-]{11})/);
    if (embedMatch) return embedMatch[1];
    const shortsMatch = url.pathname.match(/^\/shorts\/([\w-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    const liveMatch = url.pathname.match(/^\/live\/([\w-]{11})/);
    if (liveMatch) return liveMatch[1];
  }

  return null;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}

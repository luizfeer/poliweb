import { NextRequest } from 'next/server';

function getPlacesApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error('GOOGLE_PLACES_API_KEY ausente.');
  }
  return key;
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  const width = request.nextUrl.searchParams.get('w') ?? '480';
  const parsedWidth = Number(width);
  const maxWidth = Number.isFinite(parsedWidth) ? Math.min(Math.max(parsedWidth, 80), 1200) : 480;

  if (!name || !name.startsWith('places/') || !name.includes('/photos/')) {
    return new Response('Foto inválida.', { status: 400 });
  }

  const url = new URL(`https://places.googleapis.com/v1/${name}/media`);
  url.searchParams.set('maxWidthPx', String(maxWidth));
  url.searchParams.set('key', getPlacesApiKey());

  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok || !response.body) {
    return new Response('Foto não encontrada.', { status: response.status || 502 });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}

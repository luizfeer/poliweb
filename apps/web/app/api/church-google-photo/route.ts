import { NextRequest } from 'next/server';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

function getPlacesApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error('GOOGLE_PLACES_API_KEY ausente.');
  }
  return key;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function approvedGooglePhotoNames(importSource: unknown): string[] {
  const source = asRecord(importSource);
  const google = asRecord(source?.google_places);
  if (!google || !Array.isArray(google.approved_photos)) return [];
  return google.approved_photos.filter((item): item is string => typeof item === 'string');
}

export async function GET(request: NextRequest) {
  const city = await getCurrentCity();
  if (!city) return new Response('Cidade nao encontrada.', { status: 404 });

  const slug = request.nextUrl.searchParams.get('slug');
  const name = request.nextUrl.searchParams.get('name');
  const width = request.nextUrl.searchParams.get('w') ?? '900';
  const parsedWidth = Number(width);
  const maxWidth = Number.isFinite(parsedWidth) ? Math.min(Math.max(parsedWidth, 120), 1600) : 900;

  if (!slug || !name || !name.startsWith('places/') || !name.includes('/photos/')) {
    return new Response('Foto invalida.', { status: 400 });
  }

  const supabase = await createClient();
  const { data: church, error } = await supabase
    .from('churches')
    .select('import_source')
    .eq('city_id', city.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !church || !approvedGooglePhotoNames(church.import_source).includes(name)) {
    return new Response('Foto nao autorizada.', { status: 404 });
  }

  const url = new URL(`https://places.googleapis.com/v1/${name}/media`);
  url.searchParams.set('maxWidthPx', String(maxWidth));
  url.searchParams.set('key', getPlacesApiKey());

  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok || !response.body) {
    return new Response('Foto nao encontrada.', { status: response.status || 502 });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}

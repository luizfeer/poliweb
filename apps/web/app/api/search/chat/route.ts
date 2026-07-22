import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { chatSearch } from '@/lib/search/semantic';

const bodySchema = z.object({
  query: z.string().min(2).max(500).trim(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'query must be 2–500 chars' }, { status: 422 });
  }

  const city = await getCurrentCity();
  if (!city) {
    return NextResponse.json({ error: 'city not found' }, { status: 404 });
  }

  const result = await chatSearch(parsed.data.query, city.id);
  return NextResponse.json(result);
}

import { NextResponse } from 'next/server';
import { subscribeSchema, subscribeToNewsletter } from '@/lib/newsletter/subscribe';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = subscribeSchema.parse(body);
  await subscribeToNewsletter(parsed, request);
  return NextResponse.json({ ok: true });
}

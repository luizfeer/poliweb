import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getCityBySlug } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';

export const runtime = 'nodejs';

const bodySchema = z.object({
  sessionLocalId: z.string().min(1).max(120),
  rating: z.enum(['up', 'down']),
  query: z.string().min(1).max(500),
  responseText: z.string().max(8000).nullable().optional(),
  responseBlocks: z.unknown().optional(),
  conversation: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string(),
      }),
    )
    .max(20)
    .optional(),
  comment: z.string().max(1000).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const citySlug = request.nextUrl.searchParams.get('city') ?? 'carmo-do-rio-claro';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid body' }, { status: 422 });
  }

  const city = await getCityBySlug(citySlug);
  if (!city) {
    return NextResponse.json({ error: 'city not found' }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  const conversationJson: Json | null =
    parsed.data.conversation === undefined ? null : (parsed.data.conversation as Json);
  const responseBlocksJson: Json | null =
    parsed.data.responseBlocks === undefined
      ? null
      : (parsed.data.responseBlocks as Json);

  const { error } = await supabase.from('chat_feedback').insert({
    city_id: city.id,
    profile_id: auth.user?.id ?? null,
    session_local_id: parsed.data.sessionLocalId,
    rating: parsed.data.rating,
    query: parsed.data.query,
    response_text: parsed.data.responseText ?? null,
    response_blocks: responseBlocksJson,
    conversation: conversationJson,
    comment: parsed.data.comment?.trim() || null,
    page_context: null,
    channel: 'mobile',
  });

  if (error) {
    console.error('[mobile chat_feedback]', error);
    return NextResponse.json({ error: error.code ?? 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

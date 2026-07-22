import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { askCityAgent } from '@/lib/ai/city-agent-client';
import { getCityBySlug } from '@/lib/cities';
import { chatSearch } from '@/lib/search/semantic';
import type { ChatResult } from '@/lib/search/types';

export const runtime = 'nodejs';

const bodySchema = z.object({
  query: z.string().min(2).max(500).trim(),
  conversation: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string(),
      }),
    )
    .max(20)
    .optional(),
  pageContext: z.string().max(200).nullable().optional(),
  isFirstMessage: z.boolean().optional(),
});

async function askAssistant(
  citySlug: string,
  input: z.infer<typeof bodySchema>,
): Promise<ChatResult | { error: string }> {
  const city = await getCityBySlug(citySlug);
  if (!city) {
    return { error: 'city not found' };
  }

  const start = Date.now();
  const isFirstMessage =
    input.isFirstMessage ?? (input.conversation ?? []).length === 0;

  const agentResult = await askCityAgent({
    citySlug: city.slug,
    query: input.query,
    conversation: input.conversation ?? [],
    pageContext: input.pageContext ?? null,
    isFirstMessage,
  });

  if (agentResult && agentResult.blocks.length > 0) {
    return {
      queryId: null,
      answer: null,
      hits: [],
      blocks: agentResult.blocks,
      latencyMs: Date.now() - start,
      aiNotice: {
        label: 'Resumido por IA — sujeito a verificação',
        href: null,
      },
      title: isFirstMessage ? agentResult.title : null,
      cta: agentResult.cta,
    };
  }

  const searchResult = await chatSearch(input.query, city.id);

  if (!searchResult.answer && searchResult.hits.length === 0) {
    return {
      queryId: null,
      answer:
        'Não consegui encontrar o que você procura. Pode tentar reformular ou dar mais detalhes?',
      hits: [],
      latencyMs: Date.now() - start,
    };
  }

  return searchResult;
}

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

  const result = await askAssistant(citySlug, parsed.data);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    ...result,
    city: { slug: citySlug },
  });
}

'use server';

import { z } from 'zod';
import { askCityAgent } from '@/lib/ai/city-agent-client';
import { getCurrentCity } from '@/lib/cities';
import { chatSearch } from '@/lib/search/semantic';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import type { ChatResult } from '@/lib/search/types';

const askSchema = z.object({
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

export async function askCityAction(input: unknown): Promise<ChatResult> {
  const parsed = askSchema.safeParse(input);
  if (!parsed.success) {
    return { queryId: null, answer: null, hits: [], latencyMs: 0 };
  }

  const city = await getCurrentCity();
  if (!city) {
    return { queryId: null, answer: null, hits: [], latencyMs: 0 };
  }

  const start = Date.now();
  const isFirstMessage =
    parsed.data.isFirstMessage ?? (parsed.data.conversation ?? []).length === 0;

  const agentResult = await askCityAgent({
    citySlug: city.slug,
    query: parsed.data.query,
    conversation: parsed.data.conversation ?? [],
    pageContext: parsed.data.pageContext ?? null,
    isFirstMessage,
  });

  // Agente retornou blocks JSON estruturados
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

  // Fallback: busca semântica direta
  const searchResult = await chatSearch(parsed.data.query, city.id);

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

const feedbackSchema = z.object({
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
  pageContext: z.string().max(200).nullable().optional(),
});

export async function submitChatFeedback(
  input: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'no_city' };

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
    page_context: parsed.data.pageContext ?? null,
    channel: 'web',
  });

  if (error) {
    console.error('[chat_feedback] insert error', error);
    return { ok: false, error: error.code ?? 'db_error' };
  }
  return { ok: true };
}

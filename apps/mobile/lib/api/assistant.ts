import { env } from '@/lib/env';
import type { AssistantChatResult } from '@/lib/chat/types';
import { mobileDebug } from '@/lib/debug';

export type AskAssistantInput = {
  query: string;
  conversation?: Array<{ role: 'user' | 'assistant'; text: string }>;
  isFirstMessage?: boolean;
  pageContext?: string | null;
  citySlug?: string;
};

const FALLBACK: AssistantChatResult = {
  queryId: null,
  answer: 'Não consegui responder agora. Tente novamente em alguns segundos.',
  hits: [],
  latencyMs: 0,
};

export async function askAssistant(input: AskAssistantInput): Promise<AssistantChatResult> {
  const citySlug = input.citySlug ?? env.defaultCitySlug;
  const url = `${env.webBaseUrl}/api/mobile/assistant?city=${encodeURIComponent(citySlug)}`;

  try {
    const startedAt = Date.now();
    mobileDebug('assistant', 'POST start', {
      url,
      citySlug,
      queryLength: input.query.length,
      conversationLength: input.conversation?.length ?? 0,
      isFirstMessage: input.isFirstMessage ?? null,
      hasPageContext: Boolean(input.pageContext),
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: input.query,
        conversation: input.conversation,
        isFirstMessage: input.isFirstMessage,
        pageContext: input.pageContext ?? null,
      }),
    });

    const contentType = res.headers.get('content-type') ?? '';
    mobileDebug('assistant', 'POST response', {
      url,
      status: res.status,
      ok: res.ok,
      contentType,
      latencyMs: Date.now() - startedAt,
    });

    if (!res.ok) {
      const body = await readResponsePreview(res);
      mobileDebug('assistant', 'POST failed', { url, status: res.status, body });
      return FALLBACK;
    }

    if (!contentType.includes('application/json')) {
      const body = await readResponsePreview(res);
      mobileDebug('assistant', 'unexpected content-type', { url, contentType, body });
      return FALLBACK;
    }

    const result = (await res.json()) as AssistantChatResult;
    mobileDebug('assistant', 'POST parsed', {
      hasAnswer: Boolean(result.answer),
      blocks: result.blocks?.length ?? 0,
      hits: result.hits?.length ?? 0,
      latencyMs: result.latencyMs,
      queryId: result.queryId,
    });
    return result;
  } catch (error) {
    mobileDebug('assistant', 'network error', error);
    return FALLBACK;
  }
}

async function readResponsePreview(res: Response): Promise<string | null> {
  try {
    return (await res.text()).slice(0, 800);
  } catch {
    return null;
  }
}

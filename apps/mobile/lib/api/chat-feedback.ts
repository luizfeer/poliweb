import type { AgentBlock } from '@/lib/chat/types';
import { env } from '@/lib/env';

export type SubmitChatFeedbackInput = {
  sessionLocalId: string;
  rating: 'up' | 'down';
  query: string;
  responseText: string | null;
  responseBlocks?: AgentBlock[];
  conversation?: Array<{ role: 'user' | 'assistant'; text: string }>;
  comment?: string | null;
  citySlug?: string;
};

export async function submitChatFeedback(
  input: SubmitChatFeedbackInput,
): Promise<{ ok: boolean; error?: string }> {
  const citySlug = input.citySlug ?? env.defaultCitySlug;
  const url = `${env.webBaseUrl}/api/mobile/chat-feedback?city=${encodeURIComponent(citySlug)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionLocalId: input.sessionLocalId,
        rating: input.rating,
        query: input.query,
        responseText: input.responseText,
        responseBlocks: input.responseBlocks,
        conversation: input.conversation,
        comment: input.comment ?? null,
      }),
    });

    if (!res.ok) {
      if (__DEV__) console.warn(`[submitChatFeedback] ${res.status}`);
      return { ok: false, error: `http_${res.status}` };
    }

    const json = (await res.json()) as { ok?: boolean };
    return { ok: json.ok === true };
  } catch (error) {
    if (__DEV__) console.warn('[submitChatFeedback]', error);
    return { ok: false, error: 'network' };
  }
}

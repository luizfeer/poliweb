import { plainTextFromBlocks } from '@/lib/chat/plain-text';
import type { MessageFeedbackContext, StoredMessage } from '@/lib/chat/types';

function messageToHistoryLine(m: StoredMessage): { role: 'user' | 'assistant'; text: string } | null {
  if (m.role === 'user') {
    const t = m.text?.trim() ?? '';
    return t ? { role: 'user', text: t } : null;
  }
  const text = m.text?.trim() || plainTextFromBlocks(m.blocks);
  return text ? { role: 'assistant', text } : null;
}

export function buildFeedbackContext(
  messages: StoredMessage[],
  assistantIndex: number,
  sessionLocalId: string | null,
): MessageFeedbackContext | undefined {
  if (!sessionLocalId) return undefined;
  const msg = messages[assistantIndex];
  if (!msg || msg.role !== 'assistant') return undefined;

  const prevUser = [...messages.slice(0, assistantIndex)]
    .reverse()
    .find((m) => m.role === 'user' && m.text?.trim());
  if (!prevUser?.text) return undefined;

  const conversation = messages
    .slice(0, assistantIndex + 1)
    .map(messageToHistoryLine)
    .filter((m): m is { role: 'user' | 'assistant'; text: string } => m !== null)
    .slice(-10);

  return {
    sessionLocalId,
    query: prevUser.text.trim(),
    conversation,
  };
}

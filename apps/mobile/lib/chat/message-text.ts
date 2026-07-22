import { stripSimpleMarkdown } from '@/lib/chat/markdown';
import { plainTextFromBlocks } from '@/lib/chat/plain-text';
import type { StoredMessage } from '@/lib/chat/types';

function assistantPlainText(raw: string): string {
  const trimmed = raw.trim();
  return trimmed ? stripSimpleMarkdown(trimmed) : '';
}

export function getMessageCopyText(message: StoredMessage): string {
  if (message.role === 'user') {
    return message.text?.trim() ?? '';
  }

  const fromText = message.text?.trim() ?? '';
  if (fromText) return assistantPlainText(fromText);

  const fromBlocks = plainTextFromBlocks(message.blocks);
  if (fromBlocks) return assistantPlainText(fromBlocks);

  if (message.hits.length > 0) {
    return message.hits
      .map((h) => {
        const parts = [h.title, h.subtitle, h.description].filter(Boolean);
        return parts.join(' — ');
      })
      .join('\n');
  }

  return '';
}

export function buildShareText(message: StoredMessage, cityName: string): string {
  const body = getMessageCopyText(message);
  if (message.role === 'user') {
    return body;
  }
  return [`Resposta do assistente de ${cityName}:`, body].filter(Boolean).join('\n\n');
}

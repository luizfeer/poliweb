import type { ChatSession, StoredMessage } from '@/lib/chat/types';
import { plainTextFromBlocks } from '@/lib/chat/plain-text';
import { INBOX_FEATURES } from '@/lib/inbox/catalog';
import type { InboxThread } from '@/lib/inbox/types';

const PIN_TORMENTA = 'pinned-tormentaia';

function previewFromMessages(messages: StoredMessage[]): string {
  const last = messages[messages.length - 1];
  if (!last) return 'Toque para perguntar qualquer coisa sobre a cidade';
  if (last.role === 'user') return last.text ?? '';
  const text = last.text?.trim() || plainTextFromBlocks(last.blocks);
  return text.replace(/\s+/g, ' ').slice(0, 90);
}

type BuildArgs = {
  sessions: ChatSession[];
  cityName: string;
};

export function buildInboxThreads({ sessions, cityName }: BuildArgs): InboxThread[] {
  const aiSessions: InboxThread[] = sessions
    .filter((s) => s.messages.length > 0)
    .map((s) => ({
      id: `ai-${s.id}`,
      kind: 'ai' as const,
      title: s.title,
      subtitle: previewFromMessages(s.messages),
      updatedAt: s.updatedAt,
      unreadCount: 0,
      payload: { kind: 'ai', sessionId: s.id },
    }));

  const pinnedAi: InboxThread = {
    id: PIN_TORMENTA,
    kind: 'ai',
    title: 'TormentaIA',
    subtitle: `Assistente de ${cityName}`,
    updatedAt: Date.now(),
    unreadCount: 0,
    pinned: true,
    featureId: 'assistant',
    payload: { kind: 'ai', sessionId: '' },
  };

  const featureThreads: InboxThread[] = INBOX_FEATURES.filter((feature) => feature.id !== 'assistant').map(
    (feature) => ({
      id: `feature-${feature.id}`,
      kind: feature.kind,
      title: feature.title,
      subtitle: feature.subtitle,
      updatedAt: 0,
      unreadCount: 0,
      featureId: feature.id,
      comingSoon: feature.status === 'soon',
    }),
  );

  return [pinnedAi, ...aiSessions, ...featureThreads];
}

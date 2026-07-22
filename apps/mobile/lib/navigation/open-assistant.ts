import { router } from 'expo-router';

import { setPendingAssistantQuery } from '@/lib/chat/pending-query';

/** Abre o assistente como modal fullscreen por cima das tabs. */
export function openAssistantWithQuery(query: string): void {
  const q = query.trim();
  if (q.length < 2) {
    router.push('/assistente');
    return;
  }
  setPendingAssistantQuery(q);
  router.push({
    pathname: '/assistente',
    params: { q },
  });
}

export function openAssistant(): void {
  router.push('/assistente');
}

import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { ChatAssistantScreen } from '@/components/chat/ChatAssistantScreen';
import { normalizeRouteParam } from '@/lib/chat/route-params';

export default function AssistenteModalScreen() {
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const initialQuery = useMemo(() => normalizeRouteParam(params.q), [params.q]);

  return <ChatAssistantScreen initialQuery={initialQuery} presentation="modal" />;
}

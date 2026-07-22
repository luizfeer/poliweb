import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatSessionsDrawer } from '@/components/chat/ChatSessionsDrawer';
import { ChatWelcome } from '@/components/chat/ChatWelcome';
import { askAssistant } from '@/lib/api/assistant';
import { closeOverlay } from '@/lib/navigation/close-overlay';
import { fetchHome } from '@/lib/api/home';
import { buildFeedbackContext } from '@/lib/chat/feedback-context';
import { consumePendingAssistantQuery } from '@/lib/chat/pending-query';
import { plainTextFromBlocks } from '@/lib/chat/plain-text';
import {
  deleteSession as deleteSessionDb,
  generateSessionId,
  getAllSessions,
  getLastSessionId,
  makeSessionTitle,
  saveSession,
  setLastSessionId,
} from '@/lib/chat/storage';
import type { ChatSession, StoredMessage } from '@/lib/chat/types';
import { mobileDebug } from '@/lib/debug';
import { palette } from '@/lib/theme/tokens';

type Props = {
  /** `params.q` da rota (pode falhar em NativeTabs — usar também pending-query). */
  initialQuery?: string;
  /** 'modal' mostra chevron pra fechar; 'tab' esconde (não há pra onde voltar). */
  presentation?: 'modal' | 'tab';
};

const EMPTY_MESSAGES: StoredMessage[] = [];

function buildHistory(messages: StoredMessage[]) {
  return messages
    .map((m) => {
      if (m.role === 'user') {
        const t = m.text?.trim() ?? '';
        return t ? { role: 'user' as const, text: t } : null;
      }
      const text = m.text?.trim() || plainTextFromBlocks(m.blocks);
      return text ? { role: 'assistant' as const, text } : null;
    })
    .filter((m): m is { role: 'user' | 'assistant'; text: string } => m !== null)
    .slice(-10);
}

export function ChatAssistantScreen({ initialQuery, presentation = 'tab' }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [cityName, setCityName] = useState('Carmo do Rio Claro');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const ingestedQueriesRef = useRef<Set<string>>(new Set());
  const ingestingRef = useRef(false);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;
  const messages = activeSession?.messages ?? EMPTY_MESSAGES;

  useEffect(() => {
    fetchHome()
      .then((home) => {
        mobileDebug('assistant-screen', 'home loaded', {
          city: home.city?.slug ?? null,
          modules: home.city?.modules ?? [],
        });
        if (home.city?.name) setCityName(home.city.name);
      })
      .catch((error) => {
        mobileDebug('assistant-screen', 'home load failed', error);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const all = await getAllSessions();
      const persistedId = await getLastSessionId();
      mobileDebug('assistant-screen', 'sessions bootstrap', {
        count: all.length,
        persistedId,
      });

      if (persistedId && all.some((s) => s.id === persistedId)) {
        if (!cancelled) {
          setSessions(all);
          setActiveId(persistedId);
          setLoaded(true);
        }
        return;
      }

      const empty = all.find((s) => s.messages.length === 0);
      if (empty) {
        if (!cancelled) {
          setSessions(all);
          setActiveId(empty.id);
          setLoaded(true);
        }
        return;
      }

      const id = generateSessionId();
      const session: ChatSession = {
        id,
        title: 'Nova conversa',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveSession(session);
      if (!cancelled) {
        setSessions([session, ...all]);
        setActiveId(id);
        setLoaded(true);
      }
    }

    bootstrap().catch((error) => {
      mobileDebug('assistant-screen', 'sessions bootstrap failed', error);
      const id = generateSessionId();
      const session: ChatSession = {
        id,
        title: 'Nova conversa',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions([session]);
      setActiveId(id);
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeId) {
      setLastSessionId(activeId).catch(() => undefined);
    }
  }, [activeId]);

  const persistMessages = useCallback(
    async (sessionId: string, nextMessages: StoredMessage[], title?: string) => {
      let sessionToSave: ChatSession | null = null;
      setSessions((prev) => {
        const existing = prev.find((s) => s.id === sessionId);
        const session: ChatSession = {
          id: sessionId,
          title: title ?? existing?.title ?? makeSessionTitle(nextMessages),
          messages: nextMessages,
          createdAt: existing?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        };
        sessionToSave = session;
        const rest = prev.filter((s) => s.id !== sessionId);
        return [session, ...rest];
      });
      if (sessionToSave) {
        await saveSession(sessionToSave);
      }
    },
    [],
  );

  const runAssistant = useCallback(
    async (
      sessionId: string,
      text: string,
      nextMessages: StoredMessage[],
      history: ReturnType<typeof buildHistory>,
    ) => {
      setPending(true);
      mobileDebug('assistant-screen', 'run assistant start', {
        sessionId,
        textLength: text.length,
        nextMessages: nextMessages.length,
        history: history.length,
      });
      try {
        const result = await askAssistant({
          query: text,
          conversation: history,
          isFirstMessage: nextMessages.length === 1,
        });
        const assistantMsg: StoredMessage = {
          role: 'assistant',
          text: result.answer,
          hits: result.hits ?? [],
          blocks: result.blocks,
          cta: result.cta,
          aiNotice: result.aiNotice ?? null,
        };
        mobileDebug('assistant-screen', 'run assistant result', {
          sessionId,
          hasAnswer: Boolean(result.answer),
          blocks: result.blocks?.length ?? 0,
          hits: result.hits?.length ?? 0,
          hasTitle: Boolean(result.title),
          cta: result.cta?.length ?? 0,
        });
        await persistMessages(sessionId, [...nextMessages, assistantMsg], result.title ?? undefined);
      } catch (error) {
        mobileDebug('assistant-screen', 'run assistant failed', error);
        await persistMessages(sessionId, [
          ...nextMessages,
          {
            role: 'assistant',
            text: 'Não consegui responder agora. Tente novamente em alguns segundos.',
            hits: [],
          },
        ]);
      } finally {
        setPending(false);
      }
    },
    [persistMessages],
  );

  const startConversationWithQuery = useCallback(
    async (rawQuery: string) => {
      const q = rawQuery.trim();
      if (q.length < 2 || pending || ingestingRef.current) return;

      const ingestKey = q.toLowerCase();
      if (ingestedQueriesRef.current.has(ingestKey)) return;
      ingestedQueriesRef.current.add(ingestKey);
      ingestingRef.current = true;
      mobileDebug('assistant-screen', 'external query ingested', {
        queryLength: q.length,
      });

      const id = generateSessionId();
      const userMsg: StoredMessage = { role: 'user', text: q, hits: [] };
      const session: ChatSession = {
        id,
        title: makeSessionTitle([userMsg]),
        messages: [userMsg],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveSession(session);
      setSessions((prev) => [session, ...prev.filter((s) => s.id !== id)]);
      setActiveId(id);

      try {
        await runAssistant(id, q, [userMsg], []);
      } finally {
        ingestingRef.current = false;
      }
    },
    [pending, runAssistant],
  );

  const tryIngestExternalQuery = useCallback(() => {
    if (!loaded || pending) return;
    const pendingQ = consumePendingAssistantQuery();
    const routeQ = initialQuery?.trim();
    const q = pendingQ ?? routeQ;
    if (!q || q.length < 2) return;
    mobileDebug('assistant-screen', 'external query detected', {
      source: pendingQ ? 'pending-query' : 'route',
      queryLength: q.length,
    });
    void startConversationWithQuery(q);
  }, [initialQuery, loaded, pending, startConversationWithQuery]);

  useEffect(() => {
    if (loaded) tryIngestExternalQuery();
  }, [loaded, tryIngestExternalQuery]);

  useFocusEffect(
    useCallback(() => {
      tryIngestExternalQuery();
    }, [tryIngestExternalQuery]),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, pending]);

  const handleSend = useCallback(
    (text: string) => {
      if (!activeId || pending) return;
      const userMsg: StoredMessage = { role: 'user', text, hits: [] };
      const nextMessages = [...messages, userMsg];
      void persistMessages(activeId, nextMessages);
      void runAssistant(activeId, text, nextMessages, buildHistory(messages));
    },
    [activeId, pending, messages, persistMessages, runAssistant],
  );

  const handleNewChat = useCallback(async () => {
    ingestedQueriesRef.current.clear();
    const id = generateSessionId();
    const session: ChatSession = {
      id,
      title: 'Nova conversa',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveSession(session);
    setSessions((prev) => [session, ...prev]);
    setActiveId(id);
    setDrawerOpen(false);
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveId(id);
    setDrawerOpen(false);
  }, []);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await deleteSessionDb(id);
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (id === activeId) {
          const fallback = next[0];
          if (fallback) {
            setActiveId(fallback.id);
          } else {
            const empty: ChatSession = {
              id: generateSessionId(),
              title: 'Nova conversa',
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            void saveSession(empty);
            setActiveId(empty.id);
            return [empty];
          }
        }
        return next;
      });
    },
    [activeId],
  );

  const handleClose = useCallback(() => {
    closeOverlay();
  }, []);

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator color={palette.cerrado700} />
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = messages.length === 0;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#F7F2EA', '#EFEAE2', '#E8E2D6']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          {presentation === 'modal' ? (
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Fechar assistente"
              hitSlop={8}
            >
              <Ionicons name="chevron-down" size={26} color={palette.ink700} />
            </Pressable>
          ) : (
            <View style={styles.iconBtnPlaceholder} />
          )}

          <View style={styles.headerTitleRow}>
            <Ionicons name="sparkles" size={18} color={palette.cerrado700} />
            <Text style={styles.headerTitle}>TormentaIA</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setDrawerOpen(true)}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Histórico de conversas"
              hitSlop={8}
            >
              <Ionicons name="time-outline" size={22} color={palette.ink700} />
            </Pressable>
            <Pressable
              onPress={() => void handleNewChat()}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Nova conversa"
              hitSlop={8}
            >
              <Ionicons name="create-outline" size={22} color={palette.ink700} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {isEmpty ? (
            <ChatWelcome cityName={cityName} disabled={pending} onPick={handleSend} />
          ) : (
            <View style={styles.messages}>
              {messages.map((msg, index) => (
                <ChatMessageBubble
                  key={`${index}-${msg.role}`}
                  message={msg}
                  cityName={cityName}
                  feedbackContext={buildFeedbackContext(messages, index, activeId)}
                />
              ))}
              {pending ? (
                <ChatMessageBubble
                  message={{ role: 'assistant', text: null, hits: [] }}
                  cityName={cityName}
                  isLoading
                />
              ) : null}
            </View>
          )}
        </ScrollView>

        <ChatComposer
          placeholder={`Pergunte sobre ${cityName}…`}
          disabled={pending}
          onSend={handleSend}
        />
      </SafeAreaView>

      <ChatSessionsDrawer
        open={drawerOpen}
        sessions={sessions}
        activeId={activeId}
        onClose={() => setDrawerOpen(false)}
        onSelect={handleSelectSession}
        onNew={handleNewChat}
        onDelete={handleDeleteSession}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EFEAE2' },
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.ink100,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: palette.ink900 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 8, borderRadius: 999 },
  iconBtnPlaceholder: { width: 40, height: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, paddingVertical: 8, flexGrow: 1 },
  messages: { gap: 10, paddingBottom: 8 },
});

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, MessageSquare } from 'lucide-react';
import type { ChatSession, StoredMessage } from '@/lib/chat/storage';
import {
  deleteSession,
  generateSessionId,
  getAllSessions,
  LAST_SESSION_STORAGE_KEY,
  makeSessionTitle,
  saveSession,
} from '@/lib/chat/storage';
import { ChatSidebar } from './chat-sidebar';
import { ChatConversation } from './chat-conversation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

type Props = {
  cityName: string;
  initialQuery?: string;
  initialSessionId?: string | null;
  /** Se true, o chat está embutido no widget flutuante */
  embedded?: boolean;
};

export function ChatApp({ cityName, initialQuery, initialSessionId, embedded = false }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialSessionId ?? null);
  const [autoSubmitSessionId, setAutoSubmitSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllSessions()
      .then(async (all) => {
        const q = initialQuery?.trim();
        if (q && q.length >= 2 && !initialSessionId) {
          const id = generateSessionId();
          const msg: StoredMessage = { role: 'user', text: q, hits: [] };
          const session: ChatSession = {
            id,
            title: makeSessionTitle([msg]),
            messages: [msg],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await saveSession(session);
          setSessions([session, ...all]);
          setActiveId(id);
          setAutoSubmitSessionId(id);
          setLoaded(true);
          return;
        }

        if (initialSessionId && all.some((s) => s.id === initialSessionId)) {
          setSessions(all);
          setActiveId(initialSessionId);
          setLoaded(true);
          return;
        }

        const persistedId =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(LAST_SESSION_STORAGE_KEY)
            : null;
        if (persistedId && all.some((s) => s.id === persistedId)) {
          setSessions(all);
          setActiveId(persistedId);
          setLoaded(true);
          return;
        }

        const emptyExisting = all.find((s) => s.messages.length === 0);
        if (emptyExisting) {
          setSessions(all);
          setActiveId(emptyExisting.id);
          setLoaded(true);
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
        setSessions([session, ...all]);
        setActiveId(id);
        setLoaded(true);
      })
      .catch(() => {
        // Fallback se indexedDB falhar (modo privado, quota etc.)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeId) {
      window.localStorage.setItem(LAST_SESSION_STORAGE_KEY, activeId);
    }
  }, [activeId]);

  useEffect(() => {
    if (!loaded || activeSession) return;
    const emptyExisting = sessions.find((s) => s.messages.length === 0);
    if (emptyExisting) {
      queueMicrotask(() => setActiveId(emptyExisting.id));
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
    queueMicrotask(() => {
      setSessions((prev) => [session, ...prev]);
      setActiveId(id);
    });
  }, [loaded, activeSession, sessions]);

  const persistSession = useCallback(
    async (id: string, messages: StoredMessage[]) => {
      const existing = sessions.find((s) => s.id === id);
      const session: ChatSession = {
        id,
        title: existing?.title ?? makeSessionTitle(messages),
        messages,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      await saveSession(session);
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== id);
        return [session, ...filtered];
      });
    },
    [sessions],
  );

  function handleNewSession() {
    const id = generateSessionId();
    const session: ChatSession = {
      id,
      title: 'Nova conversa',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [session, ...prev]);
    setActiveId(id);
    setSidebarOpen(false);
  }

  function handleSelectSession(id: string) {
    if (embedded) {
      router.push(`/assistente?id=${encodeURIComponent(id)}`);
      return;
    }
    setActiveId(id);
    setSidebarOpen(false);
  }

  async function handleDeleteSession(id: string) {
    await deleteSession(id);
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeId === id) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LAST_SESSION_STORAGE_KEY);
      }
      setActiveId(remaining[0]?.id ?? null);
    }
  }

  function handleMessagesChange(messages: StoredMessage[]) {
    if (!activeId) return;
    setAutoSubmitSessionId((current) => (current === activeId ? null : current));
    setSessions((prev) => prev.map((s) => (s.id === activeId ? { ...s, messages } : s)));
    persistSession(activeId, messages);
  }

  function handleTitleSuggested(title: string) {
    if (!activeId) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    setSessions((prev) => {
      const next = prev.map((s) =>
        s.id === activeId ? { ...s, title: trimmed, updatedAt: Date.now() } : s,
      );
      const updated = next.find((s) => s.id === activeId);
      if (updated) void saveSession(updated);
      return next;
    });
  }

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center bg-[#efeae2]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#008069] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#efeae2]">
      <ChatSidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={handleSelectSession}
        onNew={handleNewSession}
        onDelete={handleDeleteSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        embedded={embedded}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {!embedded && (
          <Link
            href="/comercio/cadastro"
            className="flex shrink-0 items-center justify-between gap-2 bg-[#d9fdd3] px-3 py-1.5 text-[12px] text-[#075e54] hover:bg-[#c8f5be] sm:px-4"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles size={14} />1 mês grátis pro seu comércio no Portal Carmelitano
            </span>
            <span className="text-[11px] underline underline-offset-2">Cadastrar →</span>
          </Link>
        )}
        {/* Top bar */}
        <div className="flex h-[60px] shrink-0 items-center gap-3 bg-[#008069] px-3 sm:px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 ${embedded ? '' : 'sm:hidden'}`}
            aria-label="Abrir conversas"
          >
            <Menu size={20} />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#075e54]">
            <MessageSquare size={18} className="text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[16px] font-semibold text-white">
              {activeSession?.title ?? 'Assistente'}
            </h1>
            <p className="truncate text-[12px] text-[#d1d7db]">
              {activeSession ? `${activeSession.messages.length} mensagens` : cityName}
            </p>
          </div>
        </div>

        {activeSession ? (
          <ChatConversation
            cityName={cityName}
            sessionId={activeSession.id}
            messages={activeSession.messages}
            onMessagesChange={handleMessagesChange}
            onTitleSuggested={handleTitleSuggested}
            autoSubmitLastUser={activeSession.id === autoSubmitSessionId}
            embedded={embedded}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#efeae2] px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d9fdd3]">
              <MessageSquare size={28} className="text-[#008069]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#111b21]">Assistente de {cityName}</h2>
              <p className="mt-1 text-sm text-[#667781]">
                Selecione uma conversa ao lado ou inicie uma nova.
              </p>
            </div>
            <button
              type="button"
              onClick={handleNewSession}
              className="rounded-full bg-[#008069] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
            >
              Nova conversa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

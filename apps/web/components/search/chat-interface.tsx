'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Send, X } from 'lucide-react';
import { askCityAction } from '@/app/assistente/actions';
import { plainTextFromBlocks } from '@/lib/chat/conversation-text';
import type { ChatMessage } from '@/lib/search/types';
import { ChatBubble } from './chat-bubble';

type Props = {
  cityName: string;
  /** Preenchido a partir de ?q= na URL (ex.: chips da home) */
  initialQuery?: string;
  /** Contexto da página atual para o agente (ex.: "Usuário está na pousada X") */
  pageContext?: string;
  /** Callback para fechar o widget quando embutido */
  onClose?: () => void;
};

const SUGGESTIONS = [
  'Quais pousadas ficam perto do lago?',
  'Tem restaurante com delivery?',
  'Qual o horário da coleta de lixo?',
  'Próximos eventos na cidade?',
];

export function ChatInterface({ cityName, initialQuery, pageContext, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const appliedInitialQueryRef = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** URL ?q= — preenche o campo (evita links aninhados na home; usuário envia com um toque) */
  useEffect(() => {
    const q = initialQuery?.trim();
    if (!q || q.length < 2) return;
    if (appliedInitialQueryRef.current === q) return;
    appliedInitialQueryRef.current = q;
    setInput(q);
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(q.length, q.length);
    });
    return () => cancelAnimationFrame(id);
  }, [initialQuery]);

  function handleSend(query: string) {
    const text = query.trim();
    if (!text || isPending) return;

    setInput('');

    // Monta histórico para enviar ao agente (mensagens anteriores)
    const conversation = messages
      .map((m) => {
        if (m.role === 'user') {
          const t = m.text?.trim();
          return t ? { role: 'user' as const, text: t } : null;
        }
        const t = (m.text?.trim() || plainTextFromBlocks(m.blocks)) || '';
        return t ? { role: 'assistant' as const, text: t } : null;
      })
      .filter((x): x is { role: 'user' | 'assistant'; text: string } => x !== null);

    setMessages((prev) => [...prev, { role: 'user', text, hits: [] }]);

    startTransition(async () => {
      const result = await askCityAction({ query: text, conversation, pageContext });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: result.answer,
          hits: result.hits,
          blocks: result.blocks,
          aiNotice: result.aiNotice,
          entityStatus: result.entityStatus,
          entityDetails: result.entityDetails,
        },
      ]);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden sm:gap-4">
      <div className="flex shrink-0 items-center justify-between pt-1 sm:pt-2">
        <div className="flex-1 text-center">
          {isEmpty ? (
            <h1 className="text-lg font-bold sm:text-xl">Olá! Posso ajudar?</h1>
          ) : (
            <h2 className="text-base font-semibold sm:text-lg">Assistente de {cityName}</h2>
          )}
          <p className="text-muted-foreground text-xs">
            {isEmpty
              ? `Pergunte sobre comércio, turismo, eventos e serviços de ${cityName}.`
              : 'Respostas baseadas em dados locais'}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground -mr-1 shrink-0 rounded-lg p-1.5 transition-colors"
            aria-label="Fechar assistente"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] sm:gap-3">
        {isEmpty ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 py-4 sm:gap-6 sm:py-8">
            <div className="flex w-full max-w-lg flex-col items-stretch gap-2 px-1 sm:flex-row sm:flex-wrap sm:justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  disabled={isPending}
                  className="border-border bg-background hover:bg-muted touch-manipulation rounded-full border px-4 py-2.5 text-left text-sm leading-snug transition-colors disabled:opacity-50 sm:text-center"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} isLoading={false} cityName={cityName} />
            ))}
            {isPending && (
              <ChatBubble message={{ role: 'assistant', text: null, hits: [] }} isLoading cityName={cityName} />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-border bg-background flex shrink-0 items-end gap-2 rounded-2xl border p-2 shadow-sm">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva sua pergunta…"
          rows={1}
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="on"
          className="placeholder:text-muted-foreground max-h-[min(120px,35svh)] min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-[16px] leading-normal outline-none md:text-sm"
          disabled={isPending}
        />
        <button
          type="button"
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isPending}
          className="bg-primary text-primary-foreground flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-opacity disabled:opacity-40 sm:h-9 sm:w-9"
          aria-label="Enviar"
        >
          <Send size={18} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </div>
  );
}

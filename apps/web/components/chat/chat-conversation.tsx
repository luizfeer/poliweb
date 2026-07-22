'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Landmark, Mountain, Ship, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { askCityAction } from '@/app/assistente/actions';
import { plainTextFromBlocks } from '@/lib/chat/conversation-text';
import type { StoredMessage } from '@/lib/chat/storage';
import { ChatBubble } from './chat-bubble';
import { ChatInput } from './chat-input';

type Props = {
  cityName: string;
  sessionId: string;
  messages: StoredMessage[];
  onMessagesChange: (messages: StoredMessage[]) => void;
  onTitleSuggested?: (title: string) => void;
  autoSubmitLastUser?: boolean;
  embedded?: boolean;
};

type Suggestion = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  query: string;
  accent: string;
  iconBg: string;
  iconColor: string;
};

const SUGGESTIONS: Suggestion[] = [
  {
    icon: Ship,
    title: 'Horários da balsa',
    subtitle: 'Travessias do dia',
    query: 'Quais os horários da balsa hoje?',
    accent: 'from-sky-50 to-white',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    icon: Landmark,
    title: 'Conheça o Carmo',
    subtitle: 'História e atrações',
    query: 'Me conta sobre Carmo do Rio Claro: o que conhecer e principais atrações.',
    accent: 'from-emerald-50 to-white',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Mountain,
    title: 'Conheça Itaci',
    subtitle: 'Distrito da serra',
    query: 'Me conta sobre o distrito de Itaci: o que tem pra fazer e como chegar.',
    accent: 'from-amber-50 to-white',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
  },
  {
    icon: UtensilsCrossed,
    title: 'Restaurantes',
    subtitle: 'Onde comer hoje',
    query: 'Quais restaurantes recomendados pra comer hoje?',
    accent: 'from-rose-50 to-white',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
];

function buildHistory(sourceMessages: StoredMessage[]) {
  return sourceMessages
    .map((m) => {
      if (m.role === 'user') {
        const t = typeof m.text === 'string' ? m.text.trim() : '';
        return t ? { role: 'user' as const, text: t } : null;
      }
      const fromAnswer = typeof m.text === 'string' ? m.text.trim() : '';
      const fromBlocks = plainTextFromBlocks(m.blocks);
      const text = fromAnswer || fromBlocks;
      return text ? { role: 'assistant' as const, text } : null;
    })
    .filter((m): m is { role: 'user' | 'assistant'; text: string } => m !== null)
    .slice(-10);
}

export function ChatConversation({
  cityName,
  sessionId,
  messages,
  onMessagesChange,
  onTitleSuggested,
  autoSubmitLastUser = false,
  embedded,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [inputFocusSignal, setInputFocusSignal] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(messages.length);
  const autoSubmittedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isPending) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const previousCount = previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;
    if (messages.length <= previousCount) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      requestAnimationFrame(() => {
        const container = containerRef.current;
        const assistantMessages = container?.querySelectorAll('[data-assistant-message="true"]');
        const latest = assistantMessages?.[assistantMessages.length - 1];
        latest?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  const requestAssistant = useCallback(
    (
      text: string,
      nextMessages: StoredMessage[],
      history: Array<{ role: 'user' | 'assistant'; text: string }>,
    ) => {
      const isFirstMessage = nextMessages.length === 1;

      startTransition(async () => {
        try {
          const result = await askCityAction({
            query: text,
            conversation: history,
            isFirstMessage,
          });
          const assistantMsg: StoredMessage = {
            role: 'assistant',
            text: result.answer,
            hits: result.hits as unknown[],
            blocks: result.blocks,
            cta: result.cta,
            aiNotice: result.aiNotice ?? null,
          };
          onMessagesChange([...nextMessages, assistantMsg]);
          setInputFocusSignal((value) => value + 1);
          if (isFirstMessage && result.title && onTitleSuggested) {
            onTitleSuggested(result.title);
          }
        } catch {
          onMessagesChange([
            ...nextMessages,
            {
              role: 'assistant',
              text: 'Não consegui responder agora. Tente novamente em alguns segundos.',
              hits: [],
            },
          ]);
        }
      });
    },
    [onMessagesChange, onTitleSuggested, startTransition],
  );

  useEffect(() => {
    if (!autoSubmitLastUser || isPending) return;
    const lastMessage = messages[messages.length - 1];
    const text = lastMessage?.role === 'user' ? lastMessage.text?.trim() : '';
    if (!text) return;
    const key = `${sessionId}:${messages.length}:${text}`;
    if (autoSubmittedRef.current === key) return;
    autoSubmittedRef.current = key;
    requestAssistant(text, messages, buildHistory(messages.slice(0, -1)));
  }, [autoSubmitLastUser, isPending, messages, requestAssistant, sessionId]);

  function handleSend(query: string) {
    const text = query.trim();
    if (!text || isPending) return;

    const userMsg: StoredMessage = { role: 'user', text, hits: [] };
    const nextMessages = [...messages, userMsg];
    onMessagesChange(nextMessages);
    requestAssistant(text, nextMessages, buildHistory(messages));
  }

  const isEmpty = messages.length === 0;
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantIndex = i;
      break;
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#efeae2]">
      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain px-1 py-4 [-webkit-overflow-scrolling:touch]"
      >
        {isEmpty ? (
          <TormentaWelcome cityName={cityName} disabled={isPending} onPick={handleSend} />
        ) : (
          <>
            {messages.map((msg, i) => {
              const feedback =
                msg.role === 'assistant'
                  ? (() => {
                      const prevUser = [...messages.slice(0, i)]
                        .reverse()
                        .find((m) => m.role === 'user' && typeof m.text === 'string' && m.text);
                      if (!prevUser?.text) return undefined;
                      const history = messages
                        .slice(0, i)
                        .map((m) => {
                          const t =
                            typeof m.text === 'string' && m.text
                              ? m.text
                              : plainTextFromBlocks(m.blocks);
                          return t ? { role: m.role, text: t } : null;
                        })
                        .filter(
                          (m): m is { role: 'user' | 'assistant'; text: string } => m !== null,
                        )
                        .slice(-10);
                      return {
                        sessionLocalId: sessionId,
                        query: prevUser.text,
                        conversation: history,
                      };
                    })()
                  : undefined;
              const isLatestAssistant = msg.role === 'assistant' && i === lastAssistantIndex;
              return (
                <ChatBubble
                  key={i}
                  message={msg}
                  isLoading={false}
                  cityName={cityName}
                  feedback={feedback}
                  animateText={isLatestAssistant}
                />
              );
            })}
            {isPending && (
              <ChatBubble
                message={{ role: 'assistant', text: null, hits: [] }}
                isLoading
                cityName={cityName}
              />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        disabled={isPending}
        placeholder={`Pergunte sobre ${cityName}…`}
        embedded={embedded}
        focusSignal={inputFocusSignal}
      />
    </div>
  );
}

type WelcomeProps = {
  cityName: string;
  disabled: boolean;
  onPick: (query: string) => void;
};

function TormentaWelcome({ cityName, disabled, onPick }: WelcomeProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setStep(1), 900),
      setTimeout(() => setStep(2), 1900),
      setTimeout(() => setStep(3), 2700),
      setTimeout(() => setStep(4), 3300),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-2 py-4 sm:px-4">
      {/* Typing indicator (visible until first bubble appears) */}
      {step < 1 && <TypingBubble />}

      {/* Bubble 1: Apresentação */}
      {step >= 1 && (
        <WelcomeBubble delayClass="">
          <p className="text-[15px] leading-snug">
            Oi! Sou a <strong className="font-semibold text-[#008069]">TormentaIA</strong> ⛈️
            <br />
            Sua assistente do <strong className="font-semibold">{cityName}</strong>.
          </p>
        </WelcomeBubble>
      )}

      {/* Typing again before bubble 2 */}
      {step === 1 && <TypingBubble />}

      {/* Bubble 2: oferta de ajuda */}
      {step >= 2 && (
        <WelcomeBubble delayClass="">
          <p className="text-[15px] leading-snug">
            Posso te ajudar com roteiros, pousadas, restaurantes, pesca, eventos e o que mais rolar
            por aqui. Quer começar por algum desses?
          </p>
        </WelcomeBubble>
      )}

      {/* Suggestion cards, staggered */}
      {step >= 3 && (
        <div className="grid grid-cols-2 gap-2 px-2 pt-1 sm:px-4">
          {SUGGESTIONS.map((s, idx) => {
            const visible = step >= 3 + idx;
            const Icon = s.icon;
            return (
              <button
                key={s.query}
                type="button"
                onClick={() => onPick(s.query)}
                disabled={disabled || !visible}
                className={
                  `group flex touch-manipulation flex-col items-start gap-2 rounded-2xl border border-[#e9edef] bg-gradient-to-br ${s.accent} p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#008069]/40 hover:shadow-md disabled:opacity-50 ` +
                  (visible
                    ? 'animate-in fade-in slide-in-from-bottom-3 duration-300'
                    : 'pointer-events-none invisible')
                }
                style={visible ? { animationDelay: `${idx * 120}ms` } : undefined}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.iconBg} ${s.iconColor} transition-transform group-hover:scale-110`}
                >
                  <Icon size={18} />
                </span>
                <span className="space-y-0.5">
                  <span className="block text-[14px] font-semibold leading-tight text-[#111b21]">
                    {s.title}
                  </span>
                  <span className="block text-[12px] leading-tight text-[#667781]">
                    {s.subtitle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex justify-start px-2 duration-200 sm:px-4">
      <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
        <span className="flex gap-1">
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#8696a0] [animation-delay:0ms]" />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#8696a0] [animation-delay:150ms]" />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#8696a0] [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}

function WelcomeBubble({
  children,
  delayClass,
}: {
  children: React.ReactNode;
  delayClass?: string;
}) {
  return (
    <div
      className={
        'animate-in fade-in slide-in-from-bottom-3 flex justify-start px-2 duration-300 sm:px-4 ' +
        (delayClass ?? '')
      }
    >
      <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-[#111b21] shadow-sm sm:max-w-[80%]">
        {children}
      </div>
    </div>
  );
}

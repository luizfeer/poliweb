'use client';

import { useEffect, useState, startTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Backpack,
  BedDouble,
  BookOpen,
  CalendarDays,
  Fish,
  HelpCircle,
  Home,
  MapPin,
  Newspaper,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import type { StoredMessage } from '@/lib/chat/storage';
import { groupHitsByType, buildIntroText } from '@/lib/search/chat-formatter';
import type { HitGroup } from '@/lib/search/chat-formatter';
import { AgentResponseRenderer } from '@/components/search/agent-response-renderer';
import { ChatFeedback } from './chat-feedback';
import { ChatMessageActions } from './chat-message-actions';

type Props = {
  message: StoredMessage;
  isLoading?: boolean;
  cityName: string;
  /** Habilita 👍/👎 sob a resposta. Só assistant + não-loading. */
  feedback?: {
    sessionLocalId: string;
    query: string;
    conversation: Array<{ role: 'user' | 'assistant'; text: string }>;
  };
  animateText?: boolean;
};

const ICON_BY_TYPE: Record<string, React.ReactNode> = {
  faq: <HelpCircle size={14} className="shrink-0" />,
  attraction: <MapPin size={14} className="shrink-0" />,
  tourism_guide: <BookOpen size={14} className="shrink-0" />,
  accommodation: <BedDouble size={14} className="shrink-0" />,
  restaurant: <UtensilsCrossed size={14} className="shrink-0" />,
  fishing_guide: <Fish size={14} className="shrink-0" />,
  tour_package: <Backpack size={14} className="shrink-0" />,
  business: <Store size={14} className="shrink-0" />,
  event: <CalendarDays size={14} className="shrink-0" />,
  property: <Home size={14} className="shrink-0" />,
  classified: <Newspaper size={14} className="shrink-0" />,
};

function TypewriterText({ text, enabled }: { text: string; enabled: boolean }) {
  const [visibleText, setVisibleText] = useState(enabled ? '' : text);

  useEffect(() => {
    if (!enabled) {
      startTransition(() => {
        setVisibleText(text);
      });
      return;
    }

    startTransition(() => {
      setVisibleText('');
    });
    let index = 0;
    let timeoutId: number | undefined;
    const step = () => {
      index = Math.min(text.length, index + 3);
      setVisibleText(text.slice(0, index));
      if (index < text.length) {
        timeoutId = window.setTimeout(step, 14);
      }
    };
    timeoutId = window.setTimeout(step, 80);
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [enabled, text]);

  return (
    <p className="whitespace-pre-wrap">
      {visibleText}
      {enabled && visibleText.length < text.length ? (
        <span className="ml-0.5 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-sm bg-[#008069]" />
      ) : null}
    </p>
  );
}

export function ChatBubble({ message, isLoading, cityName, feedback, animateText }: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end px-2 sm:px-4">
        <div className="relative max-w-[85%] rounded-2xl rounded-br-sm bg-[#dcf8c6] px-4 py-2.5 text-[15px] leading-snug text-[#111b21] shadow-sm sm:max-w-[75%]">
          <p className="whitespace-pre-wrap">{message.text}</p>
          <span className="mt-1 block text-right text-[10px] text-[#667781]">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  }

  const groups = groupHitsByType((message.hits ?? []) as HitGroup['hits']);
  const intro = message.text ? null : buildIntroText(groups);
  const hasBlocks = Boolean(message.blocks && message.blocks.length > 0);

  return (
    <div className="relative flex justify-start px-2 sm:px-4" data-assistant-message="true">
      <div className="flex max-w-[96%] items-start gap-1 sm:max-w-[88%]">
        <div className="min-w-0 flex-1 space-y-2">
        {isLoading ? (
          <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-[15px] leading-snug text-[#111b21] shadow-sm">
            <span className="flex gap-1 px-1 py-2">
              <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#8696a0] [animation-delay:0ms]" />
              <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#8696a0] [animation-delay:150ms]" />
              <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#8696a0] [animation-delay:300ms]" />
            </span>
            <span className="mt-1 block text-right text-[10px] text-[#667781]">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ) : hasBlocks && message.blocks ? (
          <>
            <AgentResponseRenderer
              blocks={message.blocks}
              stackedAssistantBubbles
              animateText={animateText}
              className="[&_.text-muted-foreground]:text-[#667781] [&_.text-foreground]:text-[#111b21]"
            />
            <span className="block text-right text-[10px] text-[#667781]">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </>
        ) : (
          <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-[15px] leading-snug text-[#111b21] shadow-sm">
            {message.text ? (
              <div className="space-y-2">
                <TypewriterText text={message.text} enabled={Boolean(animateText)} />
              </div>
            ) : groups.length > 0 ? (
              <p className="font-medium text-[#111b21]">{intro}</p>
            ) : (
              <p className="text-[#667781]">
                Não encontrei nada para essa busca. Tente descrever de outro jeito.
              </p>
            )}
            <span className="mt-1 block text-right text-[10px] text-[#667781]">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {!isLoading && groups.length > 0 && (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <HitGroupSection key={group.entityType} group={group} />
            ))}
          </div>
        )}

        {!isLoading && message.cta && message.cta.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {message.cta.map((btn) => {
              const isExternal = btn.href.startsWith('http');
              const className =
                btn.variant === 'secondary'
                  ? 'rounded-full border border-[#008069] px-3 py-1.5 text-[12px] font-medium text-[#008069] transition-colors hover:bg-[#d9fdd3]'
                  : 'rounded-full bg-[#008069] px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition-transform active:scale-95';
              return isExternal ? (
                <a
                  key={btn.href}
                  href={btn.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {btn.label} →
                </a>
              ) : (
                <Link key={btn.href} href={btn.href} className={className}>
                  {btn.label} →
                </Link>
              );
            })}
          </div>
        )}

        {!isLoading && (message.text || groups.length > 0 || hasBlocks) && (
          <p className="px-1 text-[11px] text-[#8696a0]">
            {message.aiNotice?.label ?? 'Resumido por IA — sujeito a verificação'}
          </p>
        )}

        {!isLoading && feedback && (message.text || groups.length > 0 || hasBlocks) && (
          <ChatFeedback
            sessionLocalId={feedback.sessionLocalId}
            query={feedback.query}
            responseText={message.text}
            responseBlocks={message.blocks}
            conversation={feedback.conversation}
          />
        )}
        </div>

        {!isLoading && (message.text || hasBlocks) && (
          <ChatMessageActions text={message.text} blocks={message.blocks} cityName={cityName} />
        )}
      </div>
    </div>
  );
}

function HitGroupSection({ group }: { group: HitGroup }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 px-1">
        {ICON_BY_TYPE[group.entityType] ?? <MapPin size={14} className="shrink-0 text-[#8696a0]" />}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8696a0]">
          {group.label}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {group.hits.slice(0, 3).map((hit) => (
          <Link
            key={hit.entityId}
            href={hit.url}
            className="flex items-center gap-3 rounded-xl border border-[#e9edef] bg-white p-3 text-sm shadow-sm transition-colors hover:bg-[#f5f6f6]"
          >
            {hit.coverUrl && (
              <Image
                src={hit.coverUrl}
                alt={hit.title}
                width={48}
                height={48}
                unoptimized
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[#111b21]">{hit.title}</p>
              {hit.subtitle && <p className="truncate text-xs text-[#667781]">{hit.subtitle}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

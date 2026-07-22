'use client';

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
import type { ChatMessage } from '@/lib/search/types';
import { groupHitsByType, buildIntroText } from '@/lib/search/chat-formatter';
import type { HitGroup } from '@/lib/search/chat-formatter';
import { AgentResponseRenderer } from './agent-response-renderer';
import { ChatMessageActions } from '@/components/chat/chat-message-actions';

type Props = {
  message: ChatMessage;
  isLoading: boolean;
  cityName: string;
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

export function ChatBubble({ message, isLoading, cityName }: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm">
          {message.text}
        </div>
      </div>
    );
  }

  const groups = groupHitsByType(message.hits);
  const intro = message.text ? null : buildIntroText(groups);

  // Se veio blocks do agente, renderiza com componente dedicado
  if (message.blocks && message.blocks.length > 0) {
    return (
      <div className="relative flex justify-start" data-assistant-message="true">
        <div className="flex max-w-[90%] items-start gap-1">
          <div className="min-w-0 flex-1 space-y-3">
          <AgentResponseRenderer blocks={message.blocks} stackedAssistantBubbles />
          {!isLoading && (
            <p className="text-muted-foreground px-1 text-xs">
              {message.aiNotice?.label ?? 'Resumido por IA · sujeito a verificação'}
            </p>
          )}
          </div>
          {!isLoading && (
            <ChatMessageActions text={message.text} blocks={message.blocks} cityName={cityName} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex justify-start" data-assistant-message="true">
      <div className="flex max-w-[90%] items-start gap-1">
        <div className="min-w-0 flex-1 space-y-3">
        <div className="border-border bg-muted/40 rounded-2xl rounded-bl-sm border px-4 py-3 text-sm">
          {isLoading ? (
            <span className="flex gap-1">
              <span className="animate-bounce [animation-delay:0ms]">·</span>
              <span className="animate-bounce [animation-delay:150ms]">·</span>
              <span className="animate-bounce [animation-delay:300ms]">·</span>
            </span>
          ) : message.text ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
          ) : groups.length > 0 ? (
            <p className="text-foreground font-medium">{intro}</p>
          ) : (
            <p className="text-muted-foreground">
              Não consegui encontrar o que você procura. Pode tentar reformular ou dar mais
              detalhes?
            </p>
          )}
        </div>

        {!isLoading && groups.length > 0 && (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <HitGroupSection key={group.entityType} group={group} />
            ))}
          </div>
        )}

        {!isLoading && (message.text || groups.length > 0) && (
          <p className="text-muted-foreground px-1 text-xs">
            {message.aiNotice?.label ?? 'Resumido por IA · sujeito a verificação'}
          </p>
        )}
        </div>
        {!isLoading && message.text && (
          <ChatMessageActions text={message.text} blocks={message.blocks} cityName={cityName} />
        )}
      </div>
    </div>
  );
}

function HitGroupSection({ group }: { group: HitGroup }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        {ICON_BY_TYPE[group.entityType] ?? <MapPin size={14} className="shrink-0" />}
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          {group.label}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {group.hits.slice(0, 3).map((hit) => (
          <Link
            key={hit.entityId}
            href={hit.url}
            className="border-border bg-background hover:bg-muted flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors"
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
              <p className="truncate font-medium">{hit.title}</p>
              {hit.subtitle && (
                <p className="text-muted-foreground truncate text-xs">{hit.subtitle}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

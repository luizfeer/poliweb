'use client';

import { useState, useTransition } from 'react';
import { ThumbsUp, ThumbsDown, Check, X } from 'lucide-react';
import { submitChatFeedback } from '@/app/assistente/actions';
import { plainTextFromBlocks } from '@/lib/chat/conversation-text';
import type { AgentBlock } from '@/lib/ai/city-agent-client';

type Props = {
  sessionLocalId: string;
  query: string;
  responseText: string | null;
  responseBlocks?: AgentBlock[];
  conversation: Array<{ role: 'user' | 'assistant'; text: string }>;
};

type State = 'idle' | 'commenting' | 'sending' | 'done' | 'error';

export function ChatFeedback({
  sessionLocalId,
  query,
  responseText,
  responseBlocks,
  conversation,
}: Props) {
  const [state, setState] = useState<State>('idle');
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [, startTransition] = useTransition();

  function send(finalRating: 'up' | 'down', finalComment: string | null) {
    setState('sending');
    startTransition(async () => {
      const result = await submitChatFeedback({
        sessionLocalId,
        rating: finalRating,
        query,
        responseText: responseText ?? (plainTextFromBlocks(responseBlocks) || null),
        responseBlocks: responseBlocks ?? null,
        conversation,
        comment: finalComment,
      });
      setState(result.ok ? 'done' : 'error');
    });
  }

  function handleClick(value: 'up' | 'down') {
    setRating(value);
    if (value === 'up') {
      send('up', null);
    } else {
      setState('commenting');
    }
  }

  if (state === 'done') {
    return (
      <p className="px-1 text-[11px] text-[#667781]">
        <Check size={12} className="mr-1 inline" />
        Obrigado pelo feedback!
      </p>
    );
  }

  if (state === 'error') {
    return (
      <p className="px-1 text-[11px] text-[#ea0038]">
        Não consegui enviar — tente de novo mais tarde.
      </p>
    );
  }

  if (state === 'commenting' && rating === 'down') {
    return (
      <div className="flex items-stretch gap-2 rounded-xl border border-[#e9edef] bg-white p-2 shadow-sm">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="O que faltou? (opcional)"
          maxLength={500}
          autoFocus
          className="min-w-0 flex-1 bg-transparent px-2 text-[13px] text-[#111b21] outline-none placeholder:text-[#8696a0]"
          onKeyDown={(e) => {
            if (e.key === 'Enter') send('down', comment);
            if (e.key === 'Escape') setState('idle');
          }}
        />
        <button
          type="button"
          onClick={() => send('down', comment)}
          className="rounded-md bg-[#008069] px-3 text-[12px] font-medium text-white"
          aria-label="Enviar feedback"
        >
          Enviar
        </button>
        <button
          type="button"
          onClick={() => setState('idle')}
          className="rounded-md p-1 text-[#8696a0] hover:bg-[#f0f2f5]"
          aria-label="Cancelar"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  const sending = state === 'sending';

  return (
    <div className="flex items-center gap-1 px-1">
      <span className="text-[11px] text-[#8696a0]">Foi útil?</span>
      <button
        type="button"
        onClick={() => handleClick('up')}
        disabled={sending}
        className={`rounded-full p-1 transition-colors ${
          rating === 'up'
            ? 'bg-[#d9fdd3] text-[#008069]'
            : 'text-[#8696a0] hover:bg-[#f0f2f5] hover:text-[#008069]'
        } disabled:opacity-50`}
        aria-label="Resposta útil"
      >
        <ThumbsUp size={13} />
      </button>
      <button
        type="button"
        onClick={() => handleClick('down')}
        disabled={sending}
        className={`rounded-full p-1 transition-colors ${
          rating === 'down'
            ? 'bg-[#fde2e7] text-[#ea0038]'
            : 'text-[#8696a0] hover:bg-[#f0f2f5] hover:text-[#ea0038]'
        } disabled:opacity-50`}
        aria-label="Resposta ruim"
      >
        <ThumbsDown size={13} />
      </button>
    </div>
  );
}

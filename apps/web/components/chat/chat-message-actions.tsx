'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Forward } from 'lucide-react';
import type { AgentBlock } from '@/lib/ai/city-agent-client';
import { plainTextFromBlocks } from '@/lib/chat/conversation-text';

type Props = {
  text: string | null;
  blocks?: AgentBlock[];
  cityName: string;
};

function getPortalUrl() {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/assistente`;
}

function buildShareText(messageText: string, cityName: string) {
  const body = messageText.trim();
  const parts = [`Resposta do assistente de ${cityName}:`, body];
  return parts.filter(Boolean).join('\n\n');
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function ChatMessageActions({ text, blocks, cityName }: Props) {
  const [selectedText, setSelectedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const messageText = useMemo(() => {
    const fromText = typeof text === 'string' ? text.trim() : '';
    return fromText || plainTextFromBlocks(blocks);
  }, [blocks, text]);

  useEffect(() => {
    function handleSelectionChange() {
      const selection = window.getSelection();
      const rawText = selection?.toString().trim() ?? '';
      if (!rawText) {
        setSelectedText('');
        return;
      }

      const container = actionRef.current?.closest('[data-assistant-message="true"]');
      const anchorNode = selection?.anchorNode;
      const focusNode = selection?.focusNode;
      if (!container || !anchorNode || !focusNode) {
        setSelectedText('');
        return;
      }

      if (container.contains(anchorNode) && container.contains(focusNode)) {
        setSelectedText(rawText);
        return;
      }

      setSelectedText('');
    }

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    const container = actionRef.current?.closest('[data-assistant-message="true"]');
    if (!container) return;

    function clearLongPressTimer() {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    function isInteractiveTarget(target: EventTarget | null) {
      return target instanceof Element && Boolean(target.closest('a,button,input,textarea,select'));
    }

    function handlePointerDown(event: Event) {
      if (!(event instanceof PointerEvent)) return;
      if (event.button !== 0 || isInteractiveTarget(event.target)) return;
      clearLongPressTimer();
      longPressTimerRef.current = window.setTimeout(() => {
        setOpen(true);
        longPressTimerRef.current = null;
      }, 480);
    }

    function handlePointerEnd() {
      clearLongPressTimer();
    }

    function handleContextMenu(event: Event) {
      if (isInteractiveTarget(event.target)) return;
      event.preventDefault();
      clearLongPressTimer();
      setOpen(true);
    }

    function handleDocumentPointerDown(event: PointerEvent) {
      if (!open) return;
      const target = event.target;
      if (target instanceof Node && actionRef.current?.contains(target)) return;
      setOpen(false);
    }

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointerup', handlePointerEnd);
    container.addEventListener('pointercancel', handlePointerEnd);
    container.addEventListener('pointerleave', handlePointerEnd);
    container.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('pointerdown', handleDocumentPointerDown);

    return () => {
      clearLongPressTimer();
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerEnd);
      container.removeEventListener('pointercancel', handlePointerEnd);
      container.removeEventListener('pointerleave', handlePointerEnd);
      container.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, [open]);

  if (!messageText) return null;

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setOpen(false);
  }

  async function shareMessage() {
    const portalUrl = getPortalUrl();
    const shareText = buildShareText(messageText, cityName);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Assistente de ${cityName}`,
          text: shareText,
          url: portalUrl,
        });
      } catch (error) {
        if (!isAbortError(error)) await copyText(`${shareText}\n\nVeja no portal: ${portalUrl}`);
      }
      setOpen(false);
      return;
    }
    await copyText(`${shareText}\n\nVeja no portal: ${portalUrl}`);
  }

  return (
    <div ref={actionRef} className="pointer-events-none absolute right-3 top-1 z-30">
      {open ? (
        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-white px-1.5 py-1.5 text-[#111b21] shadow-lg ring-1 ring-black/10">
          <button
            type="button"
            onClick={() => void shareMessage()}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold text-[#667781] transition-colors hover:bg-[#f0f2f5]"
            aria-label="Encaminhar resposta"
          >
            <Forward size={15} aria-hidden="true" />
            Encaminhar
          </button>
          <span className="h-5 w-px bg-[#e9edef]" aria-hidden="true" />
          <button
            type="button"
            onClick={() => void copyText(selectedText || messageText)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold text-[#667781] transition-colors hover:bg-[#f0f2f5]"
            aria-label="Copiar resposta"
          >
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      ) : selectedText ? (
        <button
          type="button"
          onClick={() => void copyText(selectedText)}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-medium text-[#008069] shadow-sm ring-1 ring-black/10 transition-colors hover:bg-[#d9fdd3]"
          aria-label="Copiar texto selecionado"
        >
          {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          {copied ? 'Copiado' : 'Copiar seleção'}
        </button>
      ) : null}
    </div>
  );
}

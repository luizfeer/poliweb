'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Send,
  Mic,
  Plus,
  Store,
  MapPin,
  Wrench,
  Tag,
  CalendarDays,
  Users,
} from 'lucide-react';

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  embedded?: boolean;
  focusSignal?: number;
};

const QUICK_LINKS = [
  { label: 'Comércio', href: '/comercio', Icon: Store },
  { label: 'Turismo', href: '/turismo', Icon: MapPin },
  { label: 'Serviços', href: '/servicos', Icon: Wrench },
  { label: 'Classificados', href: '/classificados', Icon: Tag },
  { label: 'Agenda', href: '/agenda', Icon: CalendarDays },
  { label: 'Comunidade', href: '/comunidade', Icon: Users },
];

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((e: {
        resultIndex?: number;
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }>;
      }) => void)
    | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function ChatInput({ onSend, disabled, placeholder, focusSignal }: Props) {
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechBaseRef = useRef('');
  const speechFinalRef = useRef('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpeechSupported(getSpeechRecognitionCtor() !== null);
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [text]);

  useEffect(() => {
    if (disabled) return;
    const id = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [disabled, focusSignal]);

  function handleSubmit() {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function focusTextarea() {
    // Garante que o teclado (e o mic do iOS) abram com foco no campo
    textareaRef.current?.focus();
  }

  function startListening() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      // Fallback: foca o textarea — no iOS o usuário toca o mic do teclado
      focusTextarea();
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = 'pt-BR';
      rec.continuous = true;
      rec.interimResults = true;
      speechBaseRef.current = text.trim();
      speechFinalRef.current = '';
      rec.onresult = (e) => {
        let interimTranscript = '';
        for (let i = e.resultIndex ?? 0; i < e.results.length; i++) {
          const result = e.results[i];
          const transcript = result?.[0]?.transcript?.trim() ?? '';
          if (!transcript) continue;
          if (result.isFinal) {
            speechFinalRef.current = [speechFinalRef.current, transcript]
              .filter(Boolean)
              .join(' ');
          } else {
            interimTranscript = [interimTranscript, transcript].filter(Boolean).join(' ');
          }
        }
        const nextText = [speechBaseRef.current, speechFinalRef.current, interimTranscript]
          .filter(Boolean)
          .join(' ');
        setText(nextText);
      };
      rec.onerror = () => {
        setListening(false);
        focusTextarea();
      };
      rec.onend = () => {
        setListening(false);
        recognitionRef.current = null;
        focusTextarea();
      };
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <div className="relative">
      {/* Quick links menu */}
      {menuOpen && (
        <div className="absolute bottom-full left-0 right-0 z-20 mb-1 rounded-t-xl border border-[#e9edef] bg-white p-3 shadow-lg">
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-[#8696a0]">
            Ir para
          </p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_LINKS.map(({ label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#e9edef] bg-[#f0f2f5] px-2 py-3 text-[12px] font-medium text-[#111b21] transition-colors hover:bg-[#d9fdd3]"
              >
                <Icon size={20} className="text-[#008069]" />
                <span className="leading-none">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-[#d1d7db] bg-[#f0f2f5] px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
            menuOpen ? 'bg-[#d9fdd3] text-[#008069]' : 'text-[#54656f] hover:bg-[#d9dbde]'
          }`}
          aria-label="Atalhos do site"
        >
          <Plus size={22} />
        </button>

        <div className="flex min-h-[44px] flex-1 items-end rounded-lg bg-white px-3 py-2 shadow-sm">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={listening ? 'Ouvindo…' : placeholder ?? 'Mensagem'}
            rows={1}
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="on"
            inputMode="text"
            className="max-h-[160px] min-h-[20px] w-full resize-none bg-transparent text-[15px] leading-snug text-[#111b21] outline-none placeholder:text-[#667781]"
            disabled={disabled}
          />
        </div>

        {text.trim() && !listening ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50"
            aria-label="Enviar"
          >
            <Send size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
              listening
                ? 'bg-[#ea0038] text-white'
                : 'text-[#54656f] hover:bg-[#d9dbde]'
            }`}
            aria-label={
              listening
                ? 'Parar ditado'
                : speechSupported
                  ? 'Ditar mensagem'
                  : 'Abrir teclado (use o mic do teclado)'
            }
            title={
              speechSupported
                ? 'Ditado por voz'
                : 'Toque para abrir o teclado e use o mic do seu teclado'
            }
          >
            {listening ? (
              <>
                <span className="absolute inset-0 rounded-full bg-[#ea0038]/30 animate-ping" />
                <span className="absolute -inset-1 rounded-full border border-[#ea0038]/40" />
                <span className="relative flex h-5 items-end gap-0.5" aria-hidden="true">
                  <span className="h-2 w-0.5 animate-pulse rounded-full bg-white [animation-delay:0ms]" />
                  <span className="h-4 w-0.5 animate-pulse rounded-full bg-white [animation-delay:120ms]" />
                  <span className="h-3 w-0.5 animate-pulse rounded-full bg-white [animation-delay:240ms]" />
                  <span className="h-5 w-0.5 animate-pulse rounded-full bg-white [animation-delay:360ms]" />
                </span>
                <span className="sr-only">Parar ditado</span>
              </>
            ) : (
              <Mic size={20} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

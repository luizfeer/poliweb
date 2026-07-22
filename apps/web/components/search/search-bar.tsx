'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { himetricaTrack } from '@/lib/analytics/himetrica';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';

type Suggestion = {
  title: string;
  subtitle: string | null;
  href: string;
  entityType: string;
};

type SearchBarProps = {
  initialQuery?: string;
  compact?: boolean;
};

const placeholders = ['almoçar perto da praça', 'encanador', 'pousada com piscina'];

export function SearchBar({ initialQuery = '', compact = false }: SearchBarProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % placeholders.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSuggestionsOpen(false);
        return;
      }

      if (event.key === '/' && document.activeElement !== inputRef.current) {
        event.preventDefault();
        inputRef.current?.focus();
        setSuggestionsOpen(suggestions.length > 0);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [suggestions.length]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setSuggestionsOpen(false);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => response.json() as Promise<{ suggestions?: Suggestion[] }>)
        .then((data) => {
          const nextSuggestions = data.suggestions ?? [];
          setSuggestions(nextSuggestions);
          setSuggestionsOpen(document.activeElement === inputRef.current && nextSuggestions.length > 0);
        })
        .catch(() => {
          setSuggestions([]);
          setSuggestionsOpen(false);
        });
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function submit() {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    setSuggestionsOpen(false);
    himetricaTrack(HI_METRICA_EVENTS.search_submitted, {
      query_length: trimmed.length,
      scope: 'global',
    });
    startTransition(() => {
      router.push(`/buscar?q=${encodeURIComponent(trimmed)}`);
    });
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex w-full items-center gap-2 rounded-full bg-white px-3.5 py-2.5 text-left text-ink-900 shadow-sm"
      >
        <Search size={20} strokeWidth={2.5} className="shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim().length < 2) {
              setSuggestions([]);
              setSuggestionsOpen(false);
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0 && query.trim().length >= 2) {
              setSuggestionsOpen(true);
            }
          }}
          placeholder={placeholders[placeholderIndex]}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
        />
        <button
          type="submit"
          disabled={query.trim().length < 2 || isPending}
          className="rounded-full bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Buscar
        </button>
      </form>

      {suggestionsOpen && suggestions.length > 0 && !compact ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
            <p className="text-xs font-medium text-muted-foreground">Sugestões rápidas</p>
            <button
              type="button"
              onClick={() => setSuggestionsOpen(false)}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Fechar sugestões"
            >
              <X size={15} />
            </button>
          </div>
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.entityType}:${suggestion.title}`}
              type="button"
              onClick={() => {
                himetricaTrack(HI_METRICA_EVENTS.search_result_clicked, {
                  source: 'autocomplete',
                  entity_type: suggestion.entityType,
                  path: suggestion.href,
                });
                setQuery(suggestion.title);
                setSuggestionsOpen(false);
                router.push(suggestion.href);
              }}
              className="block w-full px-4 py-3 text-left hover:bg-accent"
            >
              <span className="block text-sm font-medium">{suggestion.title}</span>
              {suggestion.subtitle ? (
                <span className="block text-xs text-muted-foreground">{suggestion.subtitle}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Check, ChevronLeft, Search, Share2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MobileWebViewSectionBridge } from '@/components/carmo/mobile-webview-section-bridge';
import { SearchBar } from '@/components/search/search-bar';
import { cn } from '@/lib/utils';

export type DetailHeaderLink = {
  label: string;
  href: `#${string}`;
};

type DetailHeaderProps = {
  title: string;
  backHref?: string;
  backLabel?: string;
  links: DetailHeaderLink[];
  className?: string;
};

export function DetailHeader({
  title,
  backHref,
  backLabel = 'Voltar',
  links,
  className,
}: DetailHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const headerRef = useRef<HTMLElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const input = searchWrapperRef.current?.querySelector('input');
    window.setTimeout(() => input?.focus(), 0);
  }, [searchOpen]);

  async function sharePage() {
    const url = window.location.href;
    setCurrentUrl(url);
    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    await copyLink(url);
    setSharePanelOpen(true);
  }

  async function copyLink(url = window.location.href) {
    setCurrentUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setSharePanelOpen(true);
    }
  }

  function handleSectionClick(event: React.MouseEvent<HTMLAnchorElement>, href: `#${string}`) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;

    event.preventDefault();
    const headerBottom = Math.max(0, headerRef.current?.getBoundingClientRect().bottom ?? 0);
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(0, targetTop - headerBottom - 8),
      behavior: 'smooth',
    });
    window.history.pushState(null, '', href);
  }

  const bridgeSections = links.map((link) => ({
    id: link.href.slice(1),
    label: link.label,
    href: link.href,
  }));

  return (
    <header
      ref={headerRef}
      data-hide-in-embedded-app
      className={cn(
        'sticky top-0 z-30 shadow-sm',
        // Mobile: faixa laranja (sem TopNav); desktop: faixa neutra colada sob o TopNav (h-16)
        'max-md:bg-clay-500 max-md:px-3 max-md:pb-2.5 max-md:pt-2.5',
        'md:top-16 md:-mx-[calc(50vw-50%)] md:border-b md:border-ink-200 md:bg-paper-deep md:px-0 md:pb-0 md:pt-0 md:shadow-none',
        className,
      )}
    >
      {/* Inner: constrained content area matching AppFrame width */}
      <div className="md:mx-auto md:max-w-[var(--app-max-w)] md:px-6 md:py-2 lg:px-8 lg:py-2.5">
        <div className="mb-2 flex min-w-0 items-center gap-2 md:mb-2">
          {backHref ? (
            <Link
              href={backHref}
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:no-underline',
                'bg-white/92 text-ink-900',
                'md:bg-white md:ring-1 md:ring-ink-200 md:hover:bg-clay-50 md:hover:text-clay-700 md:hover:ring-clay-200',
              )}
              aria-label={backLabel}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </Link>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[15px] font-extrabold leading-tight text-white md:text-[17px] md:text-ink-900">
              {title}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen((current) => !current)}
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
              'bg-white/92 text-ink-900',
              'md:bg-white md:ring-1 md:ring-ink-200 md:hover:bg-clay-50 md:hover:text-clay-700 md:hover:ring-clay-200',
            )}
            aria-label={searchOpen ? 'Fechar busca' : 'Abrir busca'}
            aria-expanded={searchOpen}
          >
            {searchOpen ? (
              <X className="size-4.5" aria-hidden="true" />
            ) : (
              <Search className="size-4.5" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={sharePage}
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
              'bg-white/92 text-ink-900',
              'md:bg-white md:ring-1 md:ring-ink-200 md:hover:bg-clay-50 md:hover:text-clay-700 md:hover:ring-clay-200',
            )}
            aria-label="Compartilhar"
          >
            {copied ? (
              <Check className="size-4.5" aria-hidden="true" />
            ) : (
              <Share2 className="size-4.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {searchOpen ? (
          <div ref={searchWrapperRef} className="mb-2.5 lg:max-w-[760px]">
            <SearchBar />
          </div>
        ) : null}

        <nav
          className="no-scrollbar flex gap-1.5 overflow-x-auto md:gap-1"
          aria-label="Seções da página"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleSectionClick(event, link.href)}
              className={cn(
                'shrink-0 hover:no-underline',
                // Mobile (on orange): white pills
                'rounded-full bg-white/92 px-3 py-2 text-[13px] font-semibold leading-none text-ink-900 shadow-sm',
                // Desktop (on paper-deep): text links with hover
                'md:rounded-md md:bg-transparent md:px-3 md:py-1.5 md:font-medium md:text-ink-700 md:shadow-none md:hover:bg-clay-50 md:hover:text-clay-700',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {sharePanelOpen ? (
        <div className="absolute right-3 top-full z-50 mt-2 w-[min(340px,calc(100vw-24px))] rounded-xl bg-white p-3 text-ink-900 shadow-[0_18px_48px_rgba(25,25,25,0.16)] ring-1 ring-ink-100 md:right-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-[13px] font-bold">Compartilhar página</p>
              <p className="m-0 mt-1 break-all text-[12px] leading-snug text-ink-600">
                {currentUrl}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSharePanelOpen(false)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-paper-deep text-ink-700"
              aria-label="Fechar compartilhamento"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => copyLink()}
            className="mt-3 w-full rounded-md bg-ink-900 px-3 py-2 text-[13px] font-semibold text-white"
          >
            {copied ? 'Link copiado' : 'Copiar link'}
          </button>
        </div>
      ) : null}
      <MobileWebViewSectionBridge sections={bridgeSections} mode="scroll" />
    </header>
  );
}

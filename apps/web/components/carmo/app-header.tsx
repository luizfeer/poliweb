'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { MobileWebViewSectionBridge } from '@/components/carmo/mobile-webview-section-bridge';
import { SearchBar } from '@/components/search/search-bar';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

type HeaderChip = string | { label: string; href: string };

type AppHeaderProps = {
  cep?: string;
  chips?: HeaderChip[];
  placeholder?: string;
  /** Rota destino do botão de busca. Default: hub de busca do comércio. */
  searchHref?: string;
  title?: string;
  className?: string;
};

const DEFAULT_CHIPS: HeaderChip[] = [
  { label: 'Mais buscados', href: '/buscar' },
  { label: 'Saúde', href: '/servicos/saude' },
  { label: 'Comida', href: '/turismo/onde-comer' },
  { label: 'Veículos', href: '/comercio/buscar?q=veiculos' },
  { label: 'Casa', href: '/imoveis' },
];

const CHIP_HREF_BY_LABEL: Record<string, string> = {
  mercado: '/comercio/buscar?q=mercado',
  turismo: '/turismo',
  serviços: '/servicos',
  servicos: '/servicos',
  comércio: '/comercio',
  comercio: '/comercio',
  saúde: '/servicos/saude',
  saude: '/servicos/saude',
  comida: '/turismo/onde-comer',
  veículos: '/comercio/buscar?q=veiculos',
  veiculos: '/comercio/buscar?q=veiculos',
  casa: '/imoveis',
  hospedagem: '/turismo/onde-ficar',
  pesca: '/turismo/pesca',
  roteiro: '/turismo/roteiros',
  roteiros: '/turismo/roteiros',
  atrações: '/turismo/o-que-fazer',
  atracoes: '/turismo/o-que-fazer',
};

function normalizeChip(chip: HeaderChip): { label: string; href: string } {
  if (typeof chip !== 'string') return chip;
  const key = chip.trim().toLowerCase();
  return { label: chip, href: CHIP_HREF_BY_LABEL[key] ?? `/buscar?q=${encodeURIComponent(chip)}` };
}

/**
 * Mobile-only header with search + contextual chips.
 * On desktop, the TopNav already provides inline search + main nav, so this is hidden.
 */
export function AppHeader({ chips = DEFAULT_CHIPS, className }: AppHeaderProps) {
  const normalizedChips = chips.map(normalizeChip);

  return (
    <header
      data-hide-in-embedded-app
      className={cn(
        'sticky top-0 z-40 bg-clay-500 px-3 pb-2.5 pt-2.5 shadow-sm md:hidden',
        className,
      )}
    >
      <div className="mb-2">
        <SearchBar />
      </div>

      <button
        type="button"
        data-show-in-embedded-app
        onClick={() => {
          if (typeof window !== 'undefined' && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'navigate', payload: '/buscar-nativo' }),
            );
          }
        }}
        className="mb-2 flex w-full items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-left text-[14px] font-medium text-ink-600 shadow-sm"
      >
        <Search size={16} strokeWidth={2.2} />
        Buscar em Carmo…
      </button>

      <nav className="no-scrollbar flex gap-1.5 overflow-x-auto" aria-label="Atalhos">
        {normalizedChips.map((chip) => (
          <Link
            key={`${chip.label}-${chip.href}`}
            href={chip.href}
            className="shrink-0 rounded-full bg-white/95 px-3 py-2 text-[13px] font-semibold leading-none text-ink-900 shadow-sm hover:bg-white hover:no-underline"
          >
            {chip.label}
          </Link>
        ))}
      </nav>
      <MobileWebViewSectionBridge
        sections={normalizedChips.map((chip) => ({
          id: chip.href,
          label: chip.label,
          href: chip.href,
        }))}
        mode="navigate"
      />
    </header>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ChatInterface } from './chat-interface';

type Props = {
  cityName: string;
};

function pathToContext(pathname: string): string | undefined {
  if (pathname === '/' || pathname === '') return undefined;

  const segments = pathname.split('/').filter(Boolean);

  const sectionMap: Record<string, string> = {
    turismo: 'seção de turismo',
    comercio: 'seção de comércio',
    eventos: 'seção de eventos',
    noticias: 'seção de notícias',
    servicos: 'seção de serviços',
    comunidade: 'seção de comunidade',
    transparencia: 'seção de transparência',
    imobiliario: 'seção imobiliária',
  };

  const section = segments[0] ? sectionMap[segments[0]] : undefined;
  const slug = segments[segments.length - 1];

  if (slug && slug !== segments[0] && slug.length > 3) {
    const readableSlug = slug.replace(/-/g, ' ');
    return section
      ? `Usuário está visualizando "${readableSlug}" na ${section}`
      : `Usuário está na página "${readableSlug}"`;
  }

  return section ? `Usuário está na ${section}` : undefined;
}

export function AgentWidget({ cityName }: Props) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Não mostrar na página dedicada do assistente
  const isAssistentePage = pathname === '/assistente';

  // Animação de entrada do FAB
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(id);
  }, []);

  // Fechar ao pressionar Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (isAssistentePage) return null;

  const pageContext = pathToContext(pathname);

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div
          data-hide-in-embedded-app
          className="fixed inset-0 z-[58] bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Painel desktop */}
      {open && (
        <div
          ref={panelRef}
          data-hide-in-embedded-app
          className="border-border bg-background shadow-2xl fixed bottom-[calc(72px+1rem+env(safe-area-inset-bottom))] right-4 z-[60] hidden w-[380px] flex-col overflow-hidden rounded-2xl border md:flex"
          style={{ height: 'min(520px, calc(100svh - 120px))' }}
        >
          <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-3">
            <ChatInterface
              cityName={cityName}
              onClose={() => setOpen(false)}
              pageContext={pageContext}
            />
          </div>
        </div>
      )}

      {/* Bottom sheet mobile */}
      {open && (
        <div
          data-hide-in-embedded-app
          className="border-border bg-background fixed inset-x-0 z-[60] flex flex-col overflow-hidden rounded-t-2xl border-t shadow-2xl md:hidden"
          style={{
            bottom: 'calc(72px + env(safe-area-inset-bottom))',
            height: '78svh',
          }}
        >
          {/* Drag handle visual */}
          <div className="flex shrink-0 justify-center pt-2.5 pb-1">
            <div className="bg-muted-foreground/30 h-1 w-10 rounded-full" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
            <ChatInterface
              cityName={cityName}
              onClose={() => setOpen(false)}
              pageContext={pageContext}
            />
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        data-hide-in-embedded-app
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar assistente' : 'Abrir assistente'}
        className={[
          'fixed right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300',
          'bottom-[calc(72px+1rem+env(safe-area-inset-bottom))]',
          open
            ? 'bg-muted text-foreground scale-90'
            : 'bg-primary text-primary-foreground hover:scale-105',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        ].join(' ')}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </>
  );
}

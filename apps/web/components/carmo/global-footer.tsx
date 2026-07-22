'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, ShieldCheck } from 'lucide-react';
import { Logo } from './logo';

type GlobalFooterProps = {
  cityName?: string;
};

const footerColumns = [
  {
    title: 'Cidade',
    links: [
      { label: 'Início', href: '/' },
      { label: 'Serviços públicos', href: '/servicos' },
      { label: 'Transparência', href: '/transparencia' },
      { label: 'Agenda', href: '/agenda' },
      { label: 'Igrejas & cultos', href: '/comunidade/igrejas' },
    ],
  },
  {
    title: 'Turismo',
    links: [
      { label: 'O que fazer', href: '/turismo/o-que-fazer' },
      { label: 'Onde ficar', href: '/turismo/onde-ficar' },
      { label: 'Onde comer', href: '/turismo/onde-comer' },
      { label: 'Pesca esportiva', href: '/turismo/pesca' },
      { label: 'Roteiros & guias', href: '/turismo/guias' },
    ],
  },
  {
    title: 'Comércio',
    links: [
      { label: 'Guia comercial', href: '/comercio' },
      { label: 'Promoções', href: '/comercio?promo=1' },
      { label: 'Imóveis', href: '/imoveis' },
      { label: 'Classificados', href: '/classificados' },
      { label: 'Anuncie seu negócio', href: '/comercio/cadastro' },
    ],
  },
  {
    title: 'Portal',
    links: [
      { label: 'Sobre', href: '/sobre' },
      { label: 'Assistente IA', href: '/assistente' },
      { label: 'Contato', href: '/contato' },
      { label: 'Termos & privacidade', href: '/privacidade' },
      { label: 'Imprensa', href: '/contato?tipo=imprensa&assunto=Imprensa' },
    ],
  },
];

export function GlobalFooter({ cityName = 'Carmo do Rio Claro' }: GlobalFooterProps) {
  const pathname = usePathname();
  const cityLabel = cityName.includes('/MG') ? cityName : `${cityName} / MG`;

  if (pathname === '/assistente' || pathname.startsWith('/assistente/') || pathname === '/turismo/onde-ficar') return null;

  return (
    <footer data-hide-in-embedded-app className="hidden bg-[#171716] text-white md:block">
      <div className="mx-auto max-w-[1440px] px-4 py-7 md:px-8 md:py-14">
        <div className="grid gap-8 md:gap-12 lg:grid-cols-[minmax(280px,360px)_repeat(4,minmax(130px,1fr))]">
          <div>
            <div className="mb-5 flex items-center gap-3 md:mb-7">
              <Logo variant="appIcon" width={52} height={52} className="shrink-0 opacity-95" />
              <div>
                <p className="m-0 font-display text-[20px] font-extrabold leading-tight text-white md:text-[22px]">
                  Portal Carmelitano
                </p>
                <p className="m-0 mt-1 text-[12px] font-semibold text-white/72">Portal hiperlocal</p>
              </div>
            </div>
            <p className="m-0 max-w-[330px] text-[14px] leading-relaxed text-white/86 md:text-[16px]">
              Portal hiperlocal de {cityLabel}. Comércio, turismo na região de Furnas e Canastra,
              agenda, transparência e serviços públicos.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/16 px-3 py-2 text-[12px] font-extrabold text-white/88">
                <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                {cityLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/16 px-3 py-2 text-[12px] font-extrabold text-white/88">
                <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
                LGPD ok
              </span>
            </div>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="m-0 font-display text-[16px] font-extrabold text-white md:text-[17px]">
                {column.title}
              </h2>
              <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[14px] font-medium text-white/82 transition hover:text-sun-500 hover:no-underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/12 pt-5 text-[12px] text-white/72 md:mt-14 md:flex-row md:items-center md:justify-between md:pt-6">
          <p className="m-0">© 2026 Portal Carmelitano · {cityLabel}</p>
          <nav aria-label="Links legais" className="flex flex-wrap items-center gap-x-5 gap-y-2 md:gap-7">
            <Link href="/sobre" className="text-white/72 hover:text-sun-500 hover:no-underline">
              Sobre
            </Link>
            <Link href="/anuncie" className="text-white/72 hover:text-sun-500 hover:no-underline">
              Anuncie
            </Link>
            <Link href="/termos" className="text-white/72 hover:text-sun-500 hover:no-underline">
              Termos
            </Link>
            <Link href="/privacidade" className="text-white/72 hover:text-sun-500 hover:no-underline">
              Privacidade
            </Link>
            <Link href="/lgpd" className="text-white/72 hover:text-sun-500 hover:no-underline">
              LGPD
            </Link>
            <Link href="/excluir-conta" className="text-white/72 hover:text-sun-500 hover:no-underline">
              Excluir conta
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

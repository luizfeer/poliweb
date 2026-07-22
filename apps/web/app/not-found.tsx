import Link from 'next/link';
import {
  CalendarDays,
  Church,
  Home,
  Landmark,
  MessageCircleQuestion,
  Search,
  Store,
  Tag,
  UsersRound,
} from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, ListItem, SectionHeader } from '@/components/carmo';

const quickWidgets = [
  {
    href: '/buscar',
    title: 'Buscar no Portal Carmelitano',
    text: 'Comércio, turismo, serviços e comunidade.',
    icon: Search,
    tone: 'bg-clay-50 text-clay-700',
  },
  {
    href: '/assistente',
    title: 'Perguntar ao assistente',
    text: 'Descreva o que você está tentando encontrar.',
    icon: MessageCircleQuestion,
    tone: 'bg-sky-100 text-sky-700',
  },
  {
    href: '/servicos',
    title: 'Serviços públicos',
    text: 'Coleta, telefones úteis e alertas.',
    icon: Landmark,
    tone: 'bg-cerrado-100 text-cerrado-700',
  },
  {
    href: '/comunidade',
    title: 'Comunidade',
    text: 'Agenda, igrejas, pets e achados.',
    icon: UsersRound,
    tone: 'bg-sun-100 text-ink-900',
  },
];

export default function NotFound() {
  return (
    <AppFrame>
      <AppHeader chips={['Buscar', 'Serviços', 'Comunidade', 'Comércio']} />

      <Band className="bg-ink-900 px-3.5 py-6 text-white md:px-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-bold">
          <Search size={15} aria-hidden="true" />
          Página não encontrada
        </div>
        <h1 className="m-0 max-w-xl font-display text-[38px] font-extrabold leading-[1.02]">
          Esse caminho saiu da rota.
        </h1>
        <p className="m-0 mt-3 max-w-xl text-[14px] leading-relaxed text-white/78">
          O conteúdo pode ter mudado de endereço, ainda não ter sido publicado ou o link pode estar incompleto.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-clay-500 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-clay-600 hover:no-underline"
          >
            <Home size={16} aria-hidden="true" />
            Voltar ao início
          </Link>
          <Link
            href="/assistente"
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-[13px] font-bold text-ink-900 hover:no-underline"
          >
            <MessageCircleQuestion size={16} aria-hidden="true" />
            Perguntar
          </Link>
        </div>
      </Band>

      <Band variant="paper-card" className="grid grid-cols-2 gap-2.5 px-3.5 py-3">
        {quickWidgets.map((widget) => {
          const Icon = widget.icon;

          return (
            <Link
              key={widget.href}
              href={widget.href}
              className="rounded-xs border border-ink-100 bg-white p-3 shadow-card hover:no-underline"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-md ${widget.tone}`}>
                <Icon size={20} strokeWidth={2.1} aria-hidden="true" />
              </div>
              <h2 className="m-0 text-[14px] font-extrabold leading-snug text-ink-900">{widget.title}</h2>
              <p className="m-0 mt-1 text-[12px] leading-snug text-ink-600">{widget.text}</p>
            </Link>
          );
        })}
      </Band>

      <Divider />

      <SectionHeader title="Talvez você queira" />
      <Band variant="paper-card">
        <ListItem
          icon={Store}
          iconBg="clay-50"
          iconFg="clay-600"
          title="Guia comercial"
          sub="Negócios, telefones e prestadores da cidade."
          href="/comercio"
        />
        <ListItem
          icon={CalendarDays}
          iconBg="sun-100"
          iconFg="ink-900"
          title="Agenda da cidade"
          sub="Eventos, encontros e programações próximas."
          href="/comunidade/agenda"
        />
        <ListItem
          icon={Church}
          iconBg="cerrado-100"
          iconFg="cerrado-700"
          title="Igrejas e programação"
          sub="Missas, cultos e comunidades religiosas."
          href="/comunidade/igrejas"
        />
        <ListItem
          icon={Tag}
          iconBg="paper"
          title="Classificados"
          sub="Venda, troca, serviços e oportunidades locais."
          href="/classificados"
          divider={false}
        />
      </Band>

      <Divider />

      <SectionHeader title="Perguntas rápidas" kicker="Assistente" action={{ label: 'Abrir', href: '/assistente' }} />
      <Band className="px-3.5 pb-6">
        <Link
          href="/assistente"
          className="block rounded-xs border border-sky-100 bg-white p-3.5 shadow-card hover:no-underline"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700">
              <MessageCircleQuestion size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="m-0 text-[17px] font-extrabold leading-tight text-ink-900">
                Não achou o que procurava?
              </h2>
              <p className="m-0 mt-1 text-[13px] leading-relaxed text-ink-600">
                Pergunte em linguagem natural: “onde vejo coleta?”, “tem evento hoje?” ou “qual farmácia está aberta?”.
              </p>
            </div>
          </div>
        </Link>
      </Band>
    </AppFrame>
  );
}

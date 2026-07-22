'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  Blocks,
  Building2,
  ClipboardList,
  Coins,
  CreditCard,
  X,
  DoorOpen,
  Flag,
  Gift,
  Handshake,
  Heart,
  HeartHandshake,
  Landmark,
  LayoutDashboard,
  Map,
  Menu,
  Megaphone,
  Network,
  ShieldCheck,
  ShieldAlert,
  ShoppingBag,
  Store,
  Ticket,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { CurrentCity } from '@/lib/cities';
import { canManageCity, hasRole } from '@/lib/auth/roles';
import type { AuthContext } from '@/lib/auth/types';

type SidebarProps = {
  auth: AuthContext;
  city: CurrentCity;
  unreadNotifications: number;
};

type NavItem = {
  href: string;
  label: string;
  eyebrow: string;
  icon: LucideIcon;
  show: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export function PainelSidebar({ auth, city, unreadNotifications }: SidebarProps) {
  const isCityManager = canManageCity(auth.roles, city.id);
  const isSuperAdmin = hasRole(auth.roles, ['super_admin'], city.id);
  const isMerchant = hasRole(auth.roles, ['merchant'], city.id);

  const groups: NavGroup[] = [
    {
      title: 'Sua conta',
      items: [
        { href: '/painel', label: 'Resumo', eyebrow: 'Visão geral', icon: LayoutDashboard, show: true },
        {
          href: '/painel/cidadao',
          label: 'Meu painel',
          eyebrow: 'Publicações e atalhos',
          icon: ShoppingBag,
          show: true,
        },
        {
          href: '/painel/notificacoes',
          label: unreadNotifications > 0 ? `Notificações (${unreadNotifications})` : 'Notificações',
          eyebrow: 'Alertas e aprovações',
          icon: Bell,
          show: true,
        },
        { href: '/painel/favoritos', label: 'Favoritos', eyebrow: 'Salvos para depois', icon: Heart, show: true },
        { href: '/painel/perfil', label: 'Perfil e privacidade', eyebrow: 'Dados da conta', icon: UserRound, show: true },
        { href: '/painel/perfil/pagamentos', label: 'Pagamentos', eyebrow: 'Cobranças e histórico', icon: CreditCard, show: true },
      ],
    },
    {
      title: 'Sua participação',
      items: [
        { href: '/painel/comunidade', label: 'Minha comunidade', eyebrow: 'Posts e avisos', icon: UsersRound, show: true },
        { href: '/painel/cidadao/indicar', label: 'Indicar amigos', eyebrow: 'Convites', icon: HeartHandshake, show: true },
        { href: '/painel/cidadao/pontos', label: 'Meus pontos', eyebrow: 'Fidelidade', icon: Coins, show: true },
        { href: '/painel/cidadao/sorteios', label: 'Meus sorteios', eyebrow: 'Prêmios', icon: Ticket, show: true },
      ],
    },
    {
      title: 'Minhas páginas',
      items: [
        { href: '/painel/comercio', label: 'Página do comércio', eyebrow: 'Ficha, pedidos e reviews', icon: Store, show: isMerchant },
      ],
    },
    {
      title: 'Administração da cidade',
      items: [
        { href: '/painel/cidade', label: 'Resumo da cidade', eyebrow: 'Admin', icon: Landmark, show: isCityManager },
        { href: '/painel/cidade/notificacoes', label: 'Central admin', eyebrow: 'Inbox operacional', icon: Bell, show: isCityManager },
        { href: '/painel/cidade/comunidade', label: 'Comunidade', eyebrow: 'Moderação', icon: ShieldCheck, show: isCityManager },
        { href: '/painel/cidade/comercio', label: 'Comércio', eyebrow: 'Negócios', icon: Building2, show: isCityManager },
        { href: '/painel/cidade/comercio/leads', label: 'Leads de comércio', eyebrow: 'Solicitações pendentes', icon: ClipboardList, show: isCityManager },
        { href: '/painel/cidade/turismo', label: 'Turismo', eyebrow: 'Guias e aprovações', icon: Map, show: isCityManager },
        { href: '/painel/cidade/servicos', label: 'Serviços públicos', eyebrow: 'Utilidade', icon: Handshake, show: isCityManager },
        { href: '/painel/cidade/sorteios', label: 'Sorteios', eyebrow: 'Campanhas', icon: Gift, show: isCityManager },
        { href: '/painel/cidade/pontos', label: 'Pontos da cidade', eyebrow: 'Engajamento', icon: BarChart3, show: isCityManager },
      ],
    },
    {
      title: 'Configuração',
      items: [
        { href: '/painel/cidade/equipe', label: 'Equipe e acessos', eyebrow: 'Permissões', icon: UsersRound, show: isCityManager },
        { href: '/painel/cidade/modulos', label: 'Módulos', eyebrow: 'Liga/desliga', icon: Blocks, show: isCityManager },
        { href: '/painel/cidade/home', label: 'Home da cidade', eyebrow: 'Blocos e banners', icon: LayoutDashboard, show: isCityManager },
        { href: '/painel/cidade/distritos', label: 'Distritos', eyebrow: 'Bairros e regiões', icon: Network, show: isCityManager },
        { href: '/painel/cidade/audit', label: 'Auditoria', eyebrow: 'Segurança', icon: ClipboardList, show: isCityManager },
        { href: '/painel/super/pagamentos', label: 'Super: pagamentos', eyebrow: 'Financeiro', icon: CreditCard, show: isSuperAdmin },
        { href: '/painel/super/cidades', label: 'Super: cidades', eyebrow: 'Global', icon: Flag, show: isSuperAdmin },
        { href: '/painel/super/exclusoes', label: 'Super: exclusões', eyebrow: 'LGPD', icon: ShieldAlert, show: isSuperAdmin },
      ],
    },
  ];

  const visibleGroups = groups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.show) }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100svh-2rem)] lg:self-start lg:overflow-hidden lg:rounded-xl lg:border lg:border-ink-100 lg:bg-white lg:p-3 lg:shadow-card">
      <MobileSidebarNav city={city} visibleGroups={visibleGroups} />
      <BrandCard city={city} className="hidden lg:mb-3 lg:flex" />

      <nav className="hidden lg:block lg:max-h-[calc(100svh-13rem)] lg:space-y-4 lg:overflow-y-auto lg:pr-1">
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.title} group={group} desktop />
        ))}
      </nav>
      <LogoutForm className="mt-6 hidden lg:block" desktop />
    </aside>
  );
}

function MobileSidebarNav({ city, visibleGroups }: { city: CurrentCity; visibleGroups: NavGroup[] }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="sticky top-3 z-50 lg:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="painel-mobile-menu"
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-12 w-full items-center justify-between rounded-xl border border-ink-100 bg-white px-3 py-2 text-left text-foreground shadow-card transition hover:bg-clay-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-clay-50 text-clay-700">
            {isOpen ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-tight">Menu do painel</span>
            <span className="block truncate text-xs text-muted-foreground">
              {city.name}/{city.state}
            </span>
          </span>
        </span>
        <span className="rounded-full bg-paper-deep px-2 py-1 text-[11px] font-semibold text-ink-600">
          {isOpen ? 'Fechar' : 'Abrir'}
        </span>
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-[80] cursor-default bg-ink-900/30 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <div
            id="painel-mobile-menu"
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] top-[76px] z-[90] overflow-y-auto rounded-xl border border-ink-100 bg-white p-3 shadow-pop"
          >
            <BrandCard city={city} className="mb-3 flex" />
            <nav className="space-y-4">
              {visibleGroups.map((group) => (
                <SidebarGroup key={group.title} group={group} onNavigate={() => setIsOpen(false)} />
              ))}
            </nav>
            <LogoutForm className="mt-2 border-t pt-2" />
          </div>
        </>
      ) : null}
    </div>
  );
}

function SidebarGroup({
  group,
  desktop = false,
  onNavigate,
}: {
  group: NavGroup;
  desktop?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <section>
      <h2 className="mb-1.5 px-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-500">
        {group.title}
      </h2>
      <div className="space-y-1">
        {group.items.map((item) => (
          <SidebarLink key={item.href} item={item} desktop={desktop} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

function BrandCard({ city, className }: { city: CurrentCity; className?: string }) {
  return (
    <div className={`items-center gap-3 rounded-lg bg-clay-50 p-3 text-clay-700 ${className ?? ''}`}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-clay-500 text-primary-foreground">
        <Megaphone className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">Portal Carmelitano</p>
        <p className="truncate text-xs text-muted-foreground">
          {city.name}/{city.state}
        </p>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  desktop = false,
  onNavigate,
}: {
  item: NavItem;
  desktop?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onNavigate}
      className={
        desktop
          ? 'group flex items-center gap-3 rounded-lg px-3 py-2 text-left text-foreground transition hover:bg-clay-50 hover:text-clay-700 hover:no-underline'
          : 'flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-left text-foreground hover:bg-clay-50 hover:text-clay-700 hover:no-underline'
      }
    >
      <span
        className={
          desktop
            ? 'flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition group-hover:bg-clay-100 group-hover:text-clay-700'
            : 'flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'
        }
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className={desktop ? 'block truncate text-[13px] font-semibold' : 'block text-sm font-medium'}>
          {item.label}
        </span>
        <span className={desktop ? 'block truncate text-[11px] font-medium text-muted-foreground group-hover:text-clay-700/75' : 'block text-xs text-muted-foreground'}>
          {item.eyebrow}
        </span>
      </span>
    </Link>
  );
}

function LogoutForm({ className, desktop = false }: { className?: string; desktop?: boolean }) {
  return (
    <form action="/sair" method="post" className={className}>
      <button
        className={
          desktop
            ? 'flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted'
            : 'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted'
        }
        type="submit"
      >
        {!desktop ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <DoorOpen className="size-4" aria-hidden="true" />
          </span>
        ) : (
          <DoorOpen className="size-4" aria-hidden="true" />
        )}
        <span>Sair</span>
      </button>
    </form>
  );
}

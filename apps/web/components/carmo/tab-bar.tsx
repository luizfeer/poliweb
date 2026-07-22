import Link from 'next/link';
import { House, Landmark, Store, UserRound, UsersRound, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabId = 'home' | 'comercio' | 'comunidade' | 'servicos' | 'account';

type Tab = {
  id: TabId;
  label: string;
  icon: LucideIcon;
  href: string;
};

const TABS: Tab[] = [
  { id: 'home', label: 'Início', icon: House, href: '/' },
  { id: 'comercio', label: 'Comércio', icon: Store, href: '/comercio' },
  { id: 'comunidade', label: 'Comunidade', icon: UsersRound, href: '/comunidade' },
  { id: 'servicos', label: 'Serviços', icon: Landmark, href: '/servicos' },
  { id: 'account', label: 'Conta', icon: UserRound, href: '/painel' },
];

type TabBarProps = {
  active?: TabId;
  badges?: Partial<Record<TabId, string | number>>;
  className?: string;
};

export function TabBar({ active, badges, className }: TabBarProps) {
  return (
    <nav
      data-hide-in-embedded-app
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[var(--app-max-w)] border-t border-ink-200 bg-white px-0 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-6px_22px_rgba(25,25,25,0.08)] md:hidden',
        className,
      )}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        const badge = badges?.[tab.id];

        return (
          <Link key={tab.id} href={tab.href} className="flex flex-1 flex-col items-center gap-0.5 py-1 text-ink-900">
            <div className="relative">
              <Icon size={23} strokeWidth={isActive ? 2.4 : 1.8} />
              {badge !== undefined ? (
                <span className="absolute -right-2.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-clay-500 px-1 text-[11px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
            </div>
            <span className="text-[11px] font-medium leading-none sm:text-[12px]">{tab.label}</span>
            {isActive ? <div className="mt-0.5 h-0.5 w-7 rounded-full bg-ink-900" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

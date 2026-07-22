'use client';

import { usePathname } from 'next/navigation';
import type { LiveFeedItem } from '@/lib/live-feed/queries';
import type { WeatherSnapshot } from '@/lib/weather';
import { TabBar, type TabId } from './tab-bar';
import { TopNav } from './top-nav';

export type NavNotification = {
  id: string;
  title: string;
  body: string | null;
  targetUrl: string;
  createdAt: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  readAt: string | null;
};

function getActiveTab(pathname: string): TabId {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/comercio')) return 'comercio';
  if (pathname.startsWith('/comunidade') || pathname.startsWith('/agenda')) return 'comunidade';
  if (pathname.startsWith('/servicos')) return 'servicos';
  if (pathname.startsWith('/painel') || pathname.startsWith('/entrar') || pathname.startsWith('/cadastro')) return 'account';
  return 'home';
}

function shouldHideNav(pathname: string) {
  return pathname === '/assistente' || pathname.startsWith('/assistente/') || pathname === '/turismo/onde-ficar';
}

type GlobalNavClientProps = {
  unreadCount: number;
  recentNotifications: NavNotification[];
  liveFeedItems: LiveFeedItem[];
  weather: WeatherSnapshot | null;
  isAuthenticated: boolean;
  userName: string | null;
  avatarUrl: string | null;
  vapidPublicKey: string | null;
  cityId: string | null;
};

export function GlobalNavClient({
  unreadCount,
  recentNotifications,
  liveFeedItems,
  weather,
  isAuthenticated,
  userName,
  avatarUrl,
  vapidPublicKey,
  cityId,
}: GlobalNavClientProps) {
  const pathname = usePathname();

  if (shouldHideNav(pathname)) return null;

  const active = getActiveTab(pathname);
  const badges = unreadCount > 0
    ? { account: unreadCount > 99 ? '99+' : String(unreadCount) }
    : undefined;
  const topNavClassName = pathname === '/' ? undefined : 'hidden md:block';

  return (
    <>
      <div className={topNavClassName}>
        <TopNav
          active={active}
          pathname={pathname}
          unreadCount={unreadCount}
          recentNotifications={recentNotifications}
          liveFeedItems={liveFeedItems}
          weather={weather}
          isAuthenticated={isAuthenticated}
          userName={userName}
          avatarUrl={avatarUrl}
          vapidPublicKey={vapidPublicKey}
          cityId={cityId}
        />
      </div>
      <TabBar active={active} badges={badges} className="md:hidden" />
    </>
  );
}

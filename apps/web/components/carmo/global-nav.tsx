import { getProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listLiveFeedItems } from '@/lib/live-feed/queries';
import { getUnreadNotificationCount, listNotifications } from '@/lib/notifications';
import { getWeatherForHome } from '@/lib/weather';
import { GlobalNavClient, type NavNotification } from './global-nav-client';

export async function GlobalNav() {
  const [auth, city] = await Promise.all([getProfile(), getCurrentCity()]);

  let unreadCount = 0;
  let recent: NavNotification[] = [];

  if (auth) {
    const [count, rows] = await Promise.all([
      getUnreadNotificationCount(auth.profile.id),
      // Sem filtro → histórico recente (lidas + não lidas).
      // Badge de não-lidas vem do `count` separado.
      listNotifications(auth.profile.id),
    ]);
    unreadCount = count;
    recent = rows.slice(0, 8).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      targetUrl: row.target_url,
      createdAt: row.created_at,
      priority: row.priority,
      readAt: row.read_at,
    }));
  }

  const [liveFeedItems, weather] = city
    ? await Promise.all([listLiveFeedItems(city.id, 12), getWeatherForHome(city)])
    : [[], null];

  return (
    <GlobalNavClient
      unreadCount={unreadCount}
      recentNotifications={recent}
      liveFeedItems={liveFeedItems}
      weather={weather}
      isAuthenticated={!!auth}
      userName={auth?.profile.full_name ?? null}
      avatarUrl={auth?.profile.avatar_url ?? null}
      vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
      cityId={city?.id ?? null}
    />
  );
}

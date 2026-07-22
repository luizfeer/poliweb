import { Bell, ChevronRight } from 'lucide-react';
import { Link } from '@/components/navigation/link';
import { listNotifications } from '@/lib/notifications';

type NotificationsWidgetProps = {
  profileId: string;
};

export async function NotificationsWidget({ profileId }: NotificationsWidgetProps) {
  const notifications = await listNotifications(profileId, 'nao-lidas');
  const latest = notifications.slice(0, 3);

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-clay-50 text-clay-700">
            <Bell className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold">Notificações</h2>
            <p className="text-sm text-muted-foreground">
              {notifications.length === 1 ? '1 nova' : `${notifications.length} novas`}
            </p>
          </div>
        </div>
        <Link
          href="/painel/notificacoes"
          prefetch={false}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-clay-700 hover:bg-clay-50 hover:no-underline"
        >
          Abrir
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {latest.length ? (
        <div className="mt-3 space-y-2">
          {latest.map((item) => (
            <Link
              key={item.id}
              href={item.target_url}
              prefetch={false}
              className="block rounded-lg border bg-background p-3 text-foreground hover:bg-clay-50 hover:no-underline"
            >
              <p className="text-sm font-semibold">{item.title}</p>
              {item.body ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.body}</p> : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-background p-3 text-sm text-muted-foreground">Nada novo por enquanto.</p>
      )}
    </section>
  );
}

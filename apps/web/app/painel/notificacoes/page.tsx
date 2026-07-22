import { Link } from '@/components/navigation/link';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { NotificationList } from '@/components/painel/notification-list';
import { WebPushToggle } from '@/components/push/WebPushToggle';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listNotifications } from '@/lib/notifications';
import { markAllNotificationsReadAction } from '@/lib/notifications/actions';

type Props = {
  searchParams: Promise<{ filtro?: string }>;
};

const filters = [
  { key: undefined, label: 'Todas' },
  { key: 'nao-lidas', label: 'Não lidas' },
  { key: 'aprovacoes', label: 'Aprovações' },
  { key: 'comentarios', label: 'Comentários' },
  { key: 'leads', label: 'Leads' },
];

export const metadata = { title: 'Notificações - Portal Carmelitano' };

export default async function NotificationsPage({ searchParams }: Props) {
  const [{ filtro }, auth, city] = await Promise.all([
    searchParams,
    requireProfile(),
    getCurrentCity(),
  ]);
  const notifications = await listNotifications(auth.profile.id, filtro);
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

  return (
    <div className="space-y-5">
      <header className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-clay-700">Central</p>
            <h1 className="mt-1 text-3xl font-bold">Notificações</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Status de aprovações, comentários, fotos, leads e avisos da sua conta.
            </p>
          </div>
          <SubmitOnceForm action={markAllNotificationsReadAction}>
            <SubmitOnceButton
              label="Marcar todas como lidas"
              pendingLabel="Salvando..."
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-wait disabled:opacity-75"
            />
          </SubmitOnceForm>
        </div>
      </header>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Receber no navegador</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Ative pra receber alertas em tempo real neste navegador (mesmo com a aba fechada,
          enquanto o sistema operacional estiver ligado).
        </p>
        <div className="mt-3">
          <WebPushToggle vapidPublicKey={vapidPublicKey} cityId={city?.id ?? null} />
        </div>
      </section>

      <nav className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const active = item.key === filtro || (!item.key && !filtro);
          const href = item.key ? `/painel/notificacoes?filtro=${item.key}` : '/painel/notificacoes';
          return (
            <Link
              key={item.label}
              href={href}
              prefetch={false}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold hover:no-underline ${
                active ? 'border-clay-300 bg-clay-50 text-clay-700' : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <NotificationList notifications={notifications} />
    </div>
  );
}

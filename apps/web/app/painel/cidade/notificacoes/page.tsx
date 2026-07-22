import { Link } from '@/components/navigation/link';
import { NotificationList } from '@/components/painel/notification-list';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { listAdminNotifications } from '@/lib/notifications';

type Props = {
  searchParams: Promise<{ tipo?: string }>;
};

const filters = [
  { key: undefined, label: 'Todas' },
  { key: 'nao-lidas', label: 'Não lidas' },
  { key: 'lead', label: 'Leads' },
  { key: 'aprovacao', label: 'Aprovações' },
  { key: 'ugc', label: 'Comentários e fotos' },
];

export const metadata = { title: 'Central admin - Portal Carmelitano' };

export default async function AdminNotificationsPage({ searchParams }: Props) {
  const city = await getCurrentCity();
  if (!city) return null;
  const auth = await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });

  const { tipo } = await searchParams;
  const notifications = await listAdminNotifications(city.id, auth.profile.id, tipo);
  const unreadCount = notifications.filter((item) => !item.read_at).length;
  const urgentCount = notifications.filter((item) => item.priority === 'urgent' || item.priority === 'high').length;

  return (
    <div className="space-y-5">
      <header className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-sm font-medium text-clay-700">Admin da cidade</p>
        <h1 className="mt-1 text-3xl font-bold">Central de notificações</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Leads, claims, relatos, comentários, fotos e aprovações pendentes em {city.name}.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric label="Na lista" value={notifications.length} />
          <Metric label="Não lidas" value={unreadCount} />
          <Metric label="Alta prioridade" value={urgentCount} />
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const active = item.key === tipo || (!item.key && !tipo);
          const href = item.key ? `/painel/cidade/notificacoes?tipo=${item.key}` : '/painel/cidade/notificacoes';
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-background p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

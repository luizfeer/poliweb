import { Archive, Check, ExternalLink } from 'lucide-react';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/components/navigation/link';
import { cn } from '@/lib/utils';
import { archiveNotificationAction, markNotificationReadAction } from '@/lib/notifications/actions';
import type { NotificationRow } from '@/lib/notifications/types';

type NotificationListProps = {
  notifications: NotificationRow[];
};

export function NotificationList({ notifications }: NotificationListProps) {
  if (!notifications.length) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Nenhuma notificação encontrada para este filtro.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className="rounded-xl border bg-card p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold">{notification.title}</h2>
                {!notification.read_at ? (
                  <span className="rounded-full bg-clay-100 px-2 py-0.5 text-[11px] font-bold text-clay-700">Nova</span>
                ) : null}
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {labelForType(notification.type)}
                </span>
              </div>
              {notification.body ? (
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{notification.body}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                  timeZone: 'America/Sao_Paulo',
                }).format(new Date(notification.created_at))}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href={notification.target_url}
                prefetch={false}
                className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'hover:no-underline')}
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Abrir
              </Link>
              {!notification.read_at ? (
                <SubmitOnceForm action={markNotificationReadAction}>
                  <input type="hidden" name="notification_id" value={notification.id} />
                  <SubmitOnceButton
                    label="Lida"
                    pendingLabel="Salvando..."
                    icon={<Check className="size-4" aria-hidden="true" />}
                    className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'disabled:cursor-wait disabled:opacity-75')}
                  />
                </SubmitOnceForm>
              ) : null}
              <SubmitOnceForm action={archiveNotificationAction}>
                <input type="hidden" name="notification_id" value={notification.id} />
                <SubmitOnceButton
                  label="Arquivar"
                  pendingLabel="Arquivando..."
                  icon={<Archive className="size-4" aria-hidden="true" />}
                  className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'disabled:cursor-wait disabled:opacity-75')}
                />
              </SubmitOnceForm>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function labelForType(type: string): string {
  if (type.startsWith('approval.')) return 'Aprovação';
  if (type === 'lead.received') return 'Lead';
  if (type === 'business_claim.pending') return 'Claim';
  if (type === 'business_report.received') return 'Relato';
  if (type === 'review.pending') return 'Review';
  if (type === 'photo.pending') return 'Foto';
  if (type === 'comment.received') return 'Comentário';
  return 'Sistema';
}

import {
  approveModerationAction,
  archiveContentAction,
  rejectModerationAction,
  resolveReportAction,
} from '@/lib/community/actions';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import type { ContentReport, ModerationItem } from '@/lib/community/types';

export function ModerationQueue({ items }: { items: ModerationItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={`${item.entityType}-${item.entityId}`} className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">{labelEntity(item.entityType)}</p>
              <h2 className="mt-1 text-lg font-semibold">{item.title}</h2>
              {item.description ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p> : null}
              {item.flaggedCount > 0 ? <p className="mt-2 text-sm">Denuncias: {item.flaggedCount}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton action={approveModerationAction} item={item} label="Aprovar" />
              <SubmitOnceForm action={rejectModerationAction} className="flex gap-2">
                <input type="hidden" name="entity_type" value={item.entityType} />
                <input type="hidden" name="entity_id" value={item.entityId} />
                <input name="reason" placeholder="Motivo" className="w-32 rounded-md border bg-background px-2 py-1 text-sm" />
                <SubmitOnceButton
                  label="Rejeitar"
                  pendingLabel="Salvando..."
                  className="inline-flex min-h-8 items-center justify-center gap-2 rounded-md border px-3 py-1 text-sm disabled:cursor-wait disabled:opacity-75"
                />
              </SubmitOnceForm>
              <ActionButton action={archiveContentAction} item={item} label="Arquivar" />
            </div>
          </div>
        </article>
      ))}
      {items.length === 0 ? <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Fila vazia.</p> : null}
    </div>
  );
}

export function ReportList({ reports }: { reports: ContentReport[] }) {
  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <article key={report.id} className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">{labelEntity(report.entityType)}</p>
          <h2 className="mt-1 font-semibold">{report.reason}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{report.notes ?? report.entityId}</p>
          <div className="mt-3 flex gap-2">
            <ReportAction id={report.id} status="reviewed" label="Marcar revisada" />
            <ReportAction id={report.id} status="dismissed" label="Dispensar" />
          </div>
        </article>
      ))}
      {reports.length === 0 ? <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Sem denuncias.</p> : null}
    </div>
  );
}

function ActionButton({
  action,
  item,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  item: ModerationItem;
  label: string;
}) {
  return (
    <SubmitOnceForm action={action}>
      <input type="hidden" name="entity_type" value={item.entityType} />
      <input type="hidden" name="entity_id" value={item.entityId} />
      <SubmitOnceButton
        label={label}
        pendingLabel="Salvando..."
        className="inline-flex min-h-8 items-center justify-center gap-2 rounded-md border px-3 py-1 text-sm disabled:cursor-wait disabled:opacity-75"
      />
    </SubmitOnceForm>
  );
}

function ReportAction({ id, status, label }: { id: string; status: 'reviewed' | 'dismissed'; label: string }) {
  return (
    <SubmitOnceForm action={resolveReportAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitOnceButton
        label={label}
        pendingLabel="Salvando..."
        className="inline-flex min-h-8 items-center justify-center gap-2 rounded-md border px-3 py-1 text-sm disabled:cursor-wait disabled:opacity-75"
      />
    </SubmitOnceForm>
  );
}

function labelEntity(entityType: string): string {
  const labels: Record<string, string> = {
    event: 'Evento',
    classified: 'Classificado',
    lost_pet: 'Pet',
    lost_and_found: 'Achado/perdido',
    community_group: 'Grupo',
    community_group_post: 'Postagem de grupo',
  };
  return labels[entityType] ?? entityType;
}

import {
  approveClassifiedAction,
  rejectClassifiedAction,
  requestChangesAction,
  unpublishClassifiedAction,
} from '@/app/painel/cidade/classificados/actions';
import { resolveClassifiedReportAction } from '@/app/(public)/classificados/actions';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import type { Classified } from '@/lib/classifieds/types';
import type { ClassifiedReport } from '@/lib/classifieds/queries';

export function ApprovalQueueByType({ items }: { items: Classified[] }) {
  const grouped = {
    vehicle: items.filter((item) => item.type === 'vehicle'),
    job: items.filter((item) => item.type === 'job'),
    service: items.filter((item) => item.type === 'service'),
    item: items.filter((item) => item.type === 'item'),
    other: items.filter((item) => item.type === 'other'),
  };

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([type, group]) => (
        <section key={type} className="space-y-3">
          <h2 className="text-xl font-semibold">{labelType(type)} ({group.length})</h2>
          <div className="space-y-3">
            {group.map((item) => <ApprovalRow key={item.id} item={item} />)}
            {group.length === 0 ? <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Sem pendencias.</p> : null}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ReportInbox({ reports }: { reports: ClassifiedReport[] }) {
  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <article key={report.id} className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">{report.status}</p>
          <h2 className="mt-1 font-semibold">{report.classifiedTitle ?? report.classifiedId}</h2>
          <p className="mt-1 text-sm">Motivo: {report.reason}</p>
          {report.notes ? <p className="mt-2 text-sm text-muted-foreground">{report.notes}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <ReportAction id={report.id} status="reviewed" label="Marcar revisada" />
            <ReportAction id={report.id} status="dismissed" label="Dispensar" />
          </div>
        </article>
      ))}
      {reports.length === 0 ? <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Sem denuncias.</p> : null}
    </div>
  );
}

export function FraudDetectionHints({ item }: { item: Classified }) {
  const hints = [
    item.flaggedCount > 0 ? `${item.flaggedCount} denuncias` : null,
    item.paymentAmountCents > 0 && item.paymentStatus !== 'paid' ? 'pagamento pendente' : null,
    item.type === 'vehicle' && !item.vehicle?.placaFinal ? 'sem final da placa' : null,
    item.price !== null && item.price <= 100 ? 'preco baixo' : null,
  ].filter(Boolean);

  if (hints.length === 0) return null;
  return <p className="mt-2 text-sm text-muted-foreground">Sinais: {hints.join(', ')}</p>;
}

function ApprovalRow({ item }: { item: Classified }) {
  return (
    <article className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">{labelType(item.type)} / {item.reviewStatus}</p>
          <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
          {item.description ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p> : null}
          <FraudDetectionHints item={item} />
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton id={item.id} action={approveClassifiedAction} label="Aprovar" />
          <DecisionForm id={item.id} action={requestChangesAction} label="Pedir ajustes" />
          <DecisionForm id={item.id} action={rejectClassifiedAction} label="Rejeitar" />
          <DecisionForm id={item.id} action={unpublishClassifiedAction} label="Arquivar" />
        </div>
      </div>
    </article>
  );
}

function ActionButton({ id, action, label }: { id: string; action: (formData: FormData) => Promise<void>; label: string }) {
  return (
    <SubmitOnceForm action={action}>
      <input type="hidden" name="id" value={id} />
      <SubmitOnceButton
        label={label}
        pendingLabel="Salvando..."
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-75"
      />
    </SubmitOnceForm>
  );
}

function DecisionForm({ id, action, label }: { id: string; action: (formData: FormData) => Promise<void>; label: string }) {
  return (
    <SubmitOnceForm action={action} className="flex gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="reason" placeholder="Motivo" className="w-32 rounded-md border bg-background px-2 py-2 text-sm" />
      <SubmitOnceButton
        label={label}
        pendingLabel="Salvando..."
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-75"
      />
    </SubmitOnceForm>
  );
}

function ReportAction({ id, status, label }: { id: string; status: 'reviewed' | 'dismissed'; label: string }) {
  return (
    <SubmitOnceForm action={resolveClassifiedReportAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitOnceButton
        label={label}
        pendingLabel="Salvando..."
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-75"
      />
    </SubmitOnceForm>
  );
}

function labelType(type: string): string {
  const labels: Record<string, string> = {
    vehicle: 'Veiculos',
    job: 'Vagas',
    service: 'Servicos',
    item: 'Itens',
    other: 'Outros',
  };
  return labels[type] ?? type;
}

import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { approveDeletionAction, rejectDeletionAction } from './actions';

export const metadata = { title: 'Exclusões de conta - Super admin' };

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

const statusFilters = ['pending', 'completed', 'rejected', 'canceled'] as const;
type StatusFilter = (typeof statusFilters)[number];

const statusTone: Record<StatusFilter, string> = {
  pending: 'bg-amber-100 text-amber-900',
  completed: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-rose-100 text-rose-900',
  canceled: 'bg-slate-100 text-slate-700',
};

const statusLabel: Record<StatusFilter, string> = {
  pending: 'Pendentes',
  completed: 'Concluídos',
  rejected: 'Rejeitados',
  canceled: 'Cancelados',
};

const flashLabels: Record<string, { tone: 'success' | 'warn' | 'error'; text: string }> = {
  aprovado: { tone: 'success', text: 'Pedido aprovado e perfil anonimizado.' },
  rejeitado: { tone: 'success', text: 'Pedido rejeitado.' },
  erro: { tone: 'error', text: 'Não foi possível concluir a ação. Tente de novo.' },
};

export default async function SuperDeletionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; msg?: string }>;
}) {
  await requireRole({ kinds: ['super_admin'] });
  const params = await searchParams;
  const status: StatusFilter = (statusFilters as readonly string[]).includes(params.status ?? '')
    ? (params.status as StatusFilter)
    : 'pending';

  const supabase = await createClient();
  const { data: requests } = await supabase
    .from('account_deletion_requests')
    .select(
      'id, status, reason, requested_email, requested_at, reviewed_at, review_notes, profiles!account_deletion_requests_profile_id_fkey(id, full_name)',
    )
    .eq('status', status)
    .order('requested_at', { ascending: status === 'pending' });

  const flash = params.msg ? flashLabels[params.msg] : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Exclusões de conta</h1>
        <p className="text-muted-foreground">
          Aprovação manual de pedidos de exclusão (LGPD). Aprovar anonimiza o perfil e cancela a
          newsletter.
        </p>
      </header>

      {flash && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            flash.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : flash.tone === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          {flash.text}
        </div>
      )}

      <nav className="flex flex-wrap gap-2 text-sm">
        {statusFilters.map((s) => (
          <a
            key={s}
            href={`/painel/super/exclusoes?status=${s}`}
            className={`rounded-full border px-3 py-1 ${
              s === status ? 'bg-foreground text-background' : 'hover:bg-muted'
            }`}
          >
            {statusLabel[s]}
          </a>
        ))}
      </nav>

      <div className="grid gap-3">
        {(requests ?? []).map((req) => {
          const profile = req.profiles as { full_name?: string | null } | null;
          return (
            <article key={req.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{profile?.full_name ?? 'Conta sem nome'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {req.requested_email ?? 'email indisponível'}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[status]}`}>
                  {statusLabel[status]}
                </span>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Solicitado em {dateFmt.format(new Date(req.requested_at))}
                {req.reviewed_at && ` · revisado em ${dateFmt.format(new Date(req.reviewed_at))}`}
              </p>

              {req.reason && (
                <p className="mt-3 rounded-md bg-muted/40 p-3 text-sm">
                  <strong className="block text-xs uppercase tracking-wide text-muted-foreground">
                    Motivo informado
                  </strong>
                  {req.reason}
                </p>
              )}

              {req.review_notes && status !== 'pending' && (
                <p className="mt-3 text-sm">
                  <strong className="block text-xs uppercase tracking-wide text-muted-foreground">
                    Nota da revisão
                  </strong>
                  {req.review_notes}
                </p>
              )}

              {status === 'pending' && (
                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <form action={approveDeletionAction} className="flex flex-1 gap-2">
                    <input type="hidden" name="request_id" value={req.id} />
                    <input
                      name="notes"
                      placeholder="Nota interna (opcional)"
                      maxLength={1000}
                      className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                    <button
                      className="rounded-lg bg-destructive px-3 py-2 text-sm text-white"
                      type="submit"
                    >
                      Aprovar e anonimizar
                    </button>
                  </form>
                  <form action={rejectDeletionAction} className="flex flex-1 gap-2">
                    <input type="hidden" name="request_id" value={req.id} />
                    <input
                      name="notes"
                      placeholder="Motivo da rejeição"
                      required
                      minLength={3}
                      maxLength={1000}
                      className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                    <button className="rounded-lg border px-3 py-2 text-sm hover:bg-muted" type="submit">
                      Rejeitar
                    </button>
                  </form>
                </div>
              )}
            </article>
          );
        })}

        {(requests?.length ?? 0) === 0 && (
          <div className="rounded-2xl border bg-card p-6 text-muted-foreground">
            Nenhum pedido em {statusLabel[status].toLowerCase()}.
          </div>
        )}
      </div>
    </div>
  );
}

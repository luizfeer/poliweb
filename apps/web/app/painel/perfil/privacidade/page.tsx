import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  cancelAccountDeletionAction,
  exportMyDataAction,
  requestAccountDeletionAction,
} from '../actions';

export const metadata = { title: 'Privacidade do perfil - Portal Carmelitano' };

const statusLabel: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Em análise', tone: 'bg-amber-100 text-amber-900' },
  approved: { label: 'Aprovado', tone: 'bg-emerald-100 text-emerald-900' },
  rejected: { label: 'Rejeitado', tone: 'bg-rose-100 text-rose-900' },
  completed: { label: 'Concluído', tone: 'bg-slate-200 text-slate-900' },
  canceled: { label: 'Cancelado', tone: 'bg-slate-100 text-slate-700' },
};

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export default async function ProfilePrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ delete?: string; export?: string }>;
}) {
  const auth = await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from('account_deletion_requests')
    .select('id, status, reason, requested_at, reviewed_at, review_notes')
    .eq('profile_id', auth.profile.id)
    .order('requested_at', { ascending: false })
    .limit(5);

  const pending = (requests ?? []).find((r) => r.status === 'pending');

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Privacidade</h1>
        <p className="text-muted-foreground">Controle de dados pessoais conforme LGPD.</p>
      </header>

      {params.delete === 'solicitado' && (
        <FlashBanner tone="success">
          Pedido de exclusão registrado. Um administrador vai revisar em até 15 dias.
        </FlashBanner>
      )}
      {params.delete === 'cancelado' && (
        <FlashBanner tone="info">Pedido de exclusão cancelado.</FlashBanner>
      )}
      {params.delete === 'pendente' && (
        <FlashBanner tone="warn">
          Você já tem um pedido em análise. Acompanhe abaixo ou cancele para abrir outro.
        </FlashBanner>
      )}
      {params.export === 'solicitado' && (
        <FlashBanner tone="success">Solicitação de exportação registrada.</FlashBanner>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <form action={exportMyDataAction} className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Exportar meus dados</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Registra a solicitação de exportação para atendimento operacional.
          </p>
          <button className="mt-4 rounded-md border px-4 py-2 text-sm" type="submit">
            Solicitar exportação
          </button>
        </form>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Excluir minha conta</h2>
          {pending ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Pedido em análise desde {dateFmt.format(new Date(pending.requested_at))}.
                Você pode cancelar enquanto não for aprovado.
              </p>
              <form action={cancelAccountDeletionAction} className="mt-4">
                <input type="hidden" name="request_id" value={pending.id} />
                <button className="rounded-md border px-4 py-2 text-sm" type="submit">
                  Cancelar pedido
                </button>
              </form>
            </>
          ) : (
            <form action={requestAccountDeletionAction} className="mt-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                Pedido vai para uma fila de aprovação manual. Quando aprovado, seu perfil é
                anonimizado e a newsletter cancelada. Prazo de até 15 dias.
              </p>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Motivo (opcional)</span>
                <textarea
                  name="reason"
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Conte rapidamente o motivo. Ajuda a melhorar o portal."
                />
              </label>
              <button
                className="rounded-md bg-destructive px-4 py-2 text-sm text-white"
                type="submit"
              >
                Solicitar exclusão
              </button>
            </form>
          )}
        </div>
      </section>

      {(requests?.length ?? 0) > 0 && (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Histórico de pedidos</h2>
          <ul className="mt-3 divide-y">
            {(requests ?? []).map((req) => {
              const meta = statusLabel[req.status] ?? statusLabel.pending;
              return (
                <li key={req.id} className="flex flex-col gap-1 py-3 text-sm md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.tone}`}>
                        {meta.label}
                      </span>
                      <span className="text-muted-foreground">
                        {dateFmt.format(new Date(req.requested_at))}
                      </span>
                    </div>
                    {req.reason && <p className="mt-1 text-muted-foreground">{req.reason}</p>}
                    {req.review_notes && (
                      <p className="mt-1 text-muted-foreground">
                        <strong>Resposta:</strong> {req.review_notes}
                      </p>
                    )}
                  </div>
                  {req.reviewed_at && (
                    <span className="text-xs text-muted-foreground">
                      Revisado em {dateFmt.format(new Date(req.reviewed_at))}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}

function FlashBanner({
  tone,
  children,
}: {
  tone: 'success' | 'info' | 'warn';
  children: React.ReactNode;
}) {
  const map = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    info: 'border-slate-200 bg-slate-50 text-slate-900',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
  };
  return <div className={`rounded-lg border px-4 py-3 text-sm ${map[tone]}`}>{children}</div>;
}

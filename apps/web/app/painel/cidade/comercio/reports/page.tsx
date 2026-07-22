import { Link } from '@/components/navigation/link';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { resolveBusinessReportAction } from '../actions';

const reasonLabels: Record<string, string> = {
  closed: 'Não existe mais',
  outdated_info: 'Informações desatualizadas',
  wrong_contact: 'Telefone ou WhatsApp errado',
  wrong_address: 'Endereço errado',
  duplicate: 'Anúncio duplicado',
  inappropriate: 'Conteúdo inadequado',
  other: 'Outro erro',
};

export default async function BusinessReportsPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from('business_reports')
    .select(
      'id, business_id, reason, notes, status, created_at, businesses(id, name, slug), profiles!business_reports_reporter_profile_id_fkey(full_name)',
    )
    .eq('city_id', city.id)
    .order('created_at', { ascending: false });

  const pendingReports = (reports ?? []).filter((report) => report.status === 'pending');

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">Comércio</p>
        <h1 className="text-3xl font-bold">Relatos de erro</h1>
        <p className="mt-2 text-muted-foreground">Revise anúncios marcados por usuários como incorretos.</p>
      </header>

      <div className="grid gap-3">
        {pendingReports.map((report) => {
          const business = report.businesses as { id?: string | null; name?: string | null; slug?: string | null } | null;
          const profile = report.profiles as { full_name?: string | null } | null;

          return (
            <article key={report.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {reasonLabels[report.reason] ?? report.reason}
                  </p>
                  <h2 className="mt-1 font-semibold">{business?.name ?? 'Negócio'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Relatado por {profile?.full_name ?? 'usuário'} em {formatDate(report.created_at)}
                  </p>
                  {report.notes && <p className="mt-3 text-sm">{report.notes}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {business?.id && (
                    <Link className="rounded-lg border px-3 py-2 text-sm hover:bg-muted" href={`/painel/comercio/${business.id}`}>
                      Editar ficha
                    </Link>
                  )}
                  {business?.slug && (
                    <Link
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                      href={`/comercio/negocio/${business.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver anúncio
                    </Link>
                  )}
                  <ReportAction id={report.id} status="reviewed" label="Aprovar relato" />
                  <ReportAction id={report.id} status="dismissed" label="Dispensar" />
                </div>
              </div>
            </article>
          );
        })}
        {pendingReports.length === 0 && (
          <div className="rounded-2xl border bg-card p-6 text-muted-foreground">Nenhum relato pendente.</div>
        )}
      </div>
    </div>
  );
}

function ReportAction({ id, status, label }: { id: string; status: 'reviewed' | 'dismissed'; label: string }) {
  return (
    <SubmitOnceForm action={resolveBusinessReportAction}>
      <input type="hidden" name="report_id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitOnceButton
        label={label}
        pendingLabel="Salvando..."
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:cursor-wait disabled:opacity-75"
      />
    </SubmitOnceForm>
  );
}

function formatDate(value: string | null): string {
  if (!value) return 'data não registrada';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}

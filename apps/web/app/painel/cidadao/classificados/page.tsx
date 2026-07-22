import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Car, Hammer, Plus, ShoppingBag, Sparkles, Wrench } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { getCurrentCity } from '@/lib/cities';
import { listMyClassifieds } from '@/lib/classifieds/queries';
import type { Classified, ClassifiedType } from '@/lib/classifieds/types';
import { FeaturePurchaseDialog } from '@/components/community/feature-purchase-dialog';
import { isVideoSrc, videoPosterUrl } from '@/lib/media/video-poster';
import { markAsSoldAction, requestRenewalAction, submitForReviewAction } from './actions';

const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const TYPE_META: Record<ClassifiedType, { label: string; icon: typeof Car }> = {
  vehicle: { label: 'Veículo', icon: Car },
  job: { label: 'Vaga', icon: Hammer },
  service: { label: 'Serviço', icon: Wrench },
  item: { label: 'Objeto', icon: ShoppingBag },
  other: { label: 'Outro', icon: ShoppingBag },
};

export const metadata = { title: 'Meus classificados - Portal Carmelitano' };

export default async function MyClassifiedsPage() {
  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  const items = await listMyClassifieds(city.id, auth.profile.id);

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Cidadão</p>
          <h1 className="text-3xl font-bold">Meus classificados</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe rascunhos, revisão, publicação e renovação dos seus anúncios.
          </p>
        </div>
        <Link
          href="/painel/cidadao/classificados/novo"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Novo classificado
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <h2 className="text-lg font-semibold">Você ainda não publicou nada.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie seu primeiro classificado e ele entra na vitrine assim que for aprovado.
          </p>
          <Link
            href="/painel/cidadao/classificados/novo"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" /> Criar classificado
          </Link>
        </div>
      ) : (
        <section className="grid gap-4">
          {items.map((item) => (
            <ClassifiedHubCard
              key={item.id}
              item={item}
              cityId={city.id}
              fullName={auth.profile.full_name}
              phone={auth.profile.phone}
            />
          ))}
        </section>
      )}
    </main>
  );
}

function ClassifiedHubCard({
  item,
  cityId,
  fullName,
  phone,
}: {
  item: Classified;
  cityId: string;
  fullName: string | null;
  phone: string | null;
}) {
  const typeMeta = TYPE_META[item.type] ?? TYPE_META.other;
  const TypeIcon = typeMeta.icon;
  const isFeatured = item.featuredUntil
    ? new Date(item.featuredUntil).getTime() > Date.now()
    : false;
  const coverSrc = item.coverUrl
    ? isVideoSrc(item.coverUrl)
      ? videoPosterUrl(item.coverUrl)
      : item.coverUrl
    : null;

  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="grid gap-0 md:grid-cols-[200px_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] bg-muted md:aspect-auto md:min-h-[160px]">
          {coverSrc ? (
            <Image src={coverSrc} alt="" fill unoptimized className="object-cover" sizes="200px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <TypeIcon className="size-10" aria-hidden="true" />
            </div>
          )}
          {isFeatured ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-sun-300 px-2.5 py-1 text-xs font-extrabold text-ink-900 shadow">
              <Sparkles className="size-3" /> Destaque
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <TypeIcon className="size-3.5" /> {typeMeta.label}
            </div>
            <h2 className="mt-1 text-xl font-bold leading-tight">{item.title}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge kind="status" value={item.status} />
              <StatusBadge kind="review" value={item.reviewStatus} />
              <StatusBadge kind="payment" value={item.paymentStatus} />
            </div>
            {item.paymentAmountCents > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Taxa: {moneyFormatter.format(item.paymentAmountCents / 100)}
              </p>
            ) : null}
            {item.rejectionReason ? (
              <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                <strong>Motivo da recusa:</strong> {item.rejectionReason}
              </p>
            ) : null}
            {isFeatured ? (
              <p className="mt-2 text-xs font-semibold text-cerrado-700">
                Destaque ativo até {dateFormatter.format(new Date(item.featuredUntil!))}
              </p>
            ) : null}
          </div>

          <div className="mt-auto flex flex-wrap gap-2 border-t pt-3">
            {item.status === 'draft' || item.paymentStatus === 'pending' ? (
              <SubmitOnceForm action={submitForReviewAction}>
                <input type="hidden" name="id" value={item.id} />
                <SubmitOnceButton
                  label={item.paymentStatus === 'pending' ? 'Continuar pagamento' : 'Enviar para revisão'}
                  pendingLabel="Enviando..."
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                />
              </SubmitOnceForm>
            ) : null}
            {item.status === 'published' ? (
              <SubmitOnceForm action={markAsSoldAction}>
                <input type="hidden" name="id" value={item.id} />
                <SubmitOnceButton
                  label="Marcar vendido"
                  pendingLabel="Salvando..."
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
                />
              </SubmitOnceForm>
            ) : null}
            {item.status === 'archived' ? (
              <SubmitOnceForm action={requestRenewalAction}>
                <input type="hidden" name="id" value={item.id} />
                <SubmitOnceButton
                  label="Renovar"
                  pendingLabel="Renovando..."
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
                />
              </SubmitOnceForm>
            ) : null}
            {item.status === 'published' && item.reviewStatus === 'approved' ? (
              <FeaturePurchaseDialog
                cityId={cityId}
                targetType="classified"
                targetId={item.id}
                targetTitle={item.title}
                planSlug="destaque-30d"
                amountCents={4900}
                durationDays={30}
                defaultFullName={fullName}
                defaultPhone={phone}
                currentFeaturedUntil={item.featuredUntil}
              />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({
  kind,
  value,
}: {
  kind: 'status' | 'review' | 'payment';
  value: string;
}) {
  const map: Record<string, Record<string, { label: string; className: string }>> = {
    status: {
      draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
      pending: { label: 'Em revisão', className: 'bg-amber-100 text-amber-800' },
      published: { label: 'Publicado', className: 'bg-emerald-100 text-emerald-800' },
      rejected: { label: 'Recusado', className: 'bg-destructive/10 text-destructive' },
      archived: { label: 'Arquivado', className: 'bg-muted text-muted-foreground' },
    },
    review: {
      pending: { label: 'Aguardando revisão', className: 'bg-amber-100 text-amber-800' },
      approved: { label: 'Aprovado', className: 'bg-emerald-100 text-emerald-800' },
      rejected: { label: 'Recusado', className: 'bg-destructive/10 text-destructive' },
      needs_changes: { label: 'Precisa ajustes', className: 'bg-amber-100 text-amber-800' },
    },
    payment: {
      not_required: { label: 'Sem taxa', className: 'bg-muted text-muted-foreground' },
      pending: { label: 'Pagto. pendente', className: 'bg-amber-100 text-amber-800' },
      paid: { label: 'Pago', className: 'bg-emerald-100 text-emerald-800' },
      waived: { label: 'Cortesia', className: 'bg-cerrado-100 text-cerrado-700' },
    },
  };
  const meta = map[kind]?.[value] ?? { label: value, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

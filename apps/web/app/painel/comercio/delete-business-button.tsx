import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { deleteBusinessAction } from './actions';

type Props = {
  businessId: string;
  businessName: string;
};

export function DeleteBusinessButton({ businessId, businessName }: Props) {
  return (
    <details className="group relative">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center justify-center rounded-lg border border-destructive bg-white px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 marker:hidden [&::-webkit-details-marker]:hidden">
        Excluir ficha
      </summary>
      <div className="absolute right-0 z-[95] mt-2 w-[min(320px,calc(100vw-2rem))] rounded-xl border border-ink-100 bg-white p-4 shadow-pop">
        <p className="text-sm font-semibold text-ink-900">Excluir ficha comercial?</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {businessName} sera removida permanentemente. Esta acao nao pode ser desfeita.
        </p>
        <SubmitOnceForm action={deleteBusinessAction} className="mt-4 grid gap-2">
          <input type="hidden" name="business_id" value={businessId} />
          <SubmitOnceButton
            label="Confirmar exclusão"
            pendingLabel="Excluindo..."
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
          />
        </SubmitOnceForm>
      </div>
    </details>
  );
}

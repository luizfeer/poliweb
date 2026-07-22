import { reportClassifiedAction } from '@/app/(public)/classificados/actions';

export function ReportButton({ classifiedId }: { classifiedId: string }) {
  return (
    <form action={reportClassifiedAction} className="rounded-lg border bg-card p-4">
      <input type="hidden" name="classified_id" value={classifiedId} />
      <label className="text-sm font-medium" htmlFor={`classified-report-${classifiedId}`}>
        Reportar anuncio suspeito
      </label>
      <div className="mt-2 grid gap-2 md:grid-cols-[180px_1fr_auto]">
        <select id={`classified-report-${classifiedId}`} name="reason" className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="golpe">Golpe</option>
          <option value="spam">Spam</option>
          <option value="inadequado">Inadequado</option>
          <option value="incorreto">Incorreto</option>
        </select>
        <input name="notes" placeholder="Detalhe opcional" className="rounded-md border bg-background px-3 py-2 text-sm" />
        <button className="rounded-md border px-4 py-2 text-sm" type="submit">
          Enviar
        </button>
      </div>
    </form>
  );
}

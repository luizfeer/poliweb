import { Flag, MoreHorizontal } from 'lucide-react';
import { reportContentAction } from '@/lib/community/actions';
import type { ModerationEntityType } from '@/lib/community/types';

export function ReportForm({
  cityId,
  entityType,
  entityId,
  align = 'right',
}: {
  cityId: string;
  entityType: ModerationEntityType;
  entityId: string;
  align?: 'left' | 'right';
}) {
  const panelClassName =
    align === 'left'
      ? 'absolute left-0 z-20 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg'
      : 'absolute right-0 z-20 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg';

  return (
    <details className="group relative inline-block">
      <summary
        aria-label="Mais opções"
        className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition hover:bg-muted [&::-webkit-details-marker]:hidden"
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </summary>
      <form
        action={reportContentAction}
        className={panelClassName}
      >
        <input type="hidden" name="city_id" value={cityId} />
        <input type="hidden" name="entity_type" value={entityType} />
        <input type="hidden" name="entity_id" value={entityId} />
        <label className="flex items-center gap-2 text-sm font-medium" htmlFor={`reason-${entityId}`}>
          <Flag size={14} aria-hidden="true" />
          Denunciar conteúdo
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Avise a moderação sobre spam, golpe, informação falsa ou conteúdo inadequado.
        </p>
        <div className="mt-3 grid gap-2">
          <select id={`reason-${entityId}`} name="reason" className="min-h-10 rounded-md border bg-background px-3 text-sm">
            <option value="spam">Spam</option>
            <option value="inadequate">Inadequado</option>
            <option value="fake">Informação falsa</option>
            <option value="other">Outro</option>
          </select>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Enviar denúncia
          </button>
        </div>
      </form>
    </details>
  );
}

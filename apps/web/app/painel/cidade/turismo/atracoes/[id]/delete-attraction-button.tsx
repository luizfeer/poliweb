'use client';

import { useRef, useState } from 'react';
import { deleteAttractionAction } from '../actions';

type Props = {
  attractionId: string;
  attractionName: string;
};

export function DeleteAttractionButton({ attractionId, attractionName }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleConfirm() {
    if (!formRef.current) return;
    setPending(true);
    const data = new FormData(formRef.current);
    await deleteAttractionAction(data);
    setPending(false);
    setOpen(false);
  }

  return (
    <>
      <button
        className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
        type="button"
        onClick={() => setOpen(true)}
      >
        Excluir atração
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50" onClick={() => !pending && setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Excluir atração?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{attractionName}</span> será removida permanentemente. Esta ação não pode ser desfeita.
            </p>

            <form ref={formRef}>
              <input type="hidden" name="attraction_id" value={attractionId} />
            </form>

            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50" type="button" disabled={pending} onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50" type="button" disabled={pending} onClick={handleConfirm}>
                {pending ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { ImagePlus, Star, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { createReviewAction } from './actions';

type ReviewPromptProps = {
  businessId: string;
  businessName: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-clay-500 px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-clay-600 disabled:bg-ink-300"
    >
      {pending ? 'Enviando...' : 'Enviar para moderação'}
    </button>
  );
}

export function ReviewPrompt({ businessId, businessName }: ReviewPromptProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  function chooseRating(nextRating: number) {
    setRating(nextRating);
    setOpen(true);
  }

  return (
    <>
      <section className="mx-3.5 mt-3 rounded-md border border-ink-100 bg-white p-3">
        <div className="text-[13px] font-bold text-ink-900">Avaliar este negócio</div>
        <div className="mt-2 flex items-center gap-1.5" aria-label="Escolha uma nota de 1 a 5 estrelas">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => chooseRating(value)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-deep text-sun-500 transition hover:bg-clay-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
              aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
            >
              <Star
                size={23}
                strokeWidth={2}
                className={cn(rating && value <= rating ? 'fill-sun-500' : 'fill-transparent')}
              />
            </button>
          ))}
        </div>
      </section>

      {open && rating ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-900/55" role="presentation">
          <form
            action={createReviewAction}
            className="w-full max-w-[430px] rounded-t-xl bg-white shadow-pop"
            encType="multipart/form-data"
          >
            <input type="hidden" name="business_id" value={businessId} />
            <input type="hidden" name="rating" value={rating} />

            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <div>
                <h2 className="m-0 text-[17px] font-bold text-ink-900">Sua avaliação</h2>
                <p className="m-0 mt-0.5 text-[12px] text-ink-600">{businessName}</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-deep text-ink-700"
                aria-label="Fechar avaliação"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3 px-4 py-4">
              <div className="flex gap-1 text-sun-500" aria-label={`${rating} estrelas selecionadas`}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="rounded-full p-1"
                    aria-label={`Alterar para ${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
                  >
                    <Star size={22} className={value <= rating ? 'fill-sun-500' : 'fill-transparent'} />
                  </button>
                ))}
              </div>

              <input
                name="title"
                placeholder="Título da avaliação"
                className="rounded-md border border-ink-200 px-3 py-2.5 text-[13px] focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-50"
              />
              <textarea
                name="comment"
                placeholder="Conte como foi sua experiência"
                className="min-h-28 resize-none rounded-md border border-ink-200 px-3 py-2.5 text-[13px] focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-50"
              />

              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-ink-200 px-3 py-3 text-[13px] font-semibold text-ink-700">
                <ImagePlus size={18} className="text-clay-600" />
                <span className="min-w-0 flex-1 truncate">{fileName ?? 'Adicionar imagem'}</span>
                <input
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
                />
              </label>
            </div>

            <div className="grid gap-2 border-t border-ink-100 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              <SubmitButton />
              <p className="m-0 text-[11px] leading-snug text-ink-500">
                A avaliação passa por moderação antes de aparecer no portal.
              </p>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

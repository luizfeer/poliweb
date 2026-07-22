'use client';

import { Camera, ImagePlus, Lightbulb, MessageSquareText, Star, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { submitAttractionExperienceAction } from './actions';

type ContributionPromptsProps = {
  attractionId: string;
  attractionName: string;
};

type SelectedMedia = {
  name: string;
  type: 'image' | 'video';
};

const maxMediaItems = 5;

function ExperienceSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-clay-500 hover:bg-clay-600 disabled:bg-ink-300 inline-flex min-h-11 w-full items-center justify-center rounded-md px-4 text-[13px] font-bold text-white transition-colors"
    >
      {pending ? 'Enviando...' : 'Enviar para moderação'}
    </button>
  );
}

export function ContributionPrompts({ attractionId, attractionName }: ContributionPromptsProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [media, setMedia] = useState<SelectedMedia[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  function handleMediaChange(files: FileList | null) {
    const selected = Array.from(files ?? [])
      .slice(0, maxMediaItems)
      .map((file) => ({
        name: file.name,
        type: file.type.startsWith('video/') ? ('video' as const) : ('image' as const),
      }));
    setMedia(selected);
  }

  return (
    <>
      <section className="border-ink-100 overflow-hidden rounded-lg border bg-white">
        <div className="bg-cerrado-100/70 border-ink-100 flex items-start gap-3 border-b p-4">
          <span className="bg-cerrado-700 flex size-10 shrink-0 items-center justify-center rounded-full text-white">
            <MessageSquareText className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-ink-950 m-0 text-[16px] font-bold leading-tight">
              Compartilhe sua experiência
            </h3>
            <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">
              Envie uma avaliação da atração, conte como foi a visita e adicione até 5 fotos ou
              vídeos da comunidade.
            </p>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="text-ink-700 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
            <span className="bg-paper inline-flex items-center gap-1 rounded-full px-2.5 py-1">
              <Star className="fill-sun-500 text-sun-500 size-3.5" aria-hidden="true" />
              Avaliação
            </span>
            <span className="bg-paper inline-flex items-center gap-1 rounded-full px-2.5 py-1">
              <Camera className="text-clay-600 size-3.5" aria-hidden="true" />
              Foto
            </span>
            <span className="bg-paper inline-flex items-center gap-1 rounded-full px-2.5 py-1">
              <Video className="size-3.5 text-sky-700" aria-hidden="true" />
              Vídeo
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="bg-ink-900 hover:bg-ink-800 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-[13px] font-bold text-white transition-colors"
          >
            <ImagePlus className="size-4" aria-hidden="true" />
            Enviar experiência
          </button>
        </div>
      </section>

      {open ? (
        <div
          className="bg-ink-900/60 fixed inset-0 z-[90] flex items-end justify-center px-0 sm:items-center sm:px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="experience-modal-title"
        >
          <form
            action={submitAttractionExperienceAction}
            encType="multipart/form-data"
            className="shadow-pop max-h-[92vh] w-full max-w-[560px] overflow-hidden rounded-t-xl bg-white sm:rounded-xl"
          >
            <input type="hidden" name="attraction_id" value={attractionId} />
            <input type="hidden" name="rating" value={rating} />

            <div className="border-ink-100 flex items-start justify-between gap-3 border-b px-4 py-4">
              <div className="min-w-0">
                <p className="text-cerrado-700 m-0 text-[11px] font-bold uppercase tracking-[0.06em]">
                  Envio da comunidade
                </p>
                <h2
                  id="experience-modal-title"
                  className="text-ink-950 m-0 mt-1 text-[19px] font-bold"
                >
                  Compartilhe sua experiência
                </h2>
                <p className="text-ink-600 m-0 mt-0.5 text-[12px]">{attractionName}</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="bg-paper-deep text-ink-700 flex size-9 shrink-0 items-center justify-center rounded-full"
                aria-label="Fechar envio de experiência"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid max-h-[calc(92vh-158px)] gap-4 overflow-y-auto px-4 py-4">
              <section className="grid gap-2">
                <label className="text-ink-900 text-[13px] font-bold">
                  Como você avalia essa atração?
                </label>
                <div
                  className="flex items-center gap-1.5"
                  aria-label="Escolha uma nota de 1 a 5 estrelas"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="bg-paper-deep text-sun-500 hover:bg-clay-50 focus-visible:outline-clay-500 flex size-11 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
                    >
                      <Star
                        size={24}
                        strokeWidth={2}
                        className={cn(value <= rating ? 'fill-sun-500' : 'fill-transparent')}
                      />
                    </button>
                  ))}
                  <span className="text-ink-700 ml-1 text-[13px] font-semibold">{rating}/5</span>
                </div>
              </section>

              <section className="grid gap-3">
                <input
                  name="title"
                  placeholder="Dê um título curto para sua visita"
                  className="border-ink-200 focus:border-clay-500 focus:ring-clay-50 rounded-md border px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2"
                />
                <textarea
                  name="comment"
                  placeholder="Descreva como foi sua experiência. Conte o que valeu a pena, como estava o lugar e para quem você recomenda."
                  className="border-ink-200 focus:border-clay-500 focus:ring-clay-50 min-h-32 resize-none rounded-md border px-3 py-2.5 text-[13px] leading-relaxed focus:outline-none focus:ring-2"
                />
                <input
                  name="caption"
                  placeholder="Dica rápida para outros visitantes"
                  className="border-ink-200 focus:border-clay-500 focus:ring-clay-50 rounded-md border px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2"
                />
              </section>

              <section className="grid gap-2">
                <label className="text-ink-900 text-[13px] font-bold">
                  Fotos e vídeos da comunidade
                </label>
                <label className="border-ink-200 bg-paper text-ink-700 flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-4 text-[13px] font-semibold">
                  <span className="text-clay-600 flex size-10 shrink-0 items-center justify-center rounded-full bg-white">
                    <ImagePlus className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block">Escolher até 5 itens</span>
                    <span className="text-ink-500 block text-[11px] font-medium">
                      JPG, PNG, WebP, MP4, WebM ou MOV
                    </span>
                  </span>
                  <input
                    name="media"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                    multiple
                    className="sr-only"
                    onChange={(event) => handleMediaChange(event.target.files)}
                  />
                </label>
                {media.length > 0 ? (
                  <ul className="m-0 grid list-none gap-1.5 p-0">
                    {media.map((item) => {
                      const Icon = item.type === 'video' ? Video : Camera;
                      return (
                        <li
                          key={item.name}
                          className="border-ink-100 text-ink-700 flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-[12px] font-semibold"
                        >
                          <Icon className="text-clay-600 size-3.5 shrink-0" aria-hidden="true" />
                          <span className="min-w-0 truncate">{item.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>

              <aside className="bg-cerrado-100/70 text-cerrado-900 flex gap-2 rounded-md p-3 text-[12px] leading-relaxed">
                <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p className="m-0">
                  Conte detalhes úteis: melhor horário, acesso, estacionamento, cuidado com
                  crianças, o que levar e se a visita vale mais em dia de sol ou de semana.
                </p>
              </aside>
            </div>

            <div className="border-ink-100 grid gap-2 border-t px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              <ExperienceSubmitButton />
              <p className="text-ink-500 m-0 text-[11px] leading-snug">
                Avaliações, fotos e vídeos passam por moderação antes de aparecer no portal.
              </p>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

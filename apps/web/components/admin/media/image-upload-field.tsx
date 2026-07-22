'use client';

import Image from 'next/image';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { deleteLegacyMediaAction, uploadMediaAction } from '@/lib/media/actions';
import { useIosTap } from '@/lib/ui/use-ios-tap';

type MediaRole = 'logo' | 'cover' | 'gallery' | 'avatar' | 'attachment' | 'ad';

type ImageUploadFieldProps = {
  entityType: string;
  entityId: string;
  role: MediaRole;
  label: string;
  currentUrl?: string | null;
  revalidatePath?: string;
  helpText?: string;
  /** Vínculo curto exibido no app (Dock nativo). Ex.: "Capa · Pousada X". */
  contextLabel?: string;
};

export function ImageUploadField({
  entityType,
  entityId,
  role,
  label,
  currentUrl,
  revalidatePath,
  helpText,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState(currentUrl ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const isLogo = role === 'logo' || role === 'avatar';

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError('');
    if (selected) setPreviewUrl(URL.createObjectURL(selected));
  }

  function submitUpload() {
    if (!file) return;

    const formData = new FormData();
    formData.set('entity_type', entityType);
    formData.set('entity_id', entityId);
    formData.set('role', role);
    formData.set('file', file);
    if (revalidatePath) formData.set('revalidate_path', revalidatePath);

    startTransition(async () => {
      setError('');
      try {
        const result = await uploadMediaAction(formData);
        if (result?.url) {
          setPreviewUrl(result.url);
          setFile(null);
          if (inputRef.current) inputRef.current.value = '';
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Falha ao enviar imagem.');
      }
    });
  }

  function removeCurrentImage() {
    if (!previewUrl || file) return;

    const formData = new FormData();
    formData.set('entity_type', entityType);
    formData.set('entity_id', entityId);
    formData.set('role', role);
    formData.set('url', previewUrl);
    if (revalidatePath) formData.set('revalidate_path', revalidatePath);

    startDelete(async () => {
      setError('');
      try {
        await deleteLegacyMediaAction(formData);
        setPreviewUrl('');
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Falha ao remover imagem.');
      }
    });
  }

  const hasPreview = Boolean(previewUrl);
  const aspectClass = isLogo ? 'aspect-square' : 'aspect-video';
  const isBusy = isPending || isDeleting;

  const pickTap = useIosTap(() => {
    if (isBusy) return;
    inputRef.current?.click();
  });

  return (
    <section className="grid gap-3 rounded-xl border border-ink-100 bg-card p-3 shadow-card sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{label}</h2>
          {helpText && <p className="mt-0.5 text-sm text-muted-foreground">{helpText}</p>}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-clay-50 text-clay-700">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      {/* Área clicável — abre o file picker (ou bridge nativa no app) */}
      <button
        type="button"
        {...pickTap}
        className={`group relative w-full touch-manipulation overflow-hidden rounded-xl border bg-muted transition-opacity ${aspectClass} ${isBusy ? 'cursor-wait opacity-70' : 'cursor-pointer hover:opacity-90'}`}
        aria-label={`Escolher ${label.toLowerCase()}`}
      >
        {hasPreview ? (
          <Image
            src={previewUrl}
            alt=""
            fill
            unoptimized
            className={isLogo ? 'object-contain p-3' : 'object-cover'}
            sizes="(max-width: 640px) 100vw, 400px"
          />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImagePlus className="h-7 w-7 opacity-40" aria-hidden="true" />
            <span className="text-xs">Clique para escolher</span>
          </span>
        )}

        {/* Overlay ao hover quando já tem imagem */}
        {hasPreview && !isBusy && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
            <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100">
              Trocar imagem
            </span>
          </span>
        )}

        {isBusy && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        onChange={handleFileChange}
      />

      {file && (
        <div className="grid gap-2">
          <p className="truncate text-xs text-muted-foreground">{file.name}</p>
          <Button type="button" onClick={submitUpload} disabled={isPending} className="w-full">
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Enviando…</>
              : <><Upload className="h-4 w-4" aria-hidden="true" /> Enviar</>
            }
          </Button>
        </div>
      )}

      {hasPreview && !file && (
        <form action={deleteLegacyMediaAction}>
          <input type="hidden" name="entity_type" value={entityType} />
          <input type="hidden" name="entity_id" value={entityId} />
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="url" value={previewUrl} />
          {revalidatePath ? <input type="hidden" name="revalidate_path" value={revalidatePath} /> : null}
          <Button
            type="submit"
            variant="outline"
            onClick={(event) => {
              event.preventDefault();
              removeCurrentImage();
            }}
            disabled={isBusy}
            className="w-full"
          >
            {isDeleting
              ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Removendo...</>
              : <><Trash2 className="h-4 w-4" aria-hidden="true" /> Remover imagem</>
            }
          </Button>
        </form>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}

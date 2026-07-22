'use client';

import Image from 'next/image';
import { ImagePlus, Loader2, Star, Trash2, Upload, Video, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  deleteLegacyMediaAction,
  deleteMediaAction,
  finalizeMediaUploadAction,
  requestMediaUploadTokenAction,
  setMediaAsCoverAction,
} from '@/lib/media/actions';
import { uploadDirectToProcessor } from '@/lib/media/direct-upload';
import { useIosTap } from '@/lib/ui/use-ios-tap';
import { isVideoSrc, videoPosterUrl } from '@/lib/media/video-poster';

export type GalleryMedia = {
  assetId: string;
  url: string;
  contentType?: string | null;
};

export type LegacyGalleryMedia = {
  url: string;
};

type PendingUpload = {
  id: string;
  file: File;
  previewUrl: string | null;
  isVideo: boolean;
  status: 'uploading' | 'finalizing' | 'error';
  progress: number;
  error?: string;
};

function createPreview(file: File): string | null {
  if (typeof URL === 'undefined') return null;
  try {
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

type GalleryUploadFieldProps = {
  entityType: string;
  entityId: string;
  media: GalleryMedia[];
  legacyMedia?: LegacyGalleryMedia[];
  revalidatePath?: string;
  title?: string;
  helpText?: string;
  /** Vínculo curto exibido no app (Dock nativo). Ex.: "Galeria · Restaurante X". */
  contextLabel?: string;
};

export function GalleryUploadField({
  entityType,
  entityId,
  media: initialMedia,
  legacyMedia: initialLegacyMedia = [],
  revalidatePath,
  title = 'Galeria',
  helpText = 'Publique fotos ou vídeos curtos na galeria pública.',
}: GalleryUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<GalleryMedia[]>(initialMedia);
  const [legacyMedia, setLegacyMedia] = useState<LegacyGalleryMedia[]>(initialLegacyMedia);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [coveringId, setCoveringId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const uploading = pending.some((item) => item.status === 'uploading' || item.status === 'finalizing');

  function triggerPick() {
    inputRef.current?.click();
  }

  const postTap = useIosTap(triggerPick);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError('');

    for (const file of Array.from(files)) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = createPreview(file);
      const isVideo = file.type.startsWith('video/');
      setPending((prev) => [...prev, { id, file, previewUrl, isVideo, status: 'uploading', progress: 0 }]);

      try {
        const token = await requestMediaUploadTokenAction({ entityType, entityId, role: 'gallery' });
        const processed = await uploadDirectToProcessor({
          file,
          token,
          onProgress: ({ percent }) => setPending((prev) => prev.map((p) => (p.id === id ? { ...p, progress: percent } : p))),
        });
        setPending((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'finalizing', progress: 99 } : p)));

        const result = await finalizeMediaUploadAction({
          entityType,
          entityId,
          role: 'gallery',
          altText: null,
          revalidatePath,
          processed,
        });

        setMedia((prev) => [{ assetId: result.id, url: result.url, contentType: result.contentType }, ...prev]);
        setPending((prev) => {
          const target = prev.find((p) => p.id === id);
          if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
          return prev.filter((p) => p.id !== id);
        });
        toast.success('Mídia adicionada na galeria.');
      } catch (caught) {
        const raw = caught instanceof Error ? caught.message : 'Falha ao enviar mídia.';
        const message = raw.length > 200 || /Server Components/i.test(raw)
          ? 'Falha ao enviar mídia. Tente novamente - se persistir, fale com o suporte.'
          : raw;
        console.error('[upload-galeria]', caught);
        setPending((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'error', error: message } : p)));
        setError(message);
        toast.error(message);
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (inputRef.current) inputRef.current.value = '';
    handleFiles(files);
  }

  function dismissPending(id: string) {
    setPending((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function handleDelete(assetId: string) {
    setDeletingId(assetId);
    setError('');
    try {
      const formData = new FormData();
      formData.set('asset_id', assetId);
      if (revalidatePath) formData.set('revalidate_path', revalidatePath);
      await deleteMediaAction(formData);
      setMedia((prev) => prev.filter((item) => item.assetId !== assetId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao remover mídia.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteLegacy(url: string) {
    setDeletingId(url);
    setError('');
    try {
      const formData = new FormData();
      formData.set('entity_type', entityType);
      formData.set('entity_id', entityId);
      formData.set('role', 'gallery');
      formData.set('url', url);
      if (revalidatePath) formData.set('revalidate_path', revalidatePath);
      await deleteLegacyMediaAction(formData);
      setLegacyMedia((prev) => prev.filter((item) => item.url !== url));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao remover mídia legada.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetCover(assetId: string) {
    setCoveringId(assetId);
    setError('');
    try {
      const formData = new FormData();
      formData.set('asset_id', assetId);
      formData.set('entity_type', entityType);
      formData.set('entity_id', entityId);
      if (revalidatePath) formData.set('revalidate_path', revalidatePath);
      await setMediaAsCoverAction(formData);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao definir capa.');
    } finally {
      setCoveringId(null);
    }
  }

  const itemCount = media.length + legacyMedia.length;

  return (
    <section className="grid gap-4 rounded-xl border border-ink-100 bg-card p-3 shadow-card sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {itemCount} item{itemCount !== 1 ? 's' : ''}. {helpText}
          </p>
        </div>
        <Button
          type="button"
          {...postTap}
          disabled={uploading}
          className="min-h-11 shrink-0 touch-manipulation px-4"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-5 w-5" aria-hidden="true" />
          )}
          Postar mídia
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {media.map((item) => {
          const isDeleting = deletingId === item.assetId;
          const isCovering = coveringId === item.assetId;
          const isVideo = isVideoSrc(item.url, item.contentType);
          return (
            <div key={item.assetId} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
              {isVideo ? (
                <>
                  <video
                    src={item.url}
                    poster={videoPosterUrl(item.url) ?? undefined}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <span className="absolute bottom-2 left-2 flex size-8 items-center justify-center rounded-full bg-black/65 text-white">
                    <Video className="h-4 w-4" aria-hidden="true" />
                  </span>
                </>
              ) : (
                <Image
                  src={item.url}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="120px"
                />
              )}
              <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
                {!isVideo ? (
                  <form action={setMediaAsCoverAction}>
                    <input type="hidden" name="asset_id" value={item.assetId} />
                    <input type="hidden" name="entity_type" value={entityType} />
                    <input type="hidden" name="entity_id" value={entityId} />
                    {revalidatePath ? <input type="hidden" name="revalidate_path" value={revalidatePath} /> : null}
                    <button
                      type="submit"
                      onClick={(event) => {
                        event.preventDefault();
                        if (isCovering || isDeleting || uploading) {
                          return;
                        }
                        void handleSetCover(item.assetId);
                      }}
                      disabled={isCovering || isDeleting || uploading}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/92 px-3 text-xs font-semibold text-ink-900 shadow-sm transition-colors hover:bg-white disabled:opacity-60"
                    >
                      {isCovering ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Star className="h-4 w-4 text-sun-600" aria-hidden="true" />
                      )}
                      Definir capa
                    </button>
                  </form>
                ) : (
                  <span />
                )}
                <form action={deleteMediaAction}>
                  <input type="hidden" name="asset_id" value={item.assetId} />
                  {revalidatePath ? <input type="hidden" name="revalidate_path" value={revalidatePath} /> : null}
                  <button
                    type="submit"
                    onClick={(event) => {
                      event.preventDefault();
                      if (isDeleting || isCovering || uploading) {
                        return;
                      }
                      void handleDelete(item.assetId);
                    }}
                    disabled={isDeleting || isCovering || uploading}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition-opacity disabled:opacity-50 hover:bg-black/85 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Remover mídia"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          );
        })}

        {legacyMedia.map((item) => {
          const isDeleting = deletingId === item.url;
          const legacyIsVideo = isVideoSrc(item.url);
          const legacyDisplayUrl = legacyIsVideo ? videoPosterUrl(item.url) : item.url;
          return (
            <div
              key={item.url}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted bg-cover bg-center"
              style={legacyDisplayUrl ? { backgroundImage: `url(${legacyDisplayUrl})` } : undefined}
            >
              {legacyIsVideo && !legacyDisplayUrl ? (
                <video src={item.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
              ) : null}
              <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
                <span className="inline-flex min-h-9 items-center rounded-full bg-white/92 px-3 text-xs font-semibold text-ink-900 shadow-sm">
                  Legada
                </span>
                <form action={deleteLegacyMediaAction}>
                  <input type="hidden" name="entity_type" value={entityType} />
                  <input type="hidden" name="entity_id" value={entityId} />
                  <input type="hidden" name="role" value="gallery" />
                  <input type="hidden" name="url" value={item.url} />
                  {revalidatePath ? <input type="hidden" name="revalidate_path" value={revalidatePath} /> : null}
                  <button
                    type="submit"
                    onClick={(event) => {
                      event.preventDefault();
                      if (isDeleting || uploading) {
                        return;
                      }
                      void handleDeleteLegacy(item.url);
                    }}
                    disabled={isDeleting || uploading}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition-opacity disabled:opacity-50 hover:bg-black/85 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Remover mídia legada"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </div>
              <span className="absolute inset-x-2 bottom-2 truncate rounded bg-black/65 px-2 py-1 text-[11px] text-white">
                {item.url}
              </span>
            </div>
          );
        })}

        {pending.map((item) => (
          <div
            key={item.id}
            className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted"
          >
            {item.previewUrl && !item.isVideo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.previewUrl} alt="" className="h-full w-full object-cover opacity-60" />
            )}
            {item.previewUrl && item.isVideo && (
              <video src={item.previewUrl} muted playsInline className="h-full w-full object-cover opacity-60" />
            )}
            <div className="absolute inset-0 flex flex-col justify-end gap-1.5 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 text-white">
              <div className="flex items-center gap-1.5 text-[11px] font-medium">
                {item.status === 'error' ? (
                  <span className="text-red-200">Falhou</span>
                ) : (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {item.status === 'finalizing' ? 'Processando…' : `${item.progress}%`}
                  </>
                )}
              </div>
              {item.status !== 'error' && (
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
                  <div
                    className="h-full bg-white transition-[width] duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              {item.status === 'error' && item.error && (
                <p className="line-clamp-2 text-[11px] text-red-100">{item.error}</p>
              )}
            </div>
            {item.status === 'error' && (
              <button
                type="button"
                onClick={() => dismissPending(item.id)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white hover:bg-black/90"
                aria-label="Remover"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          {...postTap}
          disabled={uploading}
          className="relative aspect-[4/3] touch-manipulation rounded-xl border-2 border-dashed border-ink-200 bg-paper text-muted-foreground transition-colors hover:border-primary/50 hover:bg-clay-50 hover:text-primary disabled:opacity-50"
          aria-label="Postar mídia"
        >
          {uploading ? (
            <Loader2 className="m-auto h-7 w-7 animate-spin" />
          ) : (
            <ImagePlus className="m-auto h-8 w-8" aria-hidden="true" />
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
        className="sr-only"
        onChange={handleFileChange}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}

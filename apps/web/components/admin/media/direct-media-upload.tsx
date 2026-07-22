'use client';

import { AlertCircle, CheckCircle2, FileImage, FileVideo, Loader2, UploadCloud, X } from 'lucide-react';
import { useCallback, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  finalizeMediaUploadAction,
  requestMediaUploadTokenAction,
  type DirectUploadTokenResponse,
  type UploadedMedia,
} from '@/lib/media/actions';
import {
  uploadDirectToProcessor,
  type DirectUploadProgress,
  type ProcessedUploadResponse,
} from '@/lib/media/direct-upload';

type MediaRole = 'logo' | 'cover' | 'gallery' | 'avatar' | 'attachment' | 'ad';

type DirectMediaUploadProps = {
  entityType: string;
  entityId: string;
  role: MediaRole;
  accept?: string;
  multiple?: boolean;
  altText?: string;
  revalidatePath?: string;
  ctaLabel?: string;
  helpText?: string;
  className?: string;
  disabled?: boolean;
  /** Vínculo curto exibido no app (Dock nativo). Ex.: "Galeria · Restaurante X". */
  contextLabel?: string;
  onUploaded?: (result: UploadedMedia, processed: ProcessedUploadResponse) => void;
  onError?: (error: Error) => void;
};

type QueueItem = {
  id: string;
  file: File;
  previewUrl: string | null;
  status: 'queued' | 'uploading' | 'finalizing' | 'done' | 'error';
  progress: number;
  error?: string;
  abort?: () => void;
};

const DEFAULT_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,video/mp4,video/quicktime,video/webm';

export function DirectMediaUpload({
  entityType,
  entityId,
  role,
  accept = DEFAULT_ACCEPT,
  multiple = false,
  altText,
  revalidatePath,
  ctaLabel = 'Selecionar arquivo',
  helpText = 'Solte aqui ou toque para escolher. Imagem (JPG/PNG/HEIC) ou video (MP4/MOV/WebM).',
  className = '',
  disabled = false,
  onUploaded,
  onError,
}: DirectMediaUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const setItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;

      const list = (multiple ? arr : arr.slice(0, 1)).map<QueueItem>((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: createPreview(file),
        status: 'queued',
        progress: 0,
      }));

      setItems((prev) => (multiple ? [...prev, ...list] : list));

      for (const item of list) {
        try {
          setItem(item.id, { status: 'uploading', progress: 0 });
          const token: DirectUploadTokenResponse = await requestMediaUploadTokenAction({
            entityType,
            entityId,
            role,
          });

          const controller = new AbortController();
          setItem(item.id, { abort: () => controller.abort() });

          const processed = await uploadDirectToProcessor({
            file: item.file,
            token,
            signal: controller.signal,
            onProgress: (progress: DirectUploadProgress) =>
              setItem(item.id, { progress: progress.percent }),
          });

          setItem(item.id, { status: 'finalizing', progress: 99 });

          const media = await finalizeMediaUploadAction({
            entityType,
            entityId,
            role,
            altText: altText ?? null,
            revalidatePath,
            processed,
          });

          setItem(item.id, { status: 'done', progress: 100 });
          onUploaded?.(media, processed);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Falha no upload.';
          setItem(item.id, { status: 'error', error: message });
          onError?.(error instanceof Error ? error : new Error(message));
        }
      }
    },
    [entityType, entityId, role, altText, revalidatePath, multiple, setItem, onUploaded, onError],
  );

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    handleFiles(files);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }

  const activeUploads = items.filter((item) => item.status === 'uploading' || item.status === 'finalizing').length;

  return (
    <div className={`grid gap-3 ${className}`}>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-paper px-4 py-7 text-center transition-colors sm:py-8 ${
          isDragging
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-ink-200 text-muted-foreground hover:border-primary/50 hover:bg-clay-50 hover:text-primary'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <UploadCloud className="h-9 w-9" aria-hidden="true" />
        <div className="grid gap-0.5">
          <span className="text-sm font-semibold text-foreground">{ctaLabel}</span>
          <span className="text-xs leading-relaxed">{helpText}</span>
        </div>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={onInputChange}
          disabled={disabled || activeUploads > 0 && !multiple}
        />
      </label>

      {items.length > 0 && (
        <ul className="grid gap-2">
          {items.map((item) => (
            <UploadRow key={item.id} item={item} onRemove={() => removeItem(item.id)} />
          ))}
        </ul>
      )}

      {items.some((item) => item.status === 'error') && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setItems((prev) => prev.filter((item) => item.status !== 'error'))}
          className="justify-self-start"
        >
          Limpar erros
        </Button>
      )}
    </div>
  );
}

function UploadRow({ item, onRemove }: { item: QueueItem; onRemove: () => void }) {
  const isImage = item.file.type.startsWith('image/');
  const isVideo = item.file.type.startsWith('video/');
  const sizeMb = (item.file.size / (1024 * 1024)).toFixed(1);

  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card p-2 pr-3 shadow-sm">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.previewUrl && isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
        )}
        {item.previewUrl && isVideo && (
          <video src={item.previewUrl} muted playsInline className="h-full w-full object-cover" />
        )}
        {!item.previewUrl && (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            {isVideo ? <FileVideo className="h-6 w-6" /> : <FileImage className="h-6 w-6" />}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {sizeMb} MB · <StatusLabel status={item.status} />
        </p>
        {item.status !== 'done' && item.status !== 'error' && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-200"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
        {item.status === 'error' && (
          <p className="mt-1 line-clamp-2 text-xs text-destructive">{item.error}</p>
        )}
      </div>

      <StatusIcon status={item.status} />

      {(item.status === 'uploading' || item.status === 'queued') && item.abort && (
        <button
          type="button"
          onClick={() => item.abort?.()}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Cancelar upload"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {(item.status === 'done' || item.status === 'error') && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Remover da lista"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}

function StatusLabel({ status }: { status: QueueItem['status'] }) {
  switch (status) {
    case 'queued':
      return <>Aguardando…</>;
    case 'uploading':
      return <>Enviando…</>;
    case 'finalizing':
      return <>Processando no servidor…</>;
    case 'done':
      return <>Concluido</>;
    case 'error':
      return <>Erro</>;
  }
}

function StatusIcon({ status }: { status: QueueItem['status'] }) {
  if (status === 'uploading' || status === 'finalizing' || status === 'queued') {
    return <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden="true" />;
  }
  if (status === 'done') {
    return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />;
  }
  if (status === 'error') {
    return <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />;
  }
  return null;
}

function createPreview(file: File): string | null {
  if (typeof URL === 'undefined') return null;
  if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
    try {
      return URL.createObjectURL(file);
    } catch {
      return null;
    }
  }
  return null;
}

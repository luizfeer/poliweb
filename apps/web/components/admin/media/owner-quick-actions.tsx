'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Loader2, Megaphone, Pencil, Video as VideoIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { finalizeMediaUploadAction, requestMediaUploadTokenAction } from '@/lib/media/actions';
import { uploadDirectToProcessor } from '@/lib/media/direct-upload';

type OwnerQuickActionsProps = {
  entityType: string;
  entityId: string;
  adminPath: string;
  postsPath?: string;
  label?: string;
};

type UploadKind = 'image' | 'video';

export function OwnerQuickActions({
  entityType,
  entityId,
  adminPath,
  postsPath,
  label = 'Minha pagina',
}: OwnerQuickActionsProps) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadKind | null>(null);
  const [progress, setProgress] = useState(0);

  async function handleFiles(files: FileList | null, kind: UploadKind) {
    const selected = Array.from(files ?? []);
    if (selected.length === 0 || uploading) return;

    setUploading(kind);
    setProgress(0);
    const mediaLabel = kind === 'video' ? 'video' : 'foto';
    const toastId = toast.loading(
      selected.length > 1 ? `Enviando ${selected.length} arquivos...` : `Enviando ${mediaLabel}...`,
      { duration: Infinity },
    );

    try {
      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index]!;
        const token = await requestMediaUploadTokenAction({
          entityType,
          entityId,
          role: 'gallery',
        });

        const processed = await uploadDirectToProcessor({
          file,
          token,
          onProgress: ({ percent }) => {
            setProgress(percent);
            const prefix = selected.length > 1 ? `${index + 1}/${selected.length}` : mediaLabel;
            toast.loading(`Enviando ${prefix}: ${percent}%`, { id: toastId, duration: Infinity });
          },
        });

        toast.loading('Processando no servidor...', { id: toastId, duration: Infinity });
        await finalizeMediaUploadAction({
          entityType,
          entityId,
          role: 'gallery',
          altText: null,
          processed,
        });
      }

      toast.success(selected.length > 1 ? 'Arquivos publicados na galeria.' : 'Mídia publicada na galeria.', {
        id: toastId,
        duration: 4000,
      });
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Falha ao enviar.';
      toast.error(message.length > 200 ? 'Falha ao enviar. Tente novamente.' : message, {
        id: toastId,
        duration: 6000,
      });
    } finally {
      setUploading(null);
      setProgress(0);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  }

  return (
    <section
      aria-label={`Acoes de ${label}`}
      className="border-b border-ink-100 bg-paper-deep px-4 pb-3 pt-2.5 md:px-6 lg:px-8"
    >
      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
        <div className="border-b border-ink-100 px-3 py-2.5">
          <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-clay-700">
            Gerenciar comercio
          </p>
          <p className="m-0 truncate text-[13px] font-semibold text-ink-700">{label}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-2.5">
          <OwnerButton
            icon={<ImageIcon className="h-4 w-4" aria-hidden />}
            label="Postar foto"
            disabled={Boolean(uploading)}
            onClick={() => imageInputRef.current?.click()}
          />
          <OwnerButton
            icon={<VideoIcon className="h-4 w-4" aria-hidden />}
            label="Postar video"
            disabled={Boolean(uploading)}
            onClick={() => videoInputRef.current?.click()}
          />
          {postsPath ? (
            <OwnerActionLink href={postsPath} icon={<Megaphone className="h-4 w-4" aria-hidden />} label="Nova publicação" />
          ) : null}
          <OwnerActionLink href={adminPath} icon={<Pencil className="h-4 w-4" aria-hidden />} label="Editar comercio" />

          {uploading ? (
            <span
              role="status"
              aria-live="polite"
              className="col-span-2 grid min-h-11 gap-1 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {uploading === 'video' ? 'Enviando video' : 'Enviando foto'} {progress}%
              </span>
              <span className="h-1 overflow-hidden rounded-full bg-primary/15">
                <span className="block h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
              </span>
            </span>
          ) : null}
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
        multiple
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        multiple
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files, 'video')}
      />
    </section>
  );
}

function OwnerButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-clay-200 bg-paper px-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-clay-50 disabled:cursor-wait disabled:opacity-60"
    >
      {icon}
      {label}
    </button>
  );
}

function OwnerActionLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-clay-200 bg-paper px-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-clay-50"
    >
      {icon}
      {label}
    </Link>
  );
}

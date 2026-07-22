'use client';

import Image from 'next/image';
import { AlertCircle, CheckCircle2, FileImage, FileVideo, Loader2, UploadCloud, X } from 'lucide-react';
import { useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  deleteEntityPostAction,
  requestEntityPostUploadTokenAction,
  upsertEntityPostAction,
  type EntityPostUploadToken,
} from '@/lib/posts/actions';
import { uploadDirectToProcessor } from '@/lib/media/direct-upload';
import { videoPosterUrl } from '@/lib/media/video-poster';
import type { EntityPost, EntityPostType } from '@/lib/posts/types';

type Props = {
  posts: EntityPost[];
  entityType: EntityPostType;
  entityId: string;
};

type FormState = { mode: 'create' } | { mode: 'edit'; post: EntityPost } | null;

export function PostsPanel({ posts, entityType, entityId }: Props) {
  const [formState, setFormState] = useState<FormState>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{posts.length} publicação(ões)</p>
        {formState === null && (
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            type="button"
            onClick={() => setFormState({ mode: 'create' })}
          >
            Nova publicação
          </button>
        )}
      </div>

      {formState !== null && (
        <PostForm
          entityType={entityType}
          entityId={entityId}
          post={formState.mode === 'edit' ? formState.post : undefined}
          onCancel={() => setFormState(null)}
          onSuccess={() => setFormState(null)}
        />
      )}

      <div className="grid gap-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onEdit={() => setFormState({ mode: 'edit', post })}
          />
        ))}
        {posts.length === 0 && formState === null && (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
            Nenhuma publicação ainda. Clique em &quot;Nova publicação&quot; para começar.
          </p>
        )}
      </div>
    </div>
  );
}

type PostFormProps = {
  entityType: EntityPostType;
  entityId: string;
  post?: EntityPost;
  onCancel: () => void;
  onSuccess: () => void;
};

function PostForm({ entityType, entityId, post, onCancel, onSuccess }: PostFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const postId = useMemo(() => post?.id ?? crypto.randomUUID(), [post?.id]);

  const [imageUrl, setImageUrl] = useState<string | null>(post?.imageUrl ?? null);
  const [videoUrl, setVideoUrl] = useState<string | null>(post?.videoUrl ?? null);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    data.set('id', postId);
    if (imageUrl) data.set('image_url', imageUrl);
    else data.delete('image_url');
    if (videoUrl) data.set('video_url', videoUrl);
    else data.delete('video_url');
    setError('');
    startTransition(async () => {
      const result = await upsertEntityPostAction(data);
      if (result.ok) {
        onSuccess();
      } else {
        setError(result.error ?? 'Erro ao salvar.');
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-card p-5 space-y-4"
    >
      <h3 className="font-semibold">{post ? 'Editar publicação' : 'Nova publicação'}</h3>

      <input type="hidden" name="id" value={postId} />
      <input type="hidden" name="entity_type" value={entityType} />
      <input type="hidden" name="entity_id" value={entityId} />

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="post-title">Título *</label>
        <input
          id="post-title"
          name="title"
          required
          maxLength={120}
          defaultValue={post?.title}
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Ex: Promoção do dia, Horário especial…"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="post-body">Descrição</label>
        <textarea
          id="post-body"
          name="body"
          rows={3}
          maxLength={2000}
          defaultValue={post?.body ?? ''}
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          placeholder="Conte mais detalhes…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PostMediaPicker
          label="Imagem"
          accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
          parentEntityType={entityType}
          parentEntityId={entityId}
          postId={postId}
          role="cover"
          currentUrl={imageUrl}
          kind="image"
          onUploaded={(url) => setImageUrl(url)}
          onClear={() => setImageUrl(null)}
        />
        <PostMediaPicker
          label="Vídeo (opcional)"
          accept="video/mp4,video/quicktime,video/webm"
          parentEntityType={entityType}
          parentEntityId={entityId}
          postId={postId}
          role="video"
          currentUrl={videoUrl}
          kind="video"
          onUploaded={(url) => setVideoUrl(url)}
          onClear={() => setVideoUrl(null)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="post-btn-label">Texto do botão</label>
          <input
            id="post-btn-label"
            name="button_label"
            maxLength={40}
            defaultValue={post?.buttonLabel ?? ''}
            className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Ex: Ver cardápio"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="post-btn-url">URL do botão</label>
          <input
            id="post-btn-url"
            name="button_url"
            type="url"
            defaultValue={post?.buttonUrl ?? ''}
            className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="https://…"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="pinned" defaultChecked={post?.pinned} className="size-4 accent-primary" />
        Fixar no topo da lista
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending ? 'Salvando…' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

type PostMediaPickerProps = {
  label: string;
  accept: string;
  parentEntityType: EntityPostType;
  parentEntityId: string;
  postId: string;
  role: 'cover' | 'video';
  currentUrl: string | null;
  kind: 'image' | 'video';
  onUploaded: (url: string) => void;
  onClear: () => void;
};

function PostMediaPicker({
  label,
  accept,
  parentEntityType,
  parentEntityId,
  postId,
  role,
  currentUrl,
  kind,
  onUploaded,
  onClear,
}: PostMediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'finalizing' | 'error'>('idle');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError('');
    setStatus('uploading');
    setProgress(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const localPreview = createPreview(file);
    setPreviewUrl(localPreview);

    try {
      const token: EntityPostUploadToken = await requestEntityPostUploadTokenAction({
        parentEntityType,
        parentEntityId,
        postId,
        role,
      });
      const processed = await uploadDirectToProcessor({
        file,
        token,
        onProgress: ({ percent }) => setProgress(percent),
      });
      setStatus('finalizing');
      setProgress(99);
      onUploaded(processed.cdnUrl);
      setStatus('idle');
      setProgress(100);
      toast.success(role === 'video' ? 'Video enviado.' : 'Imagem enviada.');
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : 'Falha no upload.';
      const message = raw.length > 200 || /Server Components/i.test(raw)
        ? 'Falha no upload. Tente novamente — se persistir, fale com o suporte.'
        : raw;
      console.error('[upload-post]', caught);
      setStatus('error');
      setError(message);
      toast.error(message);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleFile(file);
  }

  const isUploading = status === 'uploading' || status === 'finalizing';
  const displayUrl = previewUrl ?? currentUrl;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div
        className={`relative overflow-hidden rounded-xl border bg-muted ${displayUrl ? '' : 'border-dashed'}`}
        style={{ aspectRatio: '4/3' }}
      >
        {displayUrl && kind === 'image' && (
          <Image src={displayUrl} alt="" fill unoptimized className="object-cover" sizes="320px" />
        )}
        {displayUrl && kind === 'video' && (
          <video src={displayUrl} poster={videoPosterUrl(displayUrl) ?? undefined} controls playsInline preload="metadata" className="absolute inset-0 h-full w-full bg-black object-contain" />
        )}
        {!displayUrl && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:bg-clay-50 hover:text-primary"
          >
            <UploadCloud className="h-7 w-7" aria-hidden="true" />
            <span className="text-xs">Toque para escolher</span>
            <span className="text-[10px] opacity-70">{kind === 'image' ? 'JPG · PNG · HEIC' : 'MP4 · MOV · WebM'}</span>
          </button>
        )}

        {isUploading && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 text-white">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {status === 'finalizing' ? 'Processando no servidor…' : `Enviando · ${progress}%`}
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
              <div className="h-full bg-white transition-[width] duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-x-0 bottom-0 flex items-start gap-1.5 bg-red-600/95 p-2 text-[11px] text-white">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-3">{error}</span>
          </div>
        )}

        {!isUploading && displayUrl && (
          <button
            type="button"
            onClick={() => {
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
              setStatus('idle');
              onClear();
            }}
            className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black/90"
            aria-label="Remover"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          {kind === 'image' ? <FileImage className="h-3.5 w-3.5" /> : <FileVideo className="h-3.5 w-3.5" />}
          {displayUrl ? 'Trocar arquivo' : 'Escolher arquivo'}
        </button>
        {status === 'idle' && currentUrl && progress === 100 && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Pronto
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={onChange}
      />
    </div>
  );
}

function createPreview(file: File): string | null {
  if (typeof URL === 'undefined') return null;
  try {
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

type PostCardProps = {
  post: EntityPost;
  onEdit: () => void;
};

function PostCard({ post, onEdit }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Excluir esta publicação?')) return;
    setIsDeleting(true);
    const fd = new FormData();
    fd.set('post_id', post.id);
    await deleteEntityPostAction(fd);
    setIsDeleting(false);
  }

  return (
    <article className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-start gap-3 p-3">
        {post.imageUrl && (
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={post.imageUrl} alt="" fill unoptimized className="object-cover" sizes="64px" />
          </div>
        )}
        {!post.imageUrl && post.videoUrl && (
          <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
            <FileVideo className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate font-semibold">{post.title}</h4>
            {post.pinned && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                Fixada
              </span>
            )}
          </div>
          {post.body && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{post.body}</p>}
          <div className="mt-2 flex gap-2 text-xs">
            <button type="button" onClick={onEdit} className="rounded-md border px-2 py-1 font-medium hover:bg-muted">
              Editar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md border px-2 py-1 font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              {isDeleting ? 'Excluindo…' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

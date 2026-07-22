'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { DirectMediaUpload } from '@/components/admin/media/direct-media-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createHomeBannerAction } from '@/lib/home/actions';

type Props = { blockId: string };

export function BannerForm({ blockId }: Props) {
  const router = useRouter();
  const [imageAssetId, setImageAssetId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoAssetId, setVideoAssetId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [linkType, setLinkType] = useState<'none' | 'internal' | 'external'>('internal');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTarget, setLinkTarget] = useState<'_self' | '_blank'>('_self');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = Boolean(imageAssetId) && (linkType === 'none' || linkUrl.trim());

  function reset() {
    setImageAssetId(null);
    setImageUrl(null);
    setVideoAssetId(null);
    setTitle('');
    setSubtitle('');
    setLinkType('internal');
    setLinkUrl('');
    setLinkTarget('_self');
  }

  function submit() {
    if (!imageAssetId) return;
    setError(null);
    startTransition(async () => {
      try {
        await createHomeBannerAction({
          blockId,
          imageAssetId,
          videoAssetId,
          title,
          subtitle,
          linkType,
          linkUrl,
          linkTarget,
        });
        reset();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao criar banner.');
      }
    });
  }

  return (
    <div className="mt-3 grid gap-4">
      <div>
        <Label>Imagem (obrigatoria)</Label>
        <p className="text-muted-foreground mb-2 text-xs">
          Recomendado: 1600x900 (16:9) ou 1200x1500 (4:5). Aceita JPG, PNG, WebP.
        </p>
        {imageUrl ? (
          <div className="flex items-center gap-3 rounded-xl border bg-paper p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-16 w-28 rounded-md object-cover" />
            <p className="text-sm">Imagem carregada.</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setImageAssetId(null);
                setImageUrl(null);
              }}
            >
              Trocar
            </Button>
          </div>
        ) : (
          <DirectMediaUpload
            entityType="home_block"
            entityId={blockId}
            role="ad"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onUploaded={(media) => {
              setImageAssetId(media.id);
              setImageUrl(media.url);
            }}
            ctaLabel="Subir imagem do banner"
            contextLabel="Imagem do banner da home"
          />
        )}
      </div>

      <div>
        <Label>Video (opcional)</Label>
        <p className="text-muted-foreground mb-2 text-xs">
          Curto e leve. MP4/MOV/WebM. Vai tocar uma vez (sem audio) e voltar pra imagem.
        </p>
        {videoAssetId ? (
          <div className="flex items-center gap-3 rounded-xl border bg-paper p-3">
            <p className="text-sm">Video carregado.</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setVideoAssetId(null)}
            >
              Remover
            </Button>
          </div>
        ) : (
          <DirectMediaUpload
            entityType="home_block"
            entityId={blockId}
            role="ad"
            accept="video/mp4,video/quicktime,video/webm"
            onUploaded={(media) => setVideoAssetId(media.id)}
            ctaLabel="Subir video do banner"
            contextLabel="Vídeo do banner da home"
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="banner-title">Titulo</Label>
          <Input
            id="banner-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="banner-subtitle">Subtitulo</Label>
          <Input
            id="banner-subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={200}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[140px_1fr_140px]">
        <div className="grid gap-1.5">
          <Label htmlFor="banner-link-type">Tipo de link</Label>
          <select
            id="banner-link-type"
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as 'none' | 'internal' | 'external')}
            className="border-ink-200 rounded-md border bg-white px-3 py-2 text-sm"
          >
            <option value="internal">Interno</option>
            <option value="external">Externo</option>
            <option value="none">Sem link</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="banner-link-url">URL</Label>
          <Input
            id="banner-link-url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder={linkType === 'internal' ? '/comercio/ofertas' : 'https://...'}
            disabled={linkType === 'none'}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="banner-link-target">Abrir em</Label>
          <select
            id="banner-link-target"
            value={linkTarget}
            onChange={(e) => setLinkTarget(e.target.value as '_self' | '_blank')}
            className="border-ink-200 rounded-md border bg-white px-3 py-2 text-sm"
            disabled={linkType === 'none'}
          >
            <option value="_self">Mesma aba</option>
            <option value="_blank">Nova aba</option>
          </select>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div>
        <Button type="button" onClick={submit} disabled={!canSubmit || isPending}>
          {isPending ? 'Salvando…' : 'Criar banner'}
        </Button>
      </div>
    </div>
  );
}

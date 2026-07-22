'use client';

import { Camera, ChevronLeft, ChevronRight, Loader2, Pause, Play, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { videoPosterUrl } from '@/lib/media/video-poster';

const STORY_PHOTO_DURATION_MS = 5500;

export type StoryGalleryPhoto = {
  src: string;
  attribution?: string | null;
  contentType?: string | null;
};

type StoryPhotoGalleryProps = {
  title: string;
  photos: StoryGalleryPhoto[];
  id?: string;
  /** Quando definido, cada miniatura recebe `id="{prefix}-{índice}"` e `scroll-mt` para âncoras (ex.: negócio). */
  photoAnchorPrefix?: string;
};

export function StoryPhotoGallery({
  title,
  photos,
  id,
  photoAnchorPrefix,
}: StoryPhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isStoryPlaying, setIsStoryPlaying] = useState(true);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [loadedSrcs, setLoadedSrcs] = useState<Set<string>>(() => new Set());
  const preloadedRef = useRef<Set<string>>(new Set());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const storyProgressRef = useRef(0);
  const fastForwardTimerRef = useRef<number | null>(null);
  const suppressNavigationClickRef = useRef(false);
  const activePhoto = activeIndex === null ? null : (photos[activeIndex] ?? null);
  const isActiveLoaded = activePhoto ? loadedSrcs.has(activePhoto.src) : false;

  const openGallery = useCallback((index: number) => {
    setIsStoryPlaying(true);
    storyProgressRef.current = 0;
    setStoryProgress(0);
    setActiveIndex(index);
  }, []);

  const closeGallery = useCallback(() => {
    setActiveIndex(null);
    setIsStoryPlaying(true);
    setIsFastForwarding(false);
    storyProgressRef.current = 0;
    setStoryProgress(0);
  }, []);

  const startFastForward = useCallback(() => {
    if (!activePhoto || !isVideoPhoto(activePhoto)) return;
    if (fastForwardTimerRef.current !== null) window.clearTimeout(fastForwardTimerRef.current);
    suppressNavigationClickRef.current = false;
    fastForwardTimerRef.current = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = 2;
      suppressNavigationClickRef.current = true;
      setIsFastForwarding(true);
      if (!isStoryPlaying) setIsStoryPlaying(true);
      void video.play().catch(() => setIsStoryPlaying(false));
    }, 180);
  }, [activePhoto, isStoryPlaying]);

  const stopFastForward = useCallback(() => {
    if (fastForwardTimerRef.current !== null) {
      window.clearTimeout(fastForwardTimerRef.current);
      fastForwardTimerRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.playbackRate = 1;
    setIsFastForwarding(false);
  }, []);

  const shouldSuppressNavigationClick = useCallback(() => {
    if (!suppressNavigationClickRef.current) return false;
    suppressNavigationClickRef.current = false;
    return true;
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeGallery();
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        setIsStoryPlaying((p) => !p);
      }
      if (event.key === 'ArrowLeft')
        setActiveIndex((current) => previousIndex(current, photos.length));
      if (event.key === 'ArrowRight')
        setActiveIndex((current) => nextIndex(current, photos.length));
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeIndex, photos.length, closeGallery]);

  useEffect(() => {
    if (activeIndex === null) return;
    const radius = 2;
    for (let offset = -radius; offset <= radius; offset += 1) {
      if (offset === 0) continue;
      const idx = ((activeIndex + offset) % photos.length + photos.length) % photos.length;
      const photo = photos[idx];
      if (!photo || isVideoPhoto(photo)) continue;
      if (preloadedRef.current.has(photo.src)) continue;
      preloadedRef.current.add(photo.src);
      const image = new Image();
      const src = photo.src;
      image.onload = () => {
        setLoadedSrcs((current) => {
          if (current.has(src)) return current;
          const next = new Set(current);
          next.add(src);
          return next;
        });
      };
      image.src = src;
    }
  }, [activeIndex, photos]);

  useEffect(() => {
    if (activeIndex === null) return;
    storyProgressRef.current = 0;
    startTransition(() => {
      setStoryProgress(0);
    });
  }, [activeIndex]);

  // Avisa o app nativo (RN WebView) pra entrar em modo fullscreen — esconde header laranja
  // e tab bar nativa enquanto a galeria estiver aberta. No-op fora do app.
  useEffect(() => {
    const bridge = typeof window !== 'undefined'
      ? (window as Window & { ReactNativeWebView?: { postMessage: (msg: string) => void } }).ReactNativeWebView
      : undefined;
    if (!bridge) return;
    bridge.postMessage(
      JSON.stringify({ type: 'mobile-immersive', payload: { active: activeIndex !== null } }),
    );
    return () => {
      if (activeIndex !== null) {
        bridge.postMessage(JSON.stringify({ type: 'mobile-immersive', payload: { active: false } }));
      }
    };
  }, [activeIndex]);

  useLayoutEffect(() => {
    if (activeIndex === null || !activePhoto || !isVideoPhoto(activePhoto)) return;

    const video = videoRef.current;
    if (!video) return;

    const tick = () => {
      const duration = video.duration;
      if (Number.isFinite(duration) && duration > 0) {
        const p = Math.min(1, video.currentTime / duration);
        storyProgressRef.current = p;
        setStoryProgress(p);
      }
    };

    const onEnded = () => {
      setActiveIndex((current) => nextIndex(current, photos.length));
    };

    video.addEventListener('timeupdate', tick);
    video.addEventListener('ended', onEnded);

    if (isStoryPlaying) void video.play().catch(() => setIsStoryPlaying(false));
    else video.pause();

    return () => {
      stopFastForward();
      video.removeEventListener('timeupdate', tick);
      video.removeEventListener('ended', onEnded);
    };
  }, [activeIndex, activePhoto, isStoryPlaying, photos.length, stopFastForward]);

  useEffect(() => {
    if (activeIndex === null || !activePhoto) return;
    if (isVideoPhoto(activePhoto)) return;
    if (!isStoryPlaying) return;
    if (!isActiveLoaded) return;

    const started = performance.now() - storyProgressRef.current * STORY_PHOTO_DURATION_MS;
    let frame: number;

    const loop = (now: number) => {
      const elapsed = now - started;
      const next = Math.min(1, elapsed / STORY_PHOTO_DURATION_MS);
      storyProgressRef.current = next;
      setStoryProgress(next);
      if (next >= 1) {
        setActiveIndex((current) => nextIndex(current, photos.length));
        return;
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [activeIndex, activePhoto, isActiveLoaded, isStoryPlaying, photos.length]);

  if (photos.length === 0) return null;

  return (
    <section id={id} className="border-ink-100 shadow-card scroll-mt-28 rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-clay-50 text-clay-600 ring-1 ring-clay-100"
            aria-hidden="true"
          >
            <Camera className="size-5" strokeWidth={2.1} />
          </div>
          <div className="min-w-0">
            <p className="text-clay-600 m-0 text-[11px] font-bold uppercase tracking-[0.04em]">Galeria</p>
            <h2 className="text-ink-900 m-0 font-sans text-[18px] font-extrabold tracking-[-0.01em]">Fotos</h2>
            <p className="text-ink-600 m-0 mt-0.5 truncate text-[12px] leading-snug">{title}</p>
          </div>
        </div>
        <span className="bg-paper-deep text-ink-700 shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums ring-1 ring-ink-100">
          {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <div
            key={photo.src}
            id={photoAnchorPrefix ? `${photoAnchorPrefix}-${index}` : undefined}
            className={cn(photoAnchorPrefix && 'scroll-mt-28', index >= 6 && 'hidden')}
          >
            <button
              type="button"
              className="border-ink-100 bg-paper group relative aspect-[4/3] min-h-0 w-full overflow-hidden rounded-md border text-left"
              onClick={() => openGallery(index)}
              aria-label={`Abrir foto ${index + 1} de ${title}`}
            >
              {isVideoPhoto(photo) ? (
                <>
                  <VideoThumb src={photo.src} title={title} index={index} />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/15 text-white">
                    <Play className="size-8 fill-white" aria-hidden="true" />
                  </span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.src}
                  alt={`Foto ${index + 1} de ${title}`}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              )}
              {index === 5 && photos.length > 6 ? (
                <span className="bg-ink-900/55 absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                  +{photos.length - 5}
                </span>
              ) : null}
            </button>
          </div>
        ))}
      </div>

      {activePhoto
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex min-h-0 w-full min-w-0 flex-col overflow-hidden bg-black text-white"
              role="dialog"
              aria-modal="true"
              aria-label={`Galeria de fotos de ${title}`}
            >
          <div className="relative z-20 shrink-0 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="flex gap-1">
              {photos.map((photo, index) => {
                const current = activeIndex ?? 0;
                let fill = 0;
                if (index < current) fill = 1;
                else if (index === current) fill = storyProgress;
                return (
                  <button
                    key={photo.src}
                    type="button"
                    className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/25"
                    onClick={() => {
                      storyProgressRef.current = 0;
                      setStoryProgress(0);
                      setActiveIndex(index);
                    }}
                    aria-label={`Ir para foto ${index + 1}`}
                  >
                    <span className="block h-full bg-white" style={{ width: `${fill * 100}%` }} />
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20">
                  <Camera className="size-4" strokeWidth={2.1} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="m-0 truncate text-[13px] font-extrabold leading-tight text-white">Fotos</p>
                  <p className="m-0 truncate text-[11px] font-medium leading-snug text-white/72">
                    {title}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/50 text-white"
                  onClick={() => setIsStoryPlaying((p) => !p)}
                  aria-label={isStoryPlaying ? 'Pausar' : 'Reproduzir'}
                >
                  {isStoryPlaying ? (
                    <Pause className="size-5" aria-hidden="true" fill="currentColor" />
                  ) : (
                    <Play className="size-5" aria-hidden="true" fill="currentColor" />
                  )}
                </button>
                <button
                  type="button"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/50 text-white"
                  onClick={closeGallery}
                  aria-label="Fechar galeria"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="absolute left-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white sm:flex"
            onClick={() => {
              if (shouldSuppressNavigationClick()) return;
              storyProgressRef.current = 0;
              setStoryProgress(0);
              setActiveIndex((current) => previousIndex(current, photos.length));
            }}
            aria-label="Foto anterior"
          >
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="absolute right-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white sm:flex"
            onClick={() => {
              if (shouldSuppressNavigationClick()) return;
              storyProgressRef.current = 0;
              setStoryProgress(0);
              setActiveIndex((current) => nextIndex(current, photos.length));
            }}
            aria-label="Próxima foto"
          >
            <ChevronRight className="size-6" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="absolute inset-y-28 left-0 z-10 w-1/2 sm:hidden"
            onPointerDown={startFastForward}
            onPointerUp={stopFastForward}
            onPointerCancel={stopFastForward}
            onPointerLeave={stopFastForward}
            onClick={() => {
              if (shouldSuppressNavigationClick()) return;
              storyProgressRef.current = 0;
              setStoryProgress(0);
              setActiveIndex((current) => previousIndex(current, photos.length));
            }}
            aria-label="Foto anterior"
          />
          <button
            type="button"
            className="absolute inset-y-28 right-0 z-10 w-1/2 sm:hidden"
            onPointerDown={startFastForward}
            onPointerUp={stopFastForward}
            onPointerCancel={stopFastForward}
            onPointerLeave={stopFastForward}
            onClick={() => {
              if (shouldSuppressNavigationClick()) return;
              storyProgressRef.current = 0;
              setStoryProgress(0);
              setActiveIndex((current) => nextIndex(current, photos.length));
            }}
            aria-label="Próxima foto"
          />

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-0 pb-[max(5.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-16">
            {isVideoPhoto(activePhoto) ? (
              <video
                ref={videoRef}
                src={activePhoto.src}
                poster={videoPosterUrl(activePhoto.src) ?? undefined}
                className="max-h-full max-w-full object-contain"
                playsInline
                onPointerDown={startFastForward}
                onPointerUp={stopFastForward}
                onPointerCancel={stopFastForward}
                onPointerLeave={stopFastForward}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={activePhoto.src}
                src={activePhoto.src}
                alt={`Foto ${(activeIndex ?? 0) + 1} de ${title}`}
                className={
                  isActiveLoaded
                    ? 'h-auto w-auto max-h-full max-w-full object-contain opacity-100 transition-opacity duration-150'
                    : 'h-auto w-auto max-h-full max-w-full object-contain opacity-0 transition-opacity duration-150'
                }
                decoding="async"
                fetchPriority="high"
                ref={(img) => {
                  if (!img || !activePhoto) return;
                  if (img.complete && img.naturalWidth > 0) {
                    const src = activePhoto.src;
                    setLoadedSrcs((current) => {
                      if (current.has(src)) return current;
                      const next = new Set(current);
                      next.add(src);
                      return next;
                    });
                    preloadedRef.current.add(src);
                  }
                }}
                onLoad={() => {
                  const src = activePhoto.src;
                  setLoadedSrcs((current) => {
                    if (current.has(src)) return current;
                    const next = new Set(current);
                    next.add(src);
                    return next;
                  });
                  preloadedRef.current.add(src);
                }}
              />
            )}
            {!isVideoPhoto(activePhoto) && !isActiveLoaded ? (
              <span
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                aria-live="polite"
              >
                <Loader2 className="size-8 animate-spin text-white/80" aria-hidden="true" />
                <span className="sr-only">Carregando foto…</span>
              </span>
            ) : null}
            {isFastForwarding ? (
              <span className="pointer-events-none absolute rounded-full bg-white/18 px-4 py-2 text-sm font-extrabold text-white ring-1 ring-white/25 backdrop-blur">
                2x
              </span>
            ) : null}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10">
            <p className="m-0 text-sm font-semibold">
              {(activeIndex ?? 0) + 1} de {photos.length}
            </p>
            {activePhoto.attribution ? (
              <p className="m-0 mt-1 text-xs leading-snug text-white/75">
                {activePhoto.attribution}
              </p>
            ) : null}
          </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}

function VideoThumb({ src, title, index }: { src: string; title: string; index: number }) {
  const poster = videoPosterUrl(src);
  const [posterFailed, setPosterFailed] = useState(false);

  if (poster && !posterFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={poster}
        alt={`Vídeo ${index + 1} de ${title}`}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        loading={index === 0 ? 'eager' : 'lazy'}
        onError={() => setPosterFailed(true)}
      />
    );
  }

  return (
    <video
      src={src}
      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
      muted
      playsInline
      preload="metadata"
    />
  );
}

function isVideoPhoto(photo: StoryGalleryPhoto): boolean {
  if (photo.contentType?.startsWith('video/')) return true;
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(photo.src);
}

function previousIndex(current: number | null, length: number): number {
  if (length <= 0) return 0;
  if (current === null) return 0;
  return current === 0 ? length - 1 : current - 1;
}

function nextIndex(current: number | null, length: number): number {
  if (length <= 0) return 0;
  if (current === null) return 0;
  return current === length - 1 ? 0 : current + 1;
}

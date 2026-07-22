'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import type { HomeBanner } from '@/lib/home';

type Props = {
  banner: HomeBanner;
  className?: string;
};

/**
 * Toca o video (mute, inline, autoplay quando visivel). Quando o video termina
 * ou falha, faz fade pra imagem estatica que ja estava por baixo. Apos terminar,
 * mostra um botao de play no canto pra rever. Se nao houver video, mostra
 * apenas a imagem. Imagem e sempre obrigatoria.
 */
export function BannerMedia({ banner, className = '' }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showVideo, setShowVideo] = useState(Boolean(banner.videoUrl));
  const [hasErrored, setHasErrored] = useState(false);
  const [hasEverPlayed, setHasEverPlayed] = useState(false);

  const replay = useCallback(
    (event?: React.MouseEvent) => {
      event?.preventDefault();
      event?.stopPropagation();
      const video = videoRef.current;
      if (!video) return;
      setHasErrored(false);
      setShowVideo(true);
      try {
        video.currentTime = 0;
      } catch {
        // ignora se ainda nao carregou metadados
      }
      void video.play().catch(() => {
        setHasErrored(true);
        setShowVideo(false);
      });
    },
    [],
  );

  useEffect(() => {
    if (!banner.videoUrl) return;
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasEverPlayed) {
            video.play().catch(() => {
              setHasErrored(true);
              setShowVideo(false);
            });
          } else if (!entry.isIntersecting) {
            video.pause();
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [banner.videoUrl, hasEverPlayed]);

  const hasVideo = Boolean(banner.videoUrl) && !hasErrored;
  const showReplay = hasVideo && !showVideo;

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-paper ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.imageUrl}
        alt={banner.imageAlt ?? banner.title ?? ''}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      {hasVideo && (
        <video
          ref={videoRef}
          src={banner.videoUrl ?? undefined}
          poster={banner.imageUrl}
          muted
          playsInline
          preload="metadata"
          onPlay={() => setHasEverPlayed(true)}
          onEnded={() => setShowVideo(false)}
          onError={() => {
            setHasErrored(true);
            setShowVideo(false);
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            showVideo ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {showReplay && (
        <button
          type="button"
          onClick={replay}
          aria-label="Rever video"
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <Play className="h-4 w-4 fill-current" aria-hidden="true" />
        </button>
      )}

      {(banner.title || banner.subtitle) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/65 via-black/25 to-transparent p-4 text-white">
          {banner.title && (
            <p className="m-0 text-[18px] font-extrabold leading-tight drop-shadow">
              {banner.title}
            </p>
          )}
          {banner.subtitle && (
            <p className="m-0 mt-1 text-[13px] font-semibold leading-snug text-white/90">
              {banner.subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

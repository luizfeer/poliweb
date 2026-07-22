'use client';

import { useState } from 'react';
import { Player } from '@remotion/player';
import { Download, Film, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ReelFromDocument } from '@/lib/studio/reels/ReelFromDocument';
import { REEL_FPS, REEL_HEIGHT, REEL_WIDTH, reelDurationInFrames } from '@/lib/studio/reels/reel-constants';
import { renderReelAction } from '@/lib/studio/render-actions';
import type { RamoId, Slide } from '@/lib/studio/types';

// Preview client-side (@remotion/player) + render de MP4 (Fase 2): a action chama
// o media-processor, que renderiza com @remotion/renderer e devolve a URL no R2.
export function ReelPreviewButton({
  businessId,
  slides,
  ramo,
}: {
  businessId: string;
  slides: Slide[];
  ramo: RamoId;
}) {
  const [open, setOpen] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const durationInFrames = reelDurationInFrames(slides.length);

  async function generateMp4() {
    setRendering(true);
    setVideoUrl(null);
    try {
      const res = await renderReelAction({ businessId, ramo, document: { slides } });
      if (res.ok && res.url) {
        setVideoUrl(res.url);
        toast.success('Reels renderizado. É só baixar.');
      } else {
        toast.error(res.error ?? 'Falha ao renderizar o vídeo.');
      }
    } finally {
      setRendering(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={slides.length === 0}
        onClick={() => setOpen(true)}
      >
        <Film className="size-4" /> Reels
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div className="relative" onClick={(e) => e.stopPropagation()} role="presentation">
            <button
              type="button"
              aria-label="Fechar"
              className="absolute -right-1 -top-11 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </button>
            <Player
              component={ReelFromDocument}
              inputProps={{ document: { slides }, ramo }}
              durationInFrames={durationInFrames}
              fps={REEL_FPS}
              compositionWidth={REEL_WIDTH}
              compositionHeight={REEL_HEIGHT}
              style={{
                width: 288,
                height: 512,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
              }}
              controls
              loop
              autoPlay
            />
            <div className="mt-3 flex flex-col items-center gap-2">
              <button
                type="button"
                className="btn btn-primary"
                disabled={rendering || slides.length === 0}
                onClick={generateMp4}
              >
                {rendering ? <Loader2 className="size-4 animate-spin" /> : <Film className="size-4" />}
                {rendering ? 'Renderizando…' : 'Gerar MP4'}
              </button>
              {videoUrl ? (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white underline"
                >
                  <Download className="size-4" /> Baixar vídeo
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

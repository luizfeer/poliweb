import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { SlideCanvas } from '@/lib/studio/templates';
import { formatMeta, type RamoId, type Slide } from '@/lib/studio/types';
import { REEL_HEIGHT, REEL_WIDTH, SCENE_FRAMES } from './reel-constants';

// Uma cena = um slide do Studio escalado pra cobrir o frame vertical, com um
// Ken Burns sutil (zoom lento). Reusa o SlideCanvas como visual (texto incluso).
export function ReelScene({ slide, ramo }: { slide: Slide; ramo: RamoId }) {
  const frame = useCurrentFrame();
  const fmt = formatMeta(slide.format);

  // Escala pra cobrir 1080×1920 independente do formato do slide.
  const cover = Math.max(REEL_WIDTH / fmt.w, REEL_HEIGHT / fmt.h);
  const kenBurns = interpolate(frame, [0, SCENE_FRAMES], [1, 1.08], { extrapolateRight: 'clamp' });
  const scale = cover * kenBurns;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1A1612',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: fmt.w,
          height: fmt.h,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <SlideCanvas slide={slide} ramo={ramo} />
      </div>
    </AbsoluteFill>
  );
}

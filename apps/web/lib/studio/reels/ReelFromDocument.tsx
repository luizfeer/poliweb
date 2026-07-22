import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { ReelScene } from './ReelScene';
import { SCENE_FRAMES, TRANSITION_FRAMES } from './reel-constants';
import type { ArtDocument, RamoId } from '@/lib/studio/types';
import '@/lib/studio/studio.css';

export type ReelFromDocumentProps = {
  document: ArtDocument;
  ramo: RamoId;
};

// Composição principal: transforma o documento do Studio (slides) num Reels
// vertical, com crossfade entre cenas. Fonte de verdade = o mesmo JSON da arte.
export function ReelFromDocument({ document, ramo }: ReelFromDocumentProps) {
  const slides = document.slides ?? [];

  if (slides.length === 0) {
    return <AbsoluteFill style={{ backgroundColor: '#1A1612' }} />;
  }

  const children: React.ReactNode[] = [];
  slides.forEach((slide, i) => {
    children.push(
      <TransitionSeries.Sequence key={`scene-${slide.id}`} durationInFrames={SCENE_FRAMES}>
        <ReelScene slide={slide} ramo={ramo} />
      </TransitionSeries.Sequence>,
    );
    if (i < slides.length - 1) {
      children.push(
        <TransitionSeries.Transition
          key={`trans-${slide.id}`}
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />,
      );
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1612' }}>
      <TransitionSeries>{children}</TransitionSeries>
    </AbsoluteFill>
  );
}

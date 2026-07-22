// Entry do bundle Remotion (registerRoot). NÃO é importado pelo Next — o
// media-processor aponta o @remotion/bundler para este arquivo na hora de
// renderizar o MP4 (ver apps/media-processor/src/processors/reel.ts).
import { Composition, registerRoot } from 'remotion';
import { ReelFromDocument } from './ReelFromDocument';
import { REEL_FPS, REEL_HEIGHT, REEL_WIDTH, SCENE_FRAMES, reelDurationInFrames } from './reel-constants';
import { buildSlides } from '@/lib/studio/types';

function RemotionRoot() {
  return (
    <Composition
      id="reel"
      component={ReelFromDocument}
      durationInFrames={SCENE_FRAMES}
      fps={REEL_FPS}
      width={REEL_WIDTH}
      height={REEL_HEIGHT}
      defaultProps={{
        document: { slides: buildSlides('restaurante', 'story') },
        ramo: 'restaurante' as const,
      }}
      calculateMetadata={({ props }) => ({
        durationInFrames: reelDurationInFrames(props.document.slides?.length ?? 1),
      })}
    />
  );
}

registerRoot(RemotionRoot);

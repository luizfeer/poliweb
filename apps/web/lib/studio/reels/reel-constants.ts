// Parâmetros do Reels gerado a partir do documento do Studio.
// Vertical 1080×1920 @ 30fps — cada slide vira uma cena com Ken Burns + crossfade.

export const REEL_FPS = 30;
export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;

export const SCENE_FRAMES = 90; // ~3s por slide
export const TRANSITION_FRAMES = 15; // ~0.5s de crossfade (sobrepõe as cenas)

/**
 * Duração total. No TransitionSeries as transições se sobrepõem às cenas, então
 * o total é a soma das cenas menos a soma das transições.
 */
export function reelDurationInFrames(slideCount: number): number {
  if (slideCount <= 0) return SCENE_FRAMES;
  return slideCount * SCENE_FRAMES - Math.max(0, slideCount - 1) * TRANSITION_FRAMES;
}

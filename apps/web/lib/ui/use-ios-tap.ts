import { useCallback, useRef, type PointerEvent, type TouchEvent } from 'react';

/**
 * iOS Safari / WKWebView ignora click em position:fixed com frequência.
 * Dispara no toque com debounce curto; click fica como fallback no desktop.
 */
export function useIosTap(action: () => void) {
  const lastFire = useRef(0);
  const actionRef = useRef(action);
  actionRef.current = action;

  const fire = useCallback((event?: { preventDefault?: () => void; stopPropagation?: () => void }) => {
    const now = Date.now();
    if (now - lastFire.current < 350) return;
    lastFire.current = now;
    event?.stopPropagation?.();
    event?.preventDefault?.();
    actionRef.current();
  }, []);

  const onClick = useCallback(() => {
    fire();
  }, [fire]);

  const onTouchStart = useCallback(
    (event: TouchEvent) => {
      fire(event);
    },
    [fire],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      fire(event);
    },
    [fire],
  );

  return { onClick, onTouchStart, onPointerUp };
}

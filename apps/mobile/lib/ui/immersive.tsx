import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type ImmersiveContextValue = {
  immersive: boolean;
  acquire: (token: string) => void;
  release: (token: string) => void;
};

const ImmersiveContext = createContext<ImmersiveContextValue>({
  immersive: false,
  acquire: () => undefined,
  release: () => undefined,
});

/**
 * Coordena modo imersivo (ex.: galeria de fotos em fullscreen dentro de um webview).
 * Múltiplos consumidores podem segurar o "lock" via token — bar só volta a aparecer
 * quando todos liberarem.
 */
export function ImmersiveProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<Set<string>>(() => new Set());

  const acquire = useCallback((token: string) => {
    setTokens((current) => {
      if (current.has(token)) return current;
      const next = new Set(current);
      next.add(token);
      return next;
    });
  }, []);

  const release = useCallback((token: string) => {
    setTokens((current) => {
      if (!current.has(token)) return current;
      const next = new Set(current);
      next.delete(token);
      return next;
    });
  }, []);

  const value = useMemo<ImmersiveContextValue>(
    () => ({ immersive: tokens.size > 0, acquire, release }),
    [tokens, acquire, release],
  );

  return <ImmersiveContext.Provider value={value}>{children}</ImmersiveContext.Provider>;
}

export function useImmersiveState(): boolean {
  return useContext(ImmersiveContext).immersive;
}

/**
 * Hook controlado por um token estável (gerado por instância). Garante release no unmount.
 */
export function useImmersiveLock(): (active: boolean) => void {
  const { acquire, release } = useContext(ImmersiveContext);
  const tokenRef = useRef<string>(`imm-${Math.random().toString(36).slice(2)}-${Date.now()}`);
  const heldRef = useRef(false);

  useEffect(() => {
    const token = tokenRef.current;
    return () => {
      if (heldRef.current) release(token);
    };
  }, [release]);

  return useCallback(
    (active: boolean) => {
      const token = tokenRef.current;
      if (active && !heldRef.current) {
        heldRef.current = true;
        acquire(token);
      } else if (!active && heldRef.current) {
        heldRef.current = false;
        release(token);
      }
    },
    [acquire, release],
  );
}

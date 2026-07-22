import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carrega `expo-speech-recognition` de forma defensiva — o módulo nativo só
 * existe depois de prebuild + rebuild do dev client. Sem ele, a feature fica
 * indisponível mas o app continua rodando.
 */
type SpeechModule = {
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
};

type SpeechHook = (
  event: 'start' | 'end' | 'result' | 'error',
  listener: (e: any) => void,
) => void;

let speechModule: SpeechModule | null = null;
let useSpeechRecognitionEvent: SpeechHook = () => undefined;
let nativeAvailable = false;

try {
  const lib = require('expo-speech-recognition');
  if (lib?.ExpoSpeechRecognitionModule && lib?.useSpeechRecognitionEvent) {
    // Tenta tocar no módulo nativo — se faltar, lança e cai no catch.
    void lib.ExpoSpeechRecognitionModule.getStateAsync?.();
    speechModule = lib.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = lib.useSpeechRecognitionEvent;
    nativeAvailable = true;
  }
} catch {
  nativeAvailable = false;
}

/** Tempo de silêncio (sem novos resultados parciais) que dispara envio automático. */
const PAUSE_MS = 1800;

type Options = {
  onAutoSend: (text: string) => void;
  onPartial?: (text: string) => void;
};

export function useDictation({ onAutoSend, onPartial }: Options) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTextRef = useRef('');
  const onAutoSendRef = useRef(onAutoSend);
  const onPartialRef = useRef(onPartial);

  useEffect(() => {
    onAutoSendRef.current = onAutoSend;
  }, [onAutoSend]);
  useEffect(() => {
    onPartialRef.current = onPartial;
  }, [onPartial]);

  const clearPauseTimer = useCallback(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, []);

  const armPauseTimer = useCallback(() => {
    clearPauseTimer();
    pauseTimerRef.current = setTimeout(() => {
      const text = latestTextRef.current.trim();
      try {
        speechModule?.stop();
      } catch {
        // noop
      }
      if (text.length >= 2) {
        onAutoSendRef.current(text);
      }
    }, PAUSE_MS);
  }, [clearPauseTimer]);

  useSpeechRecognitionEvent('start', () => {
    setListening(true);
    setError(null);
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    clearPauseTimer();
  });

  useSpeechRecognitionEvent('result', (event: { results?: Array<{ transcript?: string }> }) => {
    const text = event?.results?.[0]?.transcript ?? '';
    if (!text) return;
    latestTextRef.current = text;
    onPartialRef.current?.(text);
    armPauseTimer();
  });

  useSpeechRecognitionEvent('error', (event: { error?: string; message?: string }) => {
    setError(event?.message ?? event?.error ?? 'Erro no ditado');
    setListening(false);
    clearPauseTimer();
  });

  useEffect(() => {
    return () => {
      clearPauseTimer();
      try {
        speechModule?.stop();
      } catch {
        // noop
      }
    };
  }, [clearPauseTimer]);

  const start = useCallback(async () => {
    if (!speechModule) {
      setError('Ditado indisponível — rebuild do app necessário.');
      return;
    }
    try {
      const perm = await speechModule.requestPermissionsAsync();
      if (!perm.granted) {
        setError('Sem permissão de microfone');
        return;
      }
      latestTextRef.current = '';
      speechModule.start({
        lang: 'pt-BR',
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao iniciar ditado');
    }
  }, []);

  const stop = useCallback(() => {
    clearPauseTimer();
    try {
      speechModule?.stop();
    } catch {
      // noop
    }
  }, [clearPauseTimer]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else void start();
  }, [listening, start, stop]);

  return { listening, error, toggle, start, stop, available: nativeAvailable };
}

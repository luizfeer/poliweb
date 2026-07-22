import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useEffect } from 'react';

const LAUNCH_ALERT_SOURCE = require('../../assets/sounds/launch-alert.wav');

let playedThisSession = false;

/**
 * Toca um alerta curto na splash (cold start). Roda uma vez por sessão do app.
 */
export function LaunchAlertSound() {
  useEffect(() => {
    if (playedThisSession) return;
    playedThisSession = true;

    let player: ReturnType<typeof createAudioPlayer> | null = null;
    let cancelled = false;

    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: false,
          shouldPlayInBackground: false,
          interruptionMode: 'mixWithOthers',
        });
        if (cancelled) return;

        player = createAudioPlayer(LAUNCH_ALERT_SOURCE);
        player.volume = 0.85;
        player.play();
      } catch {
        // Som é best-effort — não bloqueia boot se falhar (ex.: simulador sem áudio).
      }
    })();

    return () => {
      cancelled = true;
      player?.release();
    };
  }, []);

  return null;
}

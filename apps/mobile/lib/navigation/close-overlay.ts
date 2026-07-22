import { router } from 'expo-router';

type CloseAnchor = '/(tabs)/index';

/**
 * Fecha modal / overlay sem disparar GO_BACK quando não há histórico.
 * `dismissTo` fecha o modal de auth e volta às tabs (evita loop no perfil sem sessão).
 */
export function closeOverlay(anchor: CloseAnchor = '/(tabs)/index') {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.dismissTo(anchor);
}

/**
 * Copiar texto — usa expo-clipboard (funciona no Expo Go).
 * Não usar @react-native-clipboard/clipboard (exige dev build com módulo nativo).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    const Clipboard = await import('expo-clipboard');
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

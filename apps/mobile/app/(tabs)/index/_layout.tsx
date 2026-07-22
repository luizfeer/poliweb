import { Stack } from 'expo-router';

/** Empilha WebView e turismo sem esconder a tab bar nativa. */
export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="webview/[path]" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
      <Stack.Screen name="turismo/onde-ficar" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="comercio/[slug]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="comercio/[slug]/cardapio" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

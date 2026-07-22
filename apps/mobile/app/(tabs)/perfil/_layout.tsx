import { Stack } from 'expo-router';

export default function PerfilStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="webview/[path]" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
      <Stack.Screen name="notificacoes" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

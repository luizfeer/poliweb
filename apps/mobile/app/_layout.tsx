import 'react-native-reanimated';

import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UploadDock } from '@/components/uploads/UploadDock';
import { AuthProvider, useAuth } from '@/lib/auth/AuthProvider';
import { LaunchAlertSound } from '@/lib/boot/LaunchAlertSound';
import { hasSeenOnboarding, isGuestMode } from '@/lib/onboarding/state';
import { PushNotificationsProvider } from '@/lib/push/PushNotificationsProvider';
import { loadRemoteConfig } from '@/lib/remote-config';
import { palette } from '@/lib/theme/tokens';
import { ImmersiveProvider } from '@/lib/ui/immersive';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SystemUI.setBackgroundColorAsync(palette.paper).catch(() => undefined);
loadRemoteConfig().catch(() => undefined);

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootGate() {
  const router = useRouter();
  const segments = useSegments();
  const { loading, session } = useAuth();
  const firstRunHandled = useRef(false);

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync().catch(() => undefined);

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/(tabs)/index');
      return;
    }

    if (session || firstRunHandled.current) return;
    firstRunHandled.current = true;

    (async () => {
      const [seen, guest] = await Promise.all([hasSeenOnboarding(), isGuestMode()]);
      if (guest) return;
      if (!seen) {
        router.push('/onboarding');
      } else {
        router.push('/(auth)/entrar');
      }
    })();
  }, [loading, session, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.paper },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="(auth)"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="assistente"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="inbox/[featureId]"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="buscar-nativo"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.paper }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PushNotificationsProvider>
            <ImmersiveProvider>
              <LaunchAlertSound />
              <StatusBar style="dark" />
              <RootGate />
              <UploadDock />
            </ImmersiveProvider>
          </PushNotificationsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

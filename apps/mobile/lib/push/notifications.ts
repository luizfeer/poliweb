import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type PushRegistration =
  | { ok: true; token: string }
  | { ok: false; reason: 'permission_denied' | 'not_a_device' | 'no_project_id' | 'error'; message?: string };

export async function registerForPush(): Promise<PushRegistration> {
  if (!Device.isDevice) return { ok: false, reason: 'not_a_device' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Padrão',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0F766E',
    });
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alertas da cidade',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true, provideAppNotificationSettings: true },
    });
    status = req.status;
  }
  if (status !== 'granted') return { ok: false, reason: 'permission_denied' };

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return { ok: false, reason: 'no_project_id' };

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    return { ok: true, token: tokenResponse.data };
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : 'falha' };
  }
}

export type SyncResult = { ok: true } | { ok: false; reason: string; status?: number };

export async function syncPushTokenWithBackend(
  token: string,
  accessTokenOverride?: string | null,
): Promise<SyncResult> {
  let accessToken = accessTokenOverride ?? null;
  if (!accessToken) {
    const { data } = await supabase.auth.getSession();
    accessToken = data.session?.access_token ?? null;
  }
  if (!accessToken) return { ok: false, reason: 'no_session' };

  try {
    const res = await fetch(`${env.webBaseUrl}/api/mobile/push/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version ?? null,
        deviceName: Device.deviceName ?? null,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, reason: body.slice(0, 200) || 'http_error', status: res.status };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'fetch_failed' };
  }
}

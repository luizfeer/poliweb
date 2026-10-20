import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { notificationUrl } from "./navigationPolicy";
import { captureNativeError } from "./sentry";
import {
  type NativePushPayload,
  type PushPermission,
} from "./pushBridge";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

let askedForPermission = false;
let lastExpoPushToken: string | null = null;

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

function asToken(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function platform(): "ios" | "android" {
  return Platform.OS === "ios" ? "ios" : "android";
}

async function readPermission(): Promise<PushPermission> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted" || current.status === "denied") {
    return current.status;
  }
  return "undetermined";
}

async function readExpoPushToken(): Promise<string | null> {
  const id = projectId();
  if (!id) return null;
  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId: id });
    lastExpoPushToken = asToken(token.data);
    return lastExpoPushToken;
  } catch (error) {
    captureNativeError(error, "push.expo-token");
    return null;
  }
}

async function readDevicePushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return asToken(token.data);
  } catch (error) {
    captureNativeError(error, "push.device-token");
    return null;
  }
}

/**
 * Pede permissão só na primeira vez em que o sistema ainda não decidiu,
 * depois que o site já está na tela. Se já foi concedida, só lê os tokens.
 */
export async function collectNativePushToken(options: {
  requestPermission: boolean;
}): Promise<NativePushPayload | null> {
  try {
    return await collectPushToken(options);
  } catch (error) {
    captureNativeError(error, "push.registration");
    return null;
  }
}

async function collectPushToken(options: {
  requestPermission: boolean;
}): Promise<NativePushPayload | null> {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Poliweb",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  let permission = await readPermission();
  if (
    permission === "undetermined" &&
    options.requestPermission &&
    !askedForPermission
  ) {
    askedForPermission = true;
    const next = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    permission =
      next.status === "granted" || next.status === "denied"
        ? next.status
        : "undetermined";
  }

  if (permission !== "granted") {
    return {
      type: "poliweb-native-push",
      permission,
      expoPushToken: null,
      devicePushToken: null,
      platform: platform(),
    };
  }

  const [expoPushToken, devicePushToken] = await Promise.all([
    readExpoPushToken(),
    readDevicePushToken(),
  ]);

  return {
    type: "poliweb-native-push",
    permission,
    expoPushToken,
    devicePushToken,
    platform: platform(),
  };
}

export function listenForPushTokenChanges(
  onToken: (payload: NativePushPayload) => void,
): { remove: () => void } {
  if (Platform.OS === "web") return { remove() {} };
  const subscription = Notifications.addPushTokenListener((device) => {
    onToken({
      type: "poliweb-native-push",
      permission: "granted",
      expoPushToken: lastExpoPushToken,
      devicePushToken: asToken(device.data),
      platform: platform(),
    });
  });
  return subscription;
}

export function listenForNotificationOpens(
  onUrl: (url: string) => void,
): { remove: () => void } {
  if (Platform.OS === "web") return { remove() {} };
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const url = notificationUrl(
        response.notification.request.content.data as
          | Record<string, unknown>
          | undefined,
      );
      if (url) onUrl(url);
    },
  );
  return subscription;
}

export async function lastNotificationUrl(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) return null;
    return notificationUrl(
      response.notification.request.content.data as
        | Record<string, unknown>
        | undefined,
    );
  } catch {
    return null;
  }
}

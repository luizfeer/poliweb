'use client';

// Helpers de Web Push pro browser.
// VAPID_PUBLIC_KEY precisa ser exposta como NEXT_PUBLIC_VAPID_PUBLIC_KEY.

export function isWebPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getOrRegisterSW(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/sw.js');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null;
  const reg = await getOrRegisterSW();
  return reg.pushManager.getSubscription();
}

export async function subscribeWebPush(vapidPublicKey: string): Promise<PushSubscription> {
  if (!isWebPushSupported()) throw new Error('Web Push não suportado neste navegador.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Permissão negada.');

  const reg = await getOrRegisterSW();
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  });
}

export async function unsubscribeWebPush(): Promise<boolean> {
  const sub = await getCurrentSubscription();
  if (!sub) return true;
  return sub.unsubscribe();
}

export function subscriptionToPayload(sub: PushSubscription): {
  endpoint: string;
  p256dh: string;
  auth: string;
} {
  const json = sub.toJSON();
  const keys = json.keys ?? {};
  return {
    endpoint: sub.endpoint,
    p256dh: keys.p256dh ?? '',
    auth: keys.auth ?? '',
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

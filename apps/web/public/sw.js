// Service Worker pra Web Push (Portal Carmelitano).
// Atualizar a versão pra forçar refresh do SW nos clientes.
const SW_VERSION = 'v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Portal Carmelitano', body: event.data.text() };
  }
  const title = payload.title || 'Portal Carmelitano';
  const options = {
    body: payload.body || '',
    icon: '/logo-mark.svg',
    badge: '/logo-mark.svg',
    data: { url: payload.url || '/', ...(payload.data || {}) },
    tag: payload.data?.notification_id || undefined,
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const c of clientsArr) {
        if (c.url.includes(url) && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return null;
    }),
  );
});

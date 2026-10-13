/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.conf > pwa > workboxPluginMode is set to "InjectManifest"
 */

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'

self.skipWaiting()
clientsClaim()

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Use with precache injection
precacheAndRoute(self.__WB_MANIFEST)

function readPushPayload(event) {
  if (!event.data) return {}
  try {
    const json = event.data.json()
    if (json && typeof json === 'object') return json
  } catch (error) {
    // corpo em texto segue abaixo
  }
  try {
    return { body: event.data.text() }
  } catch (error) {
    return {}
  }
}

self.addEventListener('push', (event) => {
  const data = readPushPayload(event)
  const title = data.title || 'Poliweb'
  const path = typeof data.path === 'string' && data.path.startsWith('/') ? data.path : '/'
  const options = {
    body: data.body || data.text || '',
    lang: 'pt-BR',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-128x128.png',
    data: { path }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = event.notification.data && event.notification.data.path
  const target = new URL(typeof path === 'string' && path.startsWith('/') ? path : '/', self.location.origin).href

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (typeof client.navigate === 'function') {
        try {
          await client.navigate(target)
        } catch (error) {
          // segue para abrir uma janela nova
        }
      }
      if (typeof client.focus === 'function') return client.focus()
    }
    if (self.clients.openWindow) return self.clients.openWindow(target)
    return undefined
  })())
})

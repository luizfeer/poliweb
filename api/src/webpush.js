import webpush from 'web-push'

import { chunk, PUSH_BATCH_SIZE } from './segment.js'

export function createWebPush(config) {
  return {
    configured: Boolean(config.vapidPublicKey && config.vapidPrivateKey),
    publicKey: config.vapidPublicKey || '',
    async sendNotification(subscription, payload) {
      webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey)
      return webpush.sendNotification(subscription, payload, { TTL: 60 * 60 * 24 })
    }
  }
}

export async function sendWebPushMessages({ devices, payload, client }) {
  const results = []
  const batches = chunk(devices, PUSH_BATCH_SIZE)

  for (const batch of batches) {
    const settled = await Promise.all(batch.map(async (device) => {
      if (!client?.configured && !client?.sendNotification) {
        return { token: device.token, status: 'failed', error: 'VAPID não configurado.' }
      }
      if (client.configured === false) {
        return { token: device.token, status: 'failed', error: 'VAPID não configurado.' }
      }
      try {
        await client.sendNotification(device.subscription, payload)
        return { token: device.token, status: 'sent' }
      } catch (error) {
        const statusCode = Number(error.statusCode || error.status || 0)
        if (statusCode === 404 || statusCode === 410) {
          return { token: device.token, status: 'invalidated', error: `HTTP ${statusCode}` }
        }
        return { token: device.token, status: 'failed', error: error.message || 'Falha no Web Push' }
      }
    }))
    results.push(...settled)
  }

  return { results, batchCount: batches.length }
}

import { PGlite } from '@electric-sql/pglite'
import webpush from 'web-push'

import { signHs256 } from '../src/auth.js'
import { buildApp } from '../src/app.js'
import { createPgliteDb } from '../src/db.js'
import { migrate } from '../src/migrate.js'

export const JWT_SECRET = 'test-secret'
export const ADMIN_SECRET = 'test-admin-secret'

export function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data
  }
}

export function defaultExpoFetch() {
  return async (url, options) => {
    const body = JSON.parse(options.body)
    if (String(url).includes('getReceipts')) return jsonResponse({ data: {} })
    const messages = Array.isArray(body) ? body : []
    return jsonResponse({
      data: messages.map((message, index) => ({
        status: 'ok',
        id: `ticket-${index}-${message.to}`
      }))
    })
  }
}

export async function createTestApp(overrides = {}) {
  const pglite = new PGlite()
  const db = createPgliteDb(pglite)
  await migrate(db)
  const keys = webpush.generateVAPIDKeys()
  const calls = []
  const expoFetch = overrides.expoFetch || (async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) })
    return defaultExpoFetch()(url, options)
  })
  expoFetch.calls = calls

  const app = await buildApp({
    db,
    logger: false,
    expoFetch,
    authFetch: overrides.authFetch || (async () => jsonResponse({ message: 'Não autorizado.' }, 401)),
    webPush: overrides.webPush || {
      configured: true,
      publicKey: keys.publicKey,
      async sendNotification() {}
    },
    config: {
      jwtSecret: JWT_SECRET,
      adminSecret: ADMIN_SECRET,
      upstreamApi: 'https://api.test',
      publicSiteUrl: 'https://www.poliwebapp.com.br',
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
      vapidSubject: 'mailto:push@poliwebapp.com.br',
      expoAccessToken: '',
      corsOrigins: ['http://localhost:3050'],
      maxDevices: 20000,
      ...overrides.config
    }
  })

  return { app, db, pglite, keys, expoFetch }
}

export function adminToken(extra = {}) {
  return signHs256({ id: 1, role: 'admin', email: 'admin@poliwebapp.com.br', exp: 9999999999, ...extra }, JWT_SECRET)
}

export function customerToken(extra = {}) {
  return signHs256({ id: 6368, role: 'customer', exp: 9999999999, ...extra }, JWT_SECRET)
}

export async function resetTables(db) {
  await db.exec('TRUNCATE push_devices, push_campaigns')
}

import cors from '@fastify/cors'
import Fastify from 'fastify'

import { requireAdmin, resolveSession } from './auth.js'
import { audienceFromBody, collectDevices, upsertDevices } from './devices.js'
import { estimateSegment, listCampaigns, sendCampaign } from './dispatch.js'
import { httpError } from './errors.js'
import { normalizeFilters, normalizeMessage } from './segment.js'
import { createWebPush } from './webpush.js'

export async function buildApp(options) {
  const config = options.config
  const app = Fastify({
    logger: options.logger ?? false,
    trustProxy: true
  })

  app.decorate('ctx', {
    db: options.db,
    config,
    expoFetch: options.expoFetch || globalThis.fetch,
    authFetch: options.authFetch || globalThis.fetch,
    webPush: options.webPush || createWebPush(config)
  })

  await app.register(cors, {
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['authorization', 'content-type'],
    origin(origin, callback) {
      if (!origin || !config.corsOrigins.length || config.corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(null, false)
    }
  })

  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500
    if (statusCode >= 500) request.log.error(error)
    const message = statusCode >= 500 && !error.expose
      ? 'Erro interno.'
      : error.message
    reply.code(statusCode).send({ message, statusCode })
  })

  app.get('/push/health', async () => ({ ok: true }))

  app.get('/push/vapid-public-key', async (request) => {
    const publicKey = request.server.ctx.webPush.publicKey || request.server.ctx.config.vapidPublicKey
    if (!publicKey) throw httpError(503, 'VAPID não configurado.')
    return { publicKey }
  })

  app.post('/push/devices', async (request) => {
    const ctx = request.server.ctx
    const session = await resolveSession(request.headers.authorization, {
      ...ctx.config,
      authFetch: ctx.authFetch,
      probeAdmin: false
    })
    const devices = collectDevices(request.body || {})
    if (!devices.length) {
      return { registered: 0, linkedUser: false, identity: session.kind, devices: [] }
    }
    const audience = audienceFromBody(request.body || {}, session)
    const saved = await upsertDevices(ctx.db, devices, audience)
    return {
      registered: saved.length,
      linkedUser: audience.linkedUser,
      identity: audience.linkedUser ? audience.role : 'anonymous',
      devices: saved
    }
  })

  await app.register(async function adminRoutes(adminApp) {
    adminApp.addHook('preHandler', async (request) => {
      const ctx = request.server.ctx
      request.session = await requireAdmin(request.headers.authorization, {
        ...ctx.config,
        authFetch: ctx.authFetch
      })
    })

    adminApp.post('/push/notifications/estimate', async (request) => {
      const filters = normalizeFilters(request.body || {})
      const estimate = await estimateSegment(request.server.ctx.db, filters)
      return { ...estimate, filters }
    })

    adminApp.post('/push/notifications', async (request) => {
      const ctx = request.server.ctx
      const message = normalizeMessage(request.body || {})
      return sendCampaign({
        db: ctx.db,
        message,
        session: request.session,
        expoFetch: ctx.expoFetch,
        webPush: ctx.webPush,
        config: ctx.config
      })
    })

    adminApp.get('/push/notifications', async (request) => {
      const requested = Number(request.query?.limit || 30)
      const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 100) : 30
      const campaigns = await listCampaigns(request.server.ctx.db, limit)
      return { campaigns }
    })
  })

  return app
}

import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, test } from 'node:test'

import { PUSH_BATCH_SIZE } from '../src/segment.js'
import { adminToken, createTestApp, customerToken, jsonResponse, resetTables } from './helpers.js'

async function register(app, payload, token) {
  const response = await app.inject({
    method: 'POST',
    url: '/push/devices',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    payload
  })
  assert.equal(response.statusCode, 200, response.body)
  return response.json()
}

describe('segmentação e disparo', { concurrency: false }, () => {
  let ctx

  before(async () => {
    ctx = await createTestApp()
  })

  after(async () => {
    await ctx.app.close()
    await ctx.pglite.close()
  })

  beforeEach(async () => {
    await resetTables(ctx.db)
    ctx.expoFetch.calls.length = 0
  })

  test('estima por cidade, papel, categoria, usuário ou todos', async () => {
    await register(ctx.app, {
      expoPushToken: 'ExponentPushToken[user-a]',
      platform: 'ios',
      cityId: '402',
      categories: [10, 11]
    })
    await register(ctx.app, {
      expoPushToken: 'ExponentPushToken[user-b]',
      platform: 'ios',
      cityId: '510',
      categories: [10]
    })
    await register(ctx.app, {
      devices: [{
        token: JSON.stringify({
          endpoint: 'https://push.example/owner',
          keys: { p256dh: 'p256', auth: 'auth' }
        }),
        tokenType: 'webpush',
        platform: 'android'
      }],
      cityId: '402',
      role: 'owner',
      userId: '999',
      categories: [11]
    }, customerToken())
    await register(ctx.app, {
      devicePushToken: 'apns-only-device-token',
      platform: 'ios',
      cityId: '402'
    })

    const estimate = async (payload) => {
      const response = await ctx.app.inject({
        method: 'POST',
        url: '/push/notifications/estimate',
        headers: { authorization: `Bearer ${adminToken()}` },
        payload
      })
      assert.equal(response.statusCode, 200, response.body)
      return response.json()
    }

    const everyone = await estimate({ all: true })
    assert.equal(everyone.count, 3)
    assert.equal(everyone.byType.expo, 2)
    assert.equal(everyone.byType.webpush, 1)

    const city = await estimate({ cities: ['402'] })
    assert.equal(city.count, 2)

    const owners = await estimate({ role: 'owner', categories: [11] })
    assert.equal(owners.count, 1)
    assert.equal(owners.byType.webpush, 1)

    const category = await estimate({ categories: ['10'] })
    assert.equal(category.count, 2)

    const oneUser = await estimate({ userId: '6368' })
    assert.equal(oneUser.count, 1)

    const none = await estimate({ cities: ['999'] })
    assert.equal(none.count, 0)
  })

  test('envia em lotes de 100 e invalida DeviceNotRegistered no ticket e no recibo', async () => {
    assert.equal(PUSH_BATCH_SIZE, 100)
    const total = 250
    for (let index = 0; index < total; index += 1) {
      await register(ctx.app, {
        expoPushToken: `ExponentPushToken[n${index}]`,
        platform: 'ios',
        cityId: '402'
      })
    }
    await register(ctx.app, {
      devices: [{
        token: JSON.stringify({
          endpoint: 'https://push.example/gone',
          keys: { p256dh: 'p256', auth: 'auth' }
        }),
        tokenType: 'webpush',
        platform: 'web'
      }],
      cityId: '402'
    })

    ctx.expoFetch.calls.length = 0
    const originalExpo = ctx.app.ctx.expoFetch
    const originalWeb = ctx.app.ctx.webPush
    const seenBatches = []
    ctx.app.ctx.expoFetch = async (url, options) => {
      const body = JSON.parse(options.body)
      seenBatches.push({ url: String(url), size: Array.isArray(body) ? body.length : body.ids?.length || 0, body })
      if (String(url).includes('getReceipts')) {
        const id = body.ids.find((item) => String(item).includes('ExponentPushToken[n1]'))
        return jsonResponse({
          data: id
            ? { [id]: { status: 'error', message: 'DeviceNotRegistered', details: { error: 'DeviceNotRegistered' } } }
            : {}
        })
      }
      return jsonResponse({
        data: body.map((message) => (
          message.to === 'ExponentPushToken[n0]'
            ? { status: 'error', message: 'Not registered', details: { error: 'DeviceNotRegistered' } }
            : { status: 'ok', id: `ticket-${message.to}` }
        ))
      })
    }

    const webCalls = []
    ctx.app.ctx.webPush = {
      configured: true,
      publicKey: ctx.keys.publicKey,
      async sendNotification(subscription) {
        webCalls.push(subscription.endpoint)
        if (subscription.endpoint.includes('gone')) {
          const error = new Error('gone')
          error.statusCode = 410
          throw error
        }
      }
    }

    let response
    try {
      response = await ctx.app.inject({
        method: 'POST',
        url: '/push/notifications',
        headers: { authorization: `Bearer ${adminToken()}` },
        payload: {
          title: 'Feira de sábado',
          body: 'A feira mudou para a praça.',
          path: '/buscar',
          cities: ['402']
        }
      })
    } finally {
      ctx.app.ctx.expoFetch = originalExpo
      ctx.app.ctx.webPush = originalWeb
    }

    assert.equal(response.statusCode, 200, response.body)
    const campaign = response.json()
    assert.equal(campaign.targetedCount, 251)
    assert.equal(campaign.invalidatedCount, 3)
    assert.equal(campaign.sentCount, 248)
    assert.equal(campaign.failedCount, 0)
    assert.equal(campaign.path, '/buscar')
    assert.equal(campaign.status, 'sent')

    const sendBatches = seenBatches.filter((call) => call.url.includes('/push/send'))
    assert.deepEqual(sendBatches.map((call) => call.size), [100, 100, 50])
    const receiptBatches = seenBatches.filter((call) => call.url.includes('getReceipts'))
    assert.equal(receiptBatches.length, 3)
    assert.equal(webCalls.length, 1)
    assert.equal(sendBatches[0].body[0].data.path, '/buscar')
    assert.equal(sendBatches[0].body[0].data.url, 'https://www.poliwebapp.com.br/buscar')

    const left = await ctx.db.query(
      `SELECT COUNT(*)::int AS total FROM push_devices WHERE invalidated_at IS NULL AND token_type IN ('expo', 'webpush')`
    )
    assert.equal(Number(left.rows[0].total), 248)

    const history = await ctx.app.inject({
      method: 'GET',
      url: '/push/notifications',
      headers: { authorization: `Bearer ${adminToken()}` }
    })
    assert.equal(history.statusCode, 200)
    assert.equal(history.json().campaigns[0].id, campaign.id)
    assert.equal(history.json().campaigns[0].sentCount, 248)
  })

  test('recusa link absoluto e segmento acima do limite', async () => {
    await register(ctx.app, {
      expoPushToken: 'ExponentPushToken[one]',
      platform: 'ios',
      cityId: '1'
    })
    await register(ctx.app, {
      expoPushToken: 'ExponentPushToken[two]',
      platform: 'ios',
      cityId: '1'
    })

    const badLink = await ctx.app.inject({
      method: 'POST',
      url: '/push/notifications',
      headers: { authorization: `Bearer ${adminToken()}` },
      payload: { title: 'Oi', body: 'Texto', path: 'https://evil.example' }
    })
    assert.equal(badLink.statusCode, 400)

    ctx.app.ctx.config.maxDevices = 1
    const limited = await ctx.app.inject({
      method: 'POST',
      url: '/push/notifications',
      headers: { authorization: `Bearer ${adminToken()}` },
      payload: { title: 'Oi', body: 'Texto', path: '/buscar', all: true }
    })
    ctx.app.ctx.config.maxDevices = 20000
    assert.equal(limited.statusCode, 400)
    assert.match(limited.json().message, /limite/)
  })
})

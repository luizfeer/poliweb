import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createTestApp, jsonResponse } from './helpers.js'

test('sem JWT_SECRET o admin da API principal ainda autoriza o disparo', async () => {
  let seen = ''
  const ctx = await createTestApp({
    config: { jwtSecret: '' },
    authFetch: async (url, options) => {
      seen = `${url} ${options.headers.authorization}`
      const token = options.headers.authorization || ''
      if (token.endsWith('token-da-api')) return jsonResponse({ customers: [] })
      return jsonResponse({ message: 'Não autorizado.' }, 401)
    }
  })

  try {
    const denied = await ctx.app.inject({
      method: 'POST',
      url: '/push/notifications/estimate',
      headers: { authorization: 'Bearer outro' },
      payload: { all: true }
    })
    assert.equal(denied.statusCode, 401)

    const allowed = await ctx.app.inject({
      method: 'POST',
      url: '/push/notifications/estimate',
      headers: { authorization: 'Bearer token-da-api' },
      payload: { all: true }
    })
    assert.equal(allowed.statusCode, 200, allowed.body)
    assert.match(seen, /https:\/\/api\.test\/customers/)

    const anonymous = await ctx.app.inject({
      method: 'POST',
      url: '/push/devices',
      headers: { authorization: 'Bearer token-da-api' },
      payload: {
        expoPushToken: 'ExponentPushToken[admin-phone]',
        platform: 'ios',
        cityId: '402',
        role: 'owner',
        userId: '1'
      }
    })
    assert.equal(anonymous.json().linkedUser, false)
    assert.equal(anonymous.json().devices[0].userId, null)
    assert.equal(anonymous.json().devices[0].role, 'user')
  } finally {
    await ctx.app.close()
    await ctx.pglite.close()
  }
})

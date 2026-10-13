import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, test } from 'node:test'

import { migrate } from '../src/migrate.js'
import { adminToken, createTestApp, customerToken, resetTables } from './helpers.js'

describe('registro de dispositivos', { concurrency: false }, () => {
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
  })

  test('a migração pode rodar de novo sem erro', async () => {
    const applied = await migrate(ctx.db)
    assert.deepEqual(applied, [])
  })

  test('visitante anônimo grava a cidade e não aceita papel de dono', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/push/devices',
      payload: {
        permission: 'granted',
        expoPushToken: 'ExponentPushToken[anon]',
        devicePushToken: 'apns-device-token',
        platform: 'ios',
        cityId: 402,
        cityName: 'Guaxupé',
        role: 'owner',
        userId: '6368',
        categories: [12, '15', 'x']
      }
    })

    assert.equal(response.statusCode, 200)
    const body = response.json()
    assert.equal(body.registered, 2)
    assert.equal(body.linkedUser, false)
    assert.equal(body.identity, 'anonymous')
    assert.deepEqual(
      body.devices.map((device) => device.tokenType).sort(),
      ['apns', 'expo']
    )
    for (const device of body.devices) {
      assert.equal(device.userId, null)
      assert.equal(device.role, 'user')
      assert.equal(device.cityId, '402')
      assert.equal(device.cityName, 'Guaxupé')
      assert.deepEqual(device.categories, ['12', '15'])
    }
  })

  test('o upsert atualiza a cidade e reativa token invalidado', async () => {
    const first = await ctx.app.inject({
      method: 'POST',
      url: '/push/devices',
      payload: {
        expoPushToken: 'ExponentPushToken[same]',
        platform: 'ios',
        cityId: '402',
        cityName: 'Guaxupé'
      }
    })
    assert.equal(first.statusCode, 200)
    const id = first.json().devices[0].id

    await ctx.db.query('UPDATE push_devices SET invalidated_at = NOW() WHERE id = $1', [id])

    const second = await ctx.app.inject({
      method: 'POST',
      url: '/push/devices',
      payload: {
        expoPushToken: 'ExponentPushToken[same]',
        platform: 'ios',
        cityId: '510',
        cityName: 'Passos',
        categories: [9]
      }
    })
    assert.equal(second.statusCode, 200)
    const device = second.json().devices[0]
    assert.equal(device.id, id)
    assert.equal(device.cityId, '510')
    assert.equal(device.cityName, 'Passos')
    assert.equal(device.invalidatedAt, null)
    assert.deepEqual(device.categories, ['9'])

    const rows = await ctx.db.query('SELECT COUNT(*)::int AS total FROM push_devices')
    assert.equal(Number(rows.rows[0].total), 1)
  })

  test('cliente autenticado fica vinculado e o userId do corpo é ignorado', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/push/devices',
      headers: { authorization: `Bearer ${customerToken()}` },
      payload: {
        expoPushToken: 'ExponentPushToken[owner]',
        platform: 'ios',
        cityId: '402',
        role: 'owner',
        userId: '1',
        categories: [7]
      }
    })

    assert.equal(response.statusCode, 200)
    const device = response.json().devices[0]
    assert.equal(device.userId, '6368')
    assert.equal(device.role, 'owner')
    assert.equal(response.json().linkedUser, true)
  })

  test('sem categorias no corpo o upsert não apaga as que já estavam salvas', async () => {
    await ctx.app.inject({
      method: 'POST',
      url: '/push/devices',
      payload: {
        expoPushToken: 'ExponentPushToken[keep]',
        platform: 'android',
        cityId: '402',
        categories: [3, 4]
      }
    })
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/push/devices',
      payload: {
        expoPushToken: 'ExponentPushToken[keep]',
        platform: 'android',
        cityId: '402'
      }
    })
    assert.deepEqual(response.json().devices[0].categories, ['3', '4'])
  })

  test('rejeita token Expo malformado', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/push/devices',
      payload: { expoPushToken: 'nao-e-token', platform: 'ios' }
    })
    assert.equal(response.statusCode, 400)
  })

  test('a chave pública VAPID fica disponível para o site', async () => {
    const response = await ctx.app.inject({ method: 'GET', url: '/push/vapid-public-key' })
    assert.equal(response.statusCode, 200)
    assert.equal(response.json().publicKey, ctx.keys.publicKey)
  })

  test('admin pelo segredo local e pelo JWT entra; cliente e anônimo não', async () => {
    const path = '/push/notifications/estimate'
    const payload = { all: true }

    const missing = await ctx.app.inject({ method: 'POST', url: path, payload })
    assert.equal(missing.statusCode, 401)
    assert.equal(missing.json().message, 'Não autorizado.')

    const customer = await ctx.app.inject({
      method: 'POST',
      url: path,
      headers: { authorization: `Bearer ${customerToken()}` },
      payload
    })
    assert.equal(customer.statusCode, 401)

    const admin = await ctx.app.inject({
      method: 'POST',
      url: path,
      headers: { authorization: `Bearer ${adminToken()}` },
      payload
    })
    assert.equal(admin.statusCode, 200)
    assert.equal(admin.json().count, 0)

    const secret = await ctx.app.inject({
      method: 'POST',
      url: path,
      headers: { authorization: `Bearer ${'test-admin-secret'}` },
      payload
    })
    assert.equal(secret.statusCode, 200)
  })
})

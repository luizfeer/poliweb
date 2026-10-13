const assert = require('node:assert/strict')
const { test } = require('node:test')

const push = require('./pushRegistration')

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null
    },
    setItem(key, value) {
      data[key] = String(value)
    }
  }
}

test('o payload nativo vira token Expo e token APNs', () => {
  const storage = memoryStorage({
    localization: JSON.stringify({ id: 402, city: 'Guaxupé' })
  })
  const body = push.buildRegistration({
    storage,
    nativePayload: {
      type: 'poliweb-native-push',
      permission: 'granted',
      expoPushToken: 'ExponentPushToken[abc]',
      devicePushToken: 'apns-device-token',
      platform: 'ios'
    },
    subscription: {
      endpoint: 'https://push.example/should-not-use',
      keys: { p256dh: 'p', auth: 'a' }
    },
    userAgent: 'Mozilla/5.0 (iPhone)'
  })

  assert.equal(body.cityId, '402')
  assert.equal(body.cityName, 'Guaxupé')
  assert.equal(body.role, 'user')
  assert.equal(body.userId, null)
  assert.deepEqual(body.devices.map((device) => device.tokenType), ['expo', 'apns'])
  assert.equal(body.devices[0].token, 'ExponentPushToken[abc]')
  assert.equal(body.devices[1].platform, 'ios')
})

test('sem permissão nativa não há dispositivo, mesmo com token antigo no objeto', () => {
  const devices = push.nativeDevices({
    permission: 'denied',
    expoPushToken: 'ExponentPushToken[abc]',
    devicePushToken: 'apns',
    platform: 'ios'
  })
  assert.deepEqual(devices, [])
})

test('dono de comércio leva o id da conta e as categorias do comércio', () => {
  const storage = memoryStorage({
    token: 'jwt',
    context: JSON.stringify({ id: 6368, company: 'Padaria', categoryAdId: 90 })
  })
  const body = push.buildRegistration({
    storage,
    nativePayload: {
      type: 'poliweb-native-push',
      permission: 'granted',
      expoPushToken: 'ExponentPushToken[owner]',
      devicePushToken: null,
      platform: 'ios'
    },
    ownerCategories: [4, 8]
  })
  assert.equal(body.role, 'owner')
  assert.equal(body.userId, '6368')
  assert.deepEqual(body.categories, ['4', '8'])
  assert.equal(body.devices.length, 1)
})

test('visita a categoria entra na lista de interesse do visitante', () => {
  const storage = memoryStorage()
  assert.equal(push.categoryIdFromRoute({ path: '/categorias/15/padaria', params: { id: '15' } }), '15')
  assert.equal(push.categoryIdFromRoute({ path: '/buscar', params: {} }), null)
  push.rememberInterest(storage, '15')
  push.rememberInterest(storage, '15')
  push.rememberInterest(storage, '9')
  const body = push.buildRegistration({ storage, nativePayload: null, subscription: null })
  assert.deepEqual(body.categories, ['9', '15'])
  assert.equal(body.role, 'user')
})

test('navegador e TWA usam Web Push; o app Expo não', () => {
  assert.equal(push.shouldUseWebPush({
    reactNative: false,
    notification: true,
    serviceWorker: true
  }), true)
  assert.equal(push.shouldUseWebPush({
    reactNative: true,
    notification: true,
    serviceWorker: true
  }), false)
  assert.equal(push.browserPlatform('Mozilla/5.0 (Linux; Android 14; wv)'), 'android')

  const storage = memoryStorage({
    localization: JSON.stringify({ id: 18, city: 'Passos' })
  })
  const body = push.buildRegistration({
    storage,
    subscription: {
      endpoint: 'https://fcm.example/send/abc',
      keys: { p256dh: 'key', auth: 'auth' }
    },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; wv) Chrome/120.0.0.0'
  })
  assert.equal(body.devices[0].tokenType, 'webpush')
  assert.equal(body.devices[0].platform, 'android')
  assert.match(body.devices[0].token, /fcm\.example/)
})

test('a chave VAPID vira Uint8Array', () => {
  const bytes = push.urlBase64ToUint8Array('AQ')
  assert.equal(bytes.length, 1)
  assert.equal(bytes[0], 1)
})

test('lê o token que o app deixou no localStorage', () => {
  const payload = {
    type: 'poliweb-native-push',
    permission: 'granted',
    expoPushToken: 'ExponentPushToken[saved]',
    devicePushToken: null,
    platform: 'ios'
  }
  const storage = memoryStorage({
    poliweb_native_push: JSON.stringify(payload)
  })
  assert.equal(push.readNativePayload({}, storage).expoPushToken, 'ExponentPushToken[saved]')
  assert.equal(push.readNativePayload({ __POLIWEB_NATIVE_PUSH__: payload }, storage).expoPushToken, 'ExponentPushToken[saved]')
})

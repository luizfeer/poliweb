const INTEREST_KEY = 'poliweb_interest_categories'
const NATIVE_KEY = 'poliweb_native_push'
const MAX_INTERESTS = 30

function readJson(storage, key) {
  if (!storage || typeof storage.getItem !== 'function') return null
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    return null
  }
}

function selectedCity(storage) {
  const city = readJson(storage, 'localization')
  if (!city || typeof city !== 'object') return { cityId: null, cityName: null }
  return {
    cityId: city.id == null || city.id === '' ? null : String(city.id),
    cityName: city.city ? String(city.city) : null
  }
}

function accountContext(storage) {
  const token = storage && storage.getItem ? storage.getItem('token') : ''
  const context = readJson(storage, 'context')
  if (!token || !context || typeof context !== 'object') {
    return { userId: null, role: 'user', isOwner: false }
  }
  const userId = context.id == null || context.id === '' ? null : String(context.id)
  const isOwner = !!(context.company || context.categoryAdId)
  return {
    userId,
    role: isOwner ? 'owner' : 'user',
    isOwner
  }
}

function readNativePayload(win, storage) {
  const current = win && win.__POLIWEB_NATIVE_PUSH__
  if (current && current.type === 'poliweb-native-push') return current
  const stored = readJson(storage, NATIVE_KEY)
  if (stored && stored.type === 'poliweb-native-push') return stored
  return null
}

function nativeDevices(payload) {
  if (!payload || payload.permission !== 'granted') return []
  const platform = payload.platform === 'android' ? 'android' : 'ios'
  const devices = []
  if (payload.expoPushToken) {
    devices.push({
      token: String(payload.expoPushToken),
      tokenType: 'expo',
      platform
    })
  }
  if (payload.devicePushToken) {
    devices.push({
      token: String(payload.devicePushToken),
      tokenType: 'apns',
      platform
    })
  }
  return devices
}

function browserPlatform(userAgent) {
  const ua = String(userAgent || '')
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  return 'web'
}

function webPushDevice(subscription, platform) {
  if (!subscription || !subscription.endpoint) return null
  return {
    token: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: subscription.keys || {}
    }),
    tokenType: 'webpush',
    platform: platform || 'web'
  }
}

function readInterests(storage) {
  const raw = readJson(storage, INTEREST_KEY)
  if (!Array.isArray(raw)) return []
  return raw.map(String).filter((id) => /^\d+$/.test(id)).slice(0, MAX_INTERESTS)
}

function rememberInterest(storage, categoryId) {
  const current = readInterests(storage)
  if (categoryId == null || categoryId === '') return current
  const id = String(categoryId)
  if (!/^\d+$/.test(id)) return current
  const next = [id].concat(current.filter((item) => item !== id)).slice(0, MAX_INTERESTS)
  if (storage && typeof storage.setItem === 'function') {
    storage.setItem(INTEREST_KEY, JSON.stringify(next))
  }
  return next
}

function categoryIdFromRoute(route) {
  if (!route) return null
  const path = route.path || ''
  const onCategory = path.startsWith('/categorias/') || path.startsWith('/c/')
  if (!onCategory) return null
  const id = route.params && route.params.id
  if (id != null && /^\d+$/.test(String(id))) return String(id)
  return null
}

function shouldUseWebPush(env) {
  if (!env || env.reactNative) return false
  return !!(env.notification && env.serviceWorker)
}

function buildRegistration({ storage, nativePayload, subscription, userAgent, ownerCategories }) {
  const city = selectedCity(storage)
  const account = accountContext(storage)
  let devices = nativePayload ? nativeDevices(nativePayload) : []
  if (!devices.length && subscription) {
    const device = webPushDevice(subscription, browserPlatform(userAgent))
    if (device) devices = [device]
  }

  const body = {
    cityId: city.cityId,
    cityName: city.cityName,
    role: account.role,
    userId: account.userId,
    devices
  }

  if (account.isOwner) {
    if (Array.isArray(ownerCategories)) body.categories = ownerCategories.map(String)
  } else {
    body.categories = readInterests(storage)
  }

  return body
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = globalThis.atob(base64)
  const output = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index)
  return output
}

exports.accountContext = accountContext
exports.browserPlatform = browserPlatform
exports.buildRegistration = buildRegistration
exports.categoryIdFromRoute = categoryIdFromRoute
exports.nativeDevices = nativeDevices
exports.readInterests = readInterests
exports.readNativePayload = readNativePayload
exports.rememberInterest = rememberInterest
exports.selectedCity = selectedCity
exports.shouldUseWebPush = shouldUseWebPush
exports.urlBase64ToUint8Array = urlBase64ToUint8Array
exports.webPushDevice = webPushDevice

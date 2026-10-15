import { boot } from 'quasar/wrappers'
import { api } from 'boot/axios'
import { fetchVapidPublicKey, registerDevices } from 'src/services/pushApi'
import {
  accountContext,
  buildRegistration,
  categoryIdFromRoute,
  readNativePayload,
  rememberInterest,
  shouldUseWebPush,
  urlBase64ToUint8Array
} from 'src/js/pushRegistration'

const OWNER_CACHE_KEY = 'poliweb_owner_categories'
const OWNER_TTL_MS = 30 * 60 * 1000

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(null), ms)
    })
  ])
}

async function loadOwnerCategories(userId) {
  if (!userId || typeof sessionStorage === 'undefined') return null
  try {
    const cached = JSON.parse(sessionStorage.getItem(OWNER_CACHE_KEY) || 'null')
    if (cached && cached.userId === String(userId) && Date.now() - cached.at < OWNER_TTL_MS) {
      return cached.ids
    }
  } catch (error) {
    // cache ilegível segue para a API
  }

  try {
    const response = await api.get('/categories/ads', {
      params: { customerId: userId, nonDeleted: true }
    })
    const ads = (response.data && response.data.ads) || []
    const ids = new Set()
    ads.forEach((ad) => {
      if (ad && ad.categoryId != null) ids.add(String(ad.categoryId))
    })
    for (const ad of ads.slice(0, 8)) {
      try {
        const categories = await api.get(`/categories/ads/${ad.id}/categories`)
        const list = (categories.data && categories.data.categories) || []
        list.forEach((category) => {
          if (category && category.id != null) ids.add(String(category.id))
        })
      } catch (error) {
        // uma categoria a menos não impede o registro do aparelho
      }
    }
    const result = [...ids]
    sessionStorage.setItem(OWNER_CACHE_KEY, JSON.stringify({
      userId: String(userId),
      at: Date.now(),
      ids: result
    }))
    return result
  } catch (error) {
    return null
  }
}

export default boot(({ router, store }) => {
  if (typeof window === 'undefined') return

  let running = false
  let pending = false
  let timer = null
  let lastFingerprint = ''
  let webPushMiss = false

  window.poliwebRegisterPushToken = (payload) => {
    if (!payload || typeof payload !== 'object') return
    window.__POLIWEB_NATIVE_PUSH__ = payload
    try {
      window.localStorage.setItem('poliweb_native_push', JSON.stringify(payload))
    } catch (error) {
      // storage cheio ainda deixa o token em memória
    }
    scheduleSync()
  }

  window.addEventListener('poliweb-native-push', (event) => {
    if (event.detail) window.poliwebRegisterPushToken(event.detail)
  })

  window.addEventListener('message', (event) => {
    const data = event.data
    if (data && data.type === 'poliweb-native-push') window.poliwebRegisterPushToken(data)
  })

  window.addEventListener('poliweb:auth-changed', scheduleSync)

  if (!window.localStorage.setItem.__poliwebPush) {
    const original = window.localStorage.setItem.bind(window.localStorage)
    const wrapped = function setItem(key, value) {
      original(key, value)
      if (key === 'localization' || key === 'token' || key === 'context' || key === 'admin') {
        scheduleSync()
      }
    }
    wrapped.__poliwebPush = true
    window.localStorage.setItem = wrapped
  }

  if (store && typeof store.watch === 'function') {
    store.watch(
      (state) => state.localization && state.localization.current,
      () => scheduleSync()
    )
  }

  if (router && typeof router.afterEach === 'function') {
    router.afterEach((to) => {
      const categoryId = categoryIdFromRoute(to)
      if (categoryId) rememberInterest(window.localStorage, categoryId)
      scheduleSync()
    })
  }

  const existing = readNativePayload(window, window.localStorage)
  if (existing) window.__POLIWEB_NATIVE_PUSH__ = existing

  if (typeof window.poliwebRequestPushToken === 'function') {
    try {
      window.poliwebRequestPushToken()
    } catch (error) {
      // o app nativo pede de novo no próximo carregamento
    }
  }

  scheduleSync()

  function scheduleSync() {
    pending = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      drain()
    }, 500)
  }

  async function drain() {
    if (running) return
    running = true
    try {
      while (pending) {
        pending = false
        await syncOnce()
      }
    } finally {
      running = false
      if (pending) scheduleSync()
    }
  }

  async function syncOnce() {
    try {
      const nativeShell = !!(window.ReactNativeWebView || window.poliwebRequestPushToken)
      const nativePayload = readNativePayload(window, window.localStorage)
      let subscription = null
      if (!nativeShell && !nativePayload) {
        const canWeb = shouldUseWebPush({
          reactNative: false,
          notification: typeof window.Notification !== 'undefined',
          serviceWorker: !!(navigator.serviceWorker)
        })
        if (canWeb) subscription = await ensureWebPush()
      }
      if (pending) return

      const account = accountContext(window.localStorage)
      let ownerCategories
      if (account.isOwner) ownerCategories = await loadOwnerCategories(account.userId)
      if (pending) return

      const body = buildRegistration({
        storage: window.localStorage,
        nativePayload: nativeShell || nativePayload ? nativePayload : null,
        subscription,
        userAgent: navigator.userAgent,
        ownerCategories
      })
      if (!body.devices.length) return

      const fingerprint = JSON.stringify(body)
      if (fingerprint === lastFingerprint) return
      await registerDevices(body)
      lastFingerprint = fingerprint
    } catch (error) {
      // falha de rede não pode travar a navegação
    }
  }

  async function ensureWebPush() {
    if (webPushMiss || typeof window.Notification === 'undefined' || !navigator.serviceWorker) {
      return null
    }
    try {
      const registration = await withTimeout(navigator.serviceWorker.ready, 4000)
      if (!registration || !registration.pushManager) {
        webPushMiss = true
        return null
      }

      if (window.Notification.permission === 'denied') {
        webPushMiss = true
        return null
      }
      if (window.Notification.permission === 'default') {
        const permission = await window.Notification.requestPermission()
        if (permission !== 'granted') {
          webPushMiss = permission === 'denied'
          return null
        }
      }

      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        const publicKey = process.env.VAPID_PUBLIC_KEY || await fetchVapidPublicKey()
        if (!publicKey) return null
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        })
      }
      return subscription.toJSON()
    } catch (error) {
      webPushMiss = true
      return null
    }
  }
})

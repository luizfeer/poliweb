import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'

const CHUNK_RELOAD_KEY = 'poliweb_chunk_reload_attempted'

function isChunkLoadError(error) {
  const message = String(error?.message || error || '')
  const name = String(error?.name || '')
  return (
    name === 'ChunkLoadError' ||
    message.includes('ChunkLoadError') ||
    message.includes('Loading chunk') ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed')
  )
}

async function clearRuntimeCaches() {
  if (typeof window === 'undefined') return

  try {
    if ('caches' in window) {
      const keys = await window.caches.keys()
      await Promise.all(keys.map((key) => window.caches.delete(key)))
    }
  } catch (_) {}

  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.()
    await Promise.all((registrations || []).map((registration) => registration.update()))
  } catch (_) {}
}

function recoverFromChunkLoadError(error) {
  if (typeof window === 'undefined' || !isChunkLoadError(error)) return false
  if (window.sessionStorage?.getItem(CHUNK_RELOAD_KEY)) return false

  try {
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  } catch (_) {}

  clearRuntimeCaches().finally(() => {
    window.location.reload()
  })
  return true
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (recoverFromChunkLoadError(event.reason)) {
      event.preventDefault()
    }
  })
}

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.MODE === 'ssr' ? void 0 : process.env.VUE_ROUTER_BASE)
  })

  Router.onError((error) => {
    recoverFromChunkLoadError(error)
  })

  Router.afterEach(() => {
    if (typeof window === 'undefined') return
    try {
      window.sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    } catch (_) {}
  })

  return Router
})

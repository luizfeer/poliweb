import { boot } from 'quasar/wrappers'
import axios from 'axios'

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const baseURL = process.env.DEV
  ? (process.env.API_URL_LOCAL || process.env.API_URL_SERVER || 'http://127.0.0.1:5001')
  : (
      process.env.SERVER
        ? (process.env.API_URL_SERVER || process.env.API_URL || 'http://127.0.0.1:5001')
        : (process.env.API_URL_BROWSER || process.env.API_URL || 'https://apiv3.poliwebapp.com.br')
    )

const api = axios.create({ baseURL })
const TOKEN_STORAGE_KEY = 'token'
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken'
const CONTEXT_STORAGE_KEY = 'context'
const ADMIN_STORAGE_KEY = 'admin'

const getStoredAccessToken = () => window.localStorage?.getItem(TOKEN_STORAGE_KEY)
const getStoredRefreshToken = () => window.localStorage?.getItem(REFRESH_TOKEN_STORAGE_KEY)

const applyAccessToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  delete api.defaults.headers.common.Authorization
}

export const persistAuthSession = (authPayload, options = {}) => {
  if (typeof window === 'undefined' || !authPayload) return

  const accessToken = authPayload.accessToken || authPayload.token
  const refreshToken = authPayload.refreshToken
  const context = authPayload.context

  if (accessToken) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    applyAccessToken(accessToken)
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken)
  }

  if (context) {
    window.localStorage.setItem(
      CONTEXT_STORAGE_KEY,
      JSON.stringify({ ...context, when: new Date() })
    )
  }

  if (typeof options.isAdmin === 'boolean') {
    if (options.isAdmin) window.localStorage.setItem(ADMIN_STORAGE_KEY, 'true')
    else window.localStorage.removeItem(ADMIN_STORAGE_KEY)
  }
}

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(CONTEXT_STORAGE_KEY)
  window.localStorage.removeItem(ADMIN_STORAGE_KEY)
  applyAccessToken(null)
}

let refreshPromise = null

const refreshAccessToken = async () => {
  const refreshToken = getStoredRefreshToken()

  if (!refreshToken) {
    throw new Error('Refresh token not found')
  }

  const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })
  persistAuthSession(data)
  return data.accessToken || data.token
}
// const apiCep = axios.create({ baseURL: 'https://www.cepaberto.com/api/v3/nearest?' })
export default boot(({ app, router }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api
  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file
  
  app.config.globalProperties.$api = api
  api.defaults.headers.post['Content-Type'] = 'application/json';
  // SSR-safe: localStorage só existe no browser
  if (typeof window !== 'undefined') {
    const AUTH_TOKEN = getStoredAccessToken()
    if (AUTH_TOKEN) {
      applyAccessToken(AUTH_TOKEN)
    }
  }

  api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const authToken = getStoredAccessToken()
      if (authToken) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${authToken}`
      }
    }

    return config
  })

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      const status = error.response?.status
      const url = originalRequest?.url || ''
      const isAuthEndpoint =
        url.includes('/admin/login') ||
        url.includes('/customers/login') ||
        url.includes('/users/login') ||
        url.includes('/auth/refresh')

      if (status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint) {
        return Promise.reject(error)
      }

      try {
        originalRequest._retry = true
        refreshPromise = refreshPromise || refreshAccessToken()
        const newAccessToken = await refreshPromise
        refreshPromise = null
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        refreshPromise = null
        const isAdmin = !!window.localStorage?.getItem(ADMIN_STORAGE_KEY)
        clearAuthSession()

        app.config.globalProperties.$q?.notify({
          color: 'negative',
          position: 'top',
          message: 'Sua sessão expirou. Faça login novamente.',
          icon: 'report_problem'
        })

        router.push(isAdmin ? '/adm/login' : '/login')
        return Promise.reject(refreshError)
      }
    }
  )
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

export { api }

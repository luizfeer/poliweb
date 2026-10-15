import axios from 'axios'
import { api } from 'boot/axios'

let separateClient = null

export function pushHttp() {
  const base = process.env.PUSH_API_URL
  if (!base) return api

  if (!separateClient) {
    separateClient = axios.create({ baseURL: base })
    separateClient.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = window.localStorage && window.localStorage.getItem('token')
        if (token) {
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    })
  }

  return separateClient
}

export function registerDevices(body) {
  return pushHttp().post('/push/devices', body)
}

export function fetchVapidPublicKey() {
  return pushHttp().get('/push/vapid-public-key').then((response) => response.data.publicKey)
}

export function estimateNotification(body) {
  return pushHttp().post('/push/notifications/estimate', body)
}

export function sendNotification(body) {
  return pushHttp().post('/push/notifications', body)
}

export function listNotifications(limit = 30) {
  return pushHttp().get('/push/notifications', { params: { limit } })
}

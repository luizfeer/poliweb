import crypto from 'node:crypto'

import { httpError } from './errors.js'

const ADMIN_ROLES = new Set(['admin', 'superadmin', 'administrator'])
const adminCache = new Map()
const ADMIN_CACHE_MS = 60 * 1000

export function signHs256(payload, secret) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(JSON.stringify(payload))
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

export function verifyHs256(token, secret) {
  if (!token || !secret) return null
  const parts = String(token).split('.')
  if (parts.length !== 3) return null

  let header
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!header || header.alg !== 'HS256') return null

  const expected = crypto.createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest('base64url')
  const actual = Buffer.from(parts[2])
  const wanted = Buffer.from(expected)
  if (actual.length !== wanted.length || !crypto.timingSafeEqual(actual, wanted)) return null

  let payload
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!payload || typeof payload !== 'object') return null
  if (payload.exp != null && Number(payload.exp) <= Date.now() / 1000) return null
  if (payload.nbf != null && Number(payload.nbf) > Date.now() / 1000) return null
  return payload
}

export function bearerToken(authorization) {
  const value = String(authorization || '')
  const match = value.match(/^Bearer\s+(\S+)$/i)
  return match ? match[1] : ''
}

export function sessionFromClaims(claims) {
  return {
    verified: true,
    kind: isAdminClaims(claims) ? 'admin' : 'user',
    userId: claimUserId(claims),
    email: claims.email ? String(claims.email) : null
  }
}

export function isAdminClaims(claims) {
  if (!claims || typeof claims !== 'object') return false
  if (claims.admin === true || claims.isAdmin === true) return true
  const role = String(claims.role || claims.type || claims.kind || '').toLowerCase()
  if (ADMIN_ROLES.has(role)) return true
  if (Array.isArray(claims.roles) && claims.roles.some((item) => ADMIN_ROLES.has(String(item).toLowerCase()))) {
    return true
  }
  return false
}

export async function resolveSession(authorization, options) {
  const token = bearerToken(authorization)
  if (!token) return anonymous()

  if (options.adminSecret && safeEqual(token, options.adminSecret)) {
    return { verified: true, kind: 'admin', userId: null, email: null }
  }

  if (options.jwtSecret) {
    const claims = verifyHs256(token, options.jwtSecret)
    if (claims) {
      const session = sessionFromClaims(claims)
      if (session.kind === 'admin' || !options.probeAdmin) return session
      const probed = await probeAdmin(token, options)
      if (probed === 'admin') return { ...session, kind: 'admin' }
      return session
    }
  }

  if (options.probeAdmin) {
    const probed = await probeAdmin(token, options)
    if (probed === 'admin') return { verified: true, kind: 'admin', userId: null, email: null }
    if (probed === 'error') throw httpError(503, 'Não foi possível validar a sessão.')
  }

  return anonymous()
}

export async function requireAdmin(authorization, options) {
  const session = await resolveSession(authorization, { ...options, probeAdmin: true })
  if (session.kind !== 'admin') throw httpError(401, 'Não autorizado.')
  return session
}

function anonymous() {
  return { verified: false, kind: 'anonymous', userId: null, email: null }
}

function claimUserId(claims) {
  for (const key of ['customerId', 'userId', 'user_id', 'id', 'sub']) {
    const value = claims[key]
    if (value == null || value === '') continue
    if (typeof value === 'object') continue
    const text = String(value).trim()
    if (text) return text
  }
  return null
}

async function probeAdmin(token, options) {
  if (!options.upstreamApi || typeof options.authFetch !== 'function') return 'anonymous'
  const cacheKey = crypto.createHash('sha256').update(token).digest('hex')
  const cached = adminCache.get(cacheKey)
  if (cached && cached.until > Date.now()) return 'admin'

  try {
    const response = await options.authFetch(`${options.upstreamApi}/customers`, {
      headers: { authorization: `Bearer ${token}` }
    })
    if (response.status >= 200 && response.status < 300) {
      adminCache.set(cacheKey, { until: Date.now() + ADMIN_CACHE_MS })
      return 'admin'
    }
    return 'anonymous'
  } catch {
    return 'error'
  }
}

function safeEqual(left, right) {
  const a = crypto.createHash('sha256').update(String(left)).digest()
  const b = crypto.createHash('sha256').update(String(right)).digest()
  return crypto.timingSafeEqual(a, b)
}

function base64url(value) {
  return Buffer.from(value).toString('base64url')
}

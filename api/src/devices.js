import crypto from 'node:crypto'

import { httpError } from './errors.js'
import { DELIVERABLE_TYPES } from './segment.js'

const PLATFORMS = new Set(['ios', 'android', 'web'])
const EXPO_TOKEN = /^Expo(?:nent)?PushToken\[[^\]]+\]$/

export function collectDevices(body = {}) {
  const raw = []
  if (Array.isArray(body.devices)) raw.push(...body.devices)

  const platform = normalizePlatform(body.platform, 'ios')
  if (body.expoPushToken) {
    raw.push({ token: body.expoPushToken, tokenType: 'expo', platform })
  }
  if (body.devicePushToken) {
    raw.push({ token: body.devicePushToken, tokenType: 'apns', platform })
  }
  if (body.subscription) {
    raw.push({
      token: JSON.stringify(body.subscription),
      tokenType: 'webpush',
      platform: normalizePlatform(body.platform, 'web')
    })
  }

  const devices = []
  const seen = new Set()
  for (const item of raw) {
    const device = normalizeDevice(item)
    if (!device) continue
    const key = `${device.tokenType}:${device.token}`
    if (seen.has(key)) continue
    seen.add(key)
    devices.push(device)
  }
  return devices
}

export function bindIdentity(body, session) {
  if (!session?.verified) {
    return { userId: null, role: 'user', linkedUser: false }
  }

  let userId = session.userId || null
  if (session.kind === 'admin' && !userId && body.userId != null && body.userId !== '') {
    userId = String(body.userId).trim()
  }

  const requested = body.role === 'owner' || body.role === 'user' ? body.role : null
  const role = requested || (session.kind === 'admin' ? 'user' : 'owner')
  return { userId, role, linkedUser: Boolean(userId) }
}

export function audienceFromBody(body, session) {
  const identity = bindIdentity(body, session)
  const categories = normalizeCategories(body.categories)
  return {
    ...identity,
    cityId: body.cityId == null || body.cityId === '' ? null : String(body.cityId).trim().slice(0, 32),
    cityName: body.cityName == null || body.cityName === '' ? null : String(body.cityName).trim().slice(0, 80),
    categories
  }
}

export async function upsertDevices(db, devices, audience) {
  const saved = []
  for (const device of devices) {
    const id = crypto.randomUUID()
    const categories = audience.categories
    const result = await db.query(
      `
      INSERT INTO push_devices (
        id, token, token_type, platform, user_id, city_id, city_name, role,
        categories, subscription, invalidated_at, created_at, last_seen_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        COALESCE($9::text[], '{}'), $10::jsonb, NULL, NOW(), NOW()
      )
      ON CONFLICT (token_type, token) DO UPDATE SET
        platform = EXCLUDED.platform,
        user_id = EXCLUDED.user_id,
        city_id = EXCLUDED.city_id,
        city_name = EXCLUDED.city_name,
        role = EXCLUDED.role,
        categories = CASE
          WHEN $11::boolean THEN EXCLUDED.categories
          ELSE push_devices.categories
        END,
        subscription = COALESCE(EXCLUDED.subscription, push_devices.subscription),
        invalidated_at = NULL,
        last_seen_at = NOW()
      RETURNING id, token_type, platform, user_id, city_id, city_name, role, categories, invalidated_at, created_at, last_seen_at
      `,
      [
        id,
        device.token,
        device.tokenType,
        device.platform,
        audience.userId,
        audience.cityId,
        audience.cityName,
        audience.role,
        categories,
        device.subscription ? JSON.stringify(device.subscription) : null,
        categories != null
      ]
    )
    saved.push(mapDevice(result.rows[0]))
  }
  return saved
}

export async function countSegment(db, filters) {
  const params = filterParams(filters)
  const result = await db.query(
    `
    SELECT token_type, COUNT(*)::int AS total
    FROM push_devices
    WHERE ${segmentWhere()}
    GROUP BY token_type
    `,
    params
  )
  const byType = { expo: 0, webpush: 0 }
  for (const row of result.rows) {
    if (row.token_type === 'expo' || row.token_type === 'webpush') {
      byType[row.token_type] = Number(row.total)
    }
  }
  return {
    count: byType.expo + byType.webpush,
    byType
  }
}

export async function listSegment(db, filters) {
  const result = await db.query(
    `
    SELECT id, token, token_type, platform, subscription
    FROM push_devices
    WHERE ${segmentWhere()}
    ORDER BY created_at ASC, id ASC
    `,
    filterParams(filters)
  )
  return result.rows.map((row) => ({
    id: row.id,
    token: row.token,
    tokenType: row.token_type,
    platform: row.platform,
    subscription: parseJson(row.subscription)
  }))
}

export async function invalidateTokens(db, tokenType, tokens) {
  if (!tokens.length) return 0
  const result = await db.query(
    `
    UPDATE push_devices
    SET invalidated_at = NOW()
    WHERE invalidated_at IS NULL
      AND token_type = $1
      AND token = ANY($2::text[])
    `,
    [tokenType, tokens]
  )
  return result.rowCount ?? result.rows?.length ?? tokens.length
}

function segmentWhere() {
  return `
    invalidated_at IS NULL
    AND token_type = ANY($1::text[])
    AND (cardinality($2::text[]) = 0 OR city_id = ANY($2::text[]))
    AND ($3::text IS NULL OR role = $3)
    AND (
      cardinality($4::text[]) = 0
      OR EXISTS (
        SELECT 1
        FROM unnest(categories) AS category_id
        WHERE category_id = ANY($4::text[])
      )
    )
    AND ($5::text IS NULL OR user_id = $5)
  `
}

function filterParams(filters) {
  return [
    DELIVERABLE_TYPES,
    filters.cities?.length ? filters.cities : [],
    filters.role,
    filters.categories?.length ? filters.categories : [],
    filters.userId
  ]
}

function normalizeDevice(item) {
  if (!item || item.token == null || !item.tokenType) return null
  const tokenType = String(item.tokenType)
  const platform = normalizePlatform(item.platform, tokenType === 'webpush' ? 'web' : 'ios')
  if (!PLATFORMS.has(platform)) throw httpError(400, 'Plataforma inválida.')

  if (tokenType === 'expo') {
    const token = String(item.token).trim()
    if (!EXPO_TOKEN.test(token)) throw httpError(400, 'Token Expo inválido.')
    return { token, tokenType, platform, subscription: null }
  }

  if (tokenType === 'apns') {
    const token = String(item.token).trim()
    if (token.length < 8 || token.length > 4096 || /\s/.test(token)) {
      throw httpError(400, 'Token APNs inválido.')
    }
    return { token, tokenType, platform, subscription: null }
  }

  if (tokenType === 'webpush') {
    const subscription = readSubscription(item)
    return {
      token: subscription.endpoint,
      tokenType,
      platform,
      subscription
    }
  }

  throw httpError(400, 'Tipo de token inválido. Use expo, apns ou webpush.')
}

function readSubscription(item) {
  let parsed = item.subscription
  if (!parsed) {
    try {
      parsed = JSON.parse(String(item.token))
    } catch {
      parsed = null
    }
  }
  if (!parsed || typeof parsed !== 'object' || !String(parsed.endpoint || '').startsWith('https://')) {
    throw httpError(400, 'Inscrição Web Push inválida.')
  }
  const p256dh = parsed.keys?.p256dh
  const auth = parsed.keys?.auth
  if (!p256dh || !auth) throw httpError(400, 'Inscrição Web Push sem chaves.')
  return {
    endpoint: String(parsed.endpoint),
    keys: { p256dh: String(p256dh), auth: String(auth) }
  }
}

function normalizePlatform(value, fallback) {
  const platform = String(value || fallback || '').toLowerCase()
  if (platform === 'ios' || platform === 'android' || platform === 'web') return platform
  return fallback
}

function normalizeCategories(value) {
  if (value == null) return null
  if (!Array.isArray(value)) return null
  const seen = new Set()
  for (const item of value) {
    const text = String(item ?? '').trim()
    if (/^\d+$/.test(text)) seen.add(text)
    if (seen.size >= 50) break
  }
  return [...seen]
}

function mapDevice(row) {
  return {
    id: row.id,
    tokenType: row.token_type,
    platform: row.platform,
    userId: row.user_id,
    cityId: row.city_id,
    cityName: row.city_name,
    role: row.role,
    categories: parseTextArray(row.categories),
    invalidatedAt: row.invalidated_at,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at
  }
}

function parseTextArray(value) {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') {
    const inner = value.trim().replace(/^\{/, '').replace(/\}$/, '')
    if (!inner) return []
    return inner.split(',').map((item) => item.trim().replace(/^"|"$/g, ''))
  }
  return []
}

function parseJson(value) {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return value
}

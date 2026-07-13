import { db } from 'src/db/db'

const STORE = 'homeCache'

// TTL em ms (4 minutos)
export const FOUR_MINUTES = 4 * 60 * 1000
export const FIVE_HOURS = 5 * 60 * 60 * 1000

export async function getCached(key, maxAgeMs = FOUR_MINUTES) {
  if (typeof window === 'undefined') return { hit: false, data: null }
  try {
    const row = await db[STORE].get(String(key))
    if (!row) return { hit: false, data: null }
    const age = Date.now() - (row.updatedAt || 0)
    if (age > maxAgeMs) {
      return { hit: false, data: null }
    }
    return { hit: true, data: row.data }
  } catch {
    return { hit: false, data: null }
  }
}

export async function setCached(key, data) {
  if (typeof window === 'undefined') return
  try {
    await db[STORE].put({
      key: String(key),
      data,
      updatedAt: Date.now(),
    })
  } catch {
    // ignore storage errors
  }
}

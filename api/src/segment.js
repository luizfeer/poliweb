import { httpError } from './errors.js'

export const PUSH_BATCH_SIZE = 100
export const DELIVERABLE_TYPES = ['expo', 'webpush']

export function normalizeFilters(input = {}) {
  const all = input.all === true
  if (all) {
    return { all: true, cities: [], role: null, categories: [], userId: null }
  }

  const role = input.role == null || input.role === '' || input.role === 'all'
    ? null
    : String(input.role)
  if (role && role !== 'user' && role !== 'owner') {
    throw httpError(400, 'Papel inválido. Use user, owner ou todos.')
  }

  return {
    all: false,
    cities: cleanList(input.cities, 40, 32),
    role,
    categories: cleanList(input.categories, 50, 32).filter((item) => /^\d+$/.test(item)),
    userId: cleanId(input.userId)
  }
}

export function normalizePath(value) {
  const path = String(value || '').trim()
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.includes('://')) {
    throw httpError(400, 'O link precisa ser um caminho do site, começando com /.')
  }
  if (path.length > 300) throw httpError(400, 'O link passou de 300 caracteres.')
  return path
}

export function normalizeMessage(input = {}) {
  const title = String(input.title || '').trim()
  const body = String(input.body || input.text || '').trim()
  if (!title) throw httpError(400, 'Informe o título.')
  if (!body) throw httpError(400, 'Informe o texto.')
  if (title.length > 120) throw httpError(400, 'O título passou de 120 caracteres.')
  if (body.length > 500) throw httpError(400, 'O texto passou de 500 caracteres.')
  return {
    title,
    body,
    path: normalizePath(input.path || input.link),
    filters: normalizeFilters(input)
  }
}

export function chunk(items, size = PUSH_BATCH_SIZE) {
  const batches = []
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size))
  }
  return batches
}

function cleanList(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  for (const item of value) {
    if (item == null) continue
    const text = String(item).trim()
    if (!text || text.length > maxLength || !/^[\w.-]+$/.test(text)) continue
    seen.add(text)
    if (seen.size >= maxItems) break
  }
  return [...seen]
}

function cleanId(value) {
  if (value == null || value === '') return null
  const text = String(value).trim()
  if (!/^[\w.-]+$/.test(text) || text.length > 64) {
    throw httpError(400, 'Usuário inválido.')
  }
  return text
}

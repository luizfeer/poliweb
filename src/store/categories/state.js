const CACHE_STORAGE_KEY = 'categoriesCache'
const LEGACY_STORAGE_KEY = 'categories'

function readJson(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback
  try {
    const s = localStorage.getItem(key)
    return s ? JSON.parse(s) : fallback
  } catch {
    return fallback
  }
}

export default function () {
  const currentLocalization = readJson('localization', null)
  const cache = readJson(CACHE_STORAGE_KEY, {})
  const currentCityId = currentLocalization?.id ? String(currentLocalization.id) : null
  const cachedCurrentList = currentCityId ? cache[currentCityId]?.list : null

  return {
    subCategorie: [],
    list: Array.isArray(cachedCurrentList) ? cachedCurrentList : readJson(LEGACY_STORAGE_KEY, []),
    cache,
    currentCityId,
    loading: false,
  }
}

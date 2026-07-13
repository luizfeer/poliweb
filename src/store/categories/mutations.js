export function SET_SUBCATEGORIE(state, { payload }) {
  state.subCategorie = payload
}

export function SET_CATEGORIES(state, payload) {
  const list = Array.isArray(payload) ? payload : []
  state.list = list
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('categories', JSON.stringify(list))
  }
}

export function SET_CATEGORIES_LOADING(state, value) {
  state.loading = !!value
}

export function SET_CATEGORIES_CACHE(state, { cityId, list, fetchedAt = Date.now() }) {
  if (!cityId) return
  const key = String(cityId)
  const nextList = Array.isArray(list) ? list : []
  state.currentCityId = key
  state.list = nextList
  state.cache = {
    ...(state.cache || {}),
    [key]: {
      list: nextList,
      fetchedAt,
    },
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('categoriesCache', JSON.stringify(state.cache))
    localStorage.setItem('categories', JSON.stringify(nextList))
  }
}

export function INVALIDATE_CATEGORIES_CACHE(state, { cityId } = {}) {
  const key = cityId ? String(cityId) : null

  if (key) {
    const nextCache = { ...(state.cache || {}) }
    delete nextCache[key]
    state.cache = nextCache

    if (state.currentCityId === key) {
      state.list = []
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('categories')
      }
    }
  } else {
    state.cache = {}
    state.list = []
    state.currentCityId = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('categories')
    }
  }

  if (typeof localStorage !== 'undefined') {
    if (Object.keys(state.cache || {}).length) {
      localStorage.setItem('categoriesCache', JSON.stringify(state.cache))
    } else {
      localStorage.removeItem('categoriesCache')
    }
  }
}

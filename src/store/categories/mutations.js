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

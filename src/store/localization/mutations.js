export function SET_LOCALIZATION(state, payload) {
  state.current = payload
  if (payload && typeof localStorage !== 'undefined') {
    localStorage.setItem('localization', JSON.stringify(payload))
  }
}

export function SET_CATEGORIES_LOADING(state, value) {
  state.categoriesLoading = value
}

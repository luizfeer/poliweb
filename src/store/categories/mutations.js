export function SET_SUBCATEGORIE(state, { payload }) {
  state.subCategorie = payload
}

export function SET_CATEGORIES(state, payload) {
  state.list = payload || []
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('categories', JSON.stringify(state.list))
  }
}

export function SET_CATEGORIES_LOADING(state, value) {
  state.loading = !!value
}
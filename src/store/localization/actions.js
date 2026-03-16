export function setLocalization({ commit }, payload) {
  commit('SET_LOCALIZATION', payload)
}

export function setCategoriesLoading({ commit }, value) {
  commit('SET_CATEGORIES_LOADING', value)
}

import { api } from 'src/boot/axios'

export function setSubCategorie({ commit }, { payload }) {
  commit('SET_SUBCATEGORIE', payload)
}

export async function fetchCategories({ commit, rootState }, overrideLoc) {
  const loc = overrideLoc || rootState.localization?.current
  const addressId = loc?.id
  if (!addressId) {
    commit('SET_CATEGORIES', [])
    return
  }
  commit('SET_CATEGORIES_LOADING', true)
  try {
    const response = await api.get(`/cities/${addressId}/categories?nonDeleted=true`)
    const raw = response?.data?.categories ?? []
    const list = (Array.isArray(raw) ? raw : [])
      .filter((item) => !item.deletedAt)
      .map((e) => ({ ...e, name: (e.name || '').trim() }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    commit('SET_CATEGORIES', list)
  } catch (err) {
    commit('SET_CATEGORIES', [])
    throw err
  } finally {
    commit('SET_CATEGORIES_LOADING', false)
  }
}
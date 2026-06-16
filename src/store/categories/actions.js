import { api } from 'src/boot/axios'
import { queryClient } from 'src/boot/vue-query'

const CATEGORIES_CACHE_TTL = 1000 * 60 * 30

export function setSubCategorie({ commit }, { payload }) {
  commit('SET_SUBCATEGORIE', payload)
}

function normalizeFetchOptions(input) {
  if (input?.loc || input?.force !== undefined) return input
  return { loc: input }
}

function formatCategories(raw) {
  return (Array.isArray(raw) ? raw : [])
    .filter((item) => !item.deletedAt)
    .map((e) => ({ ...e, name: (e.name || '').trim() }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

export async function fetchCategories({ commit, state, rootState }, input) {
  const { loc: overrideLoc, force = false } = normalizeFetchOptions(input)
  const loc = overrideLoc || rootState.localization?.current
  const addressId = loc?.id
  if (!addressId) {
    commit('SET_CATEGORIES', [])
    return
  }
  const cityId = String(addressId)
  const cached = state.cache?.[cityId]
  const hasCachedList = Array.isArray(cached?.list)
  const isFresh = cached?.fetchedAt && (Date.now() - cached.fetchedAt < CATEGORIES_CACHE_TTL)

  if (hasCachedList) {
    commit('SET_CATEGORIES_CACHE', {
      cityId,
      list: cached.list,
      fetchedAt: cached.fetchedAt,
    })
    queryClient.setQueryData(['city-categories', cityId], cached.list)
    if (isFresh && !force) return cached.list
  }

  commit('SET_CATEGORIES_LOADING', true)
  try {
    const list = await queryClient.fetchQuery({
      queryKey: ['city-categories', cityId],
      staleTime: force ? 0 : CATEGORIES_CACHE_TTL,
      queryFn: async () => {
        const response = await api.get(`/cities/${addressId}/categories?nonDeleted=true`)
        return formatCategories(response?.data?.categories ?? [])
      },
    })
    commit('SET_CATEGORIES_CACHE', { cityId, list })
    return list
  } catch (err) {
    if (!hasCachedList) commit('SET_CATEGORIES', [])
    throw err
  } finally {
    commit('SET_CATEGORIES_LOADING', false)
  }
}

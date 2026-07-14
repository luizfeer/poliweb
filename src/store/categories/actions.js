import { api } from 'src/boot/axios'
import { queryClient } from 'src/boot/vue-query'

const CATEGORIES_CACHE_TTL = 1000 * 60 * 60 * 5

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

function findCategoryById(list, id) {
  for (const item of list || []) {
    if (Number(item.id) === Number(id)) return item
    const found = findCategoryById(item.subcategories || [], id)
    if (found) return found
  }
  return null
}

function mergeCategoryChildren(cityCategory, globalCategory) {
  if (!globalCategory) return cityCategory

  const cityChildren = Array.isArray(cityCategory.subcategories) ? cityCategory.subcategories : []
  const globalChildren = Array.isArray(globalCategory.subcategories)
    ? globalCategory.subcategories.filter((item) => !item.deletedAt)
    : []
  const cityChildrenById = new Map(cityChildren.map((item) => [Number(item.id), item]))

  const mergedChildren = globalChildren.map((globalChild) => {
    const cityChild = cityChildrenById.get(Number(globalChild.id))
    if (!cityChild) return globalChild
    return mergeCategoryChildren(cityChild, globalChild)
  })

  cityChildren.forEach((cityChild) => {
    if (!mergedChildren.some((item) => Number(item.id) === Number(cityChild.id))) {
      mergedChildren.push(cityChild)
    }
  })

  return {
    ...cityCategory,
    subcategories: formatCategories(mergedChildren),
  }
}

async function fetchMergedCityCategories(addressId) {
  const response = await api.get(`/cities/${addressId}/categories?nonDeleted=true`)
  const cityCategories = formatCategories(response?.data?.categories ?? [])

  try {
    const globalResponse = await api.get('/categories')
    const globalCategories = formatCategories(globalResponse?.data?.categories ?? [])
    return cityCategories.map((cityCategory) =>
      mergeCategoryChildren(cityCategory, findCategoryById(globalCategories, cityCategory.id))
    )
  } catch (_) {
    return cityCategories
  }
}

function getCityId(input) {
  return input?.cityId ?? input?.loc?.id ?? input?.id ?? null
}

export async function invalidateCategories({ commit }, input = {}) {
  const cityId = getCityId(input)
  const queryKey = cityId ? ['city-categories', String(cityId)] : ['city-categories']
  const exact = !!cityId

  await queryClient.cancelQueries({ queryKey, exact })
  queryClient.removeQueries({ queryKey, exact })
  commit('INVALIDATE_CATEGORIES_CACHE', { cityId })
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

  if (hasCachedList && !force) {
    commit('SET_CATEGORIES_CACHE', {
      cityId,
      list: cached.list,
      fetchedAt: cached.fetchedAt,
    })
    queryClient.setQueryData(['city-categories', cityId], cached.list)
    if (isFresh) return cached.list
  }

  commit('SET_CATEGORIES_LOADING', true)
  try {
    const list = await queryClient.fetchQuery({
      queryKey: ['city-categories', cityId],
      staleTime: force ? 0 : CATEGORIES_CACHE_TTL,
      queryFn: async () => {
        return fetchMergedCityCategories(addressId)
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

import { api } from 'src/boot/axios'
import { queryClient } from 'src/boot/vue-query'

const AD_CATEGORY_CACHE_PREFIXES = [
  'cityAds_',
  'cityTopRankedAds_',
  'cityVideos_',
  'cityPageAds_',
  'cityPageTopAds_',
  'cityPageCategories_',
]

export async function invalidateAdCategoryCaches() {
  queryClient.removeQueries({ queryKey: ['category-ads'], exact: false })
  queryClient.removeQueries({ queryKey: ['city-categories'], exact: false })
  if (typeof window === 'undefined') return
  const { removeCached, removeCachedByPrefix } = await import('src/services/homeCache')
  await Promise.all([
    removeCached('cityRanking_v2'),
    removeCachedByPrefix(AD_CATEGORY_CACHE_PREFIXES),
  ])
}

/**
 * Lista as categorias do anúncio.
 * GET /categories/ads/:id/categories
 * @param {number} adId - ID do anúncio
 * @returns {Promise<{data: {categories: Array}}>}
 */
export function getAdCategories(adId) {
  return api.get(`/categories/ads/${adId}/categories`)
}

/**
 * Adiciona uma categoria ao anúncio.
 * POST /categories/ads/:id/categories
 * @param {number} adId - ID do anúncio
 * @param {number} categoryId - ID da categoria
 * @returns {Promise<{data: object}>}
 */
export function addAdCategory(adId, categoryId) {
  return api.post(`/categories/ads/${adId}/categories`, { categoryId })
    .then(async (response) => {
      await invalidateAdCategoryCaches()
      return response
    })
}

/**
 * Remove uma categoria do anúncio.
 * DELETE /categories/ads/:id/categories/:categoryId
 * @param {number} adId - ID do anúncio
 * @param {number} categoryId - ID da categoria
 * @returns {Promise<{data: object}>}
 */
export function removeAdCategory(adId, categoryId) {
  return api.delete(`/categories/ads/${adId}/categories/${categoryId}`)
    .then(async (response) => {
      await invalidateAdCategoryCaches()
      return response
    })
}

/**
 * Atualiza o anúncio (incluindo categoryIds).
 * POST /categories/ads/:id
 * @param {number} adId - ID do anúncio
 * @param {object} payload - Dados do anúncio (name, description, categoryIds, etc.)
 * @returns {Promise<{data: object}>}
 */
export function updateAd(adId, payload) {
  return api.post(`/categories/ads/${adId}`, payload)
    .then(async (response) => {
      if (payload?.categoryIds || payload?.categoryId) {
        await invalidateAdCategoryCaches()
      }
      return response
    })
}

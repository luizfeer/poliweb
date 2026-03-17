import { api } from 'src/boot/axios'

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
}

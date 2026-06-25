export function slugify(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeSearch(value = '') {
  return slugify(value).replace(/-/g, ' ').trim()
}

export function titleFromSlug(value = '') {
  return normalizeSearch(value)
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function findCityBySlug(cities = [], slug = '') {
  const target = slugify(slug)
  return cities.find((city) => slugify(city.city) === target) || null
}

export function flattenCategories(categories = [], parent = null) {
  return (categories || []).flatMap((category) => {
    const item = {
      ...category,
      parent,
      slug: slugify(category.name)
    }

    return [
      item,
      ...flattenCategories(category.subcategories || [], item)
    ]
  })
}

export function findCategoryBySlug(categories = [], slug = '') {
  const target = slugify(slug)
  return flattenCategories(categories).find((category) => category.slug === target) || null
}

export function adUrl(ad = {}) {
  if (!ad?.id) return '/'
  const slug = slugify(ad.name)
  return slug ? `/comercio/${ad.id}/${slug}` : `/comercio/${ad.id}`
}

export function categoryCityUrl(city = {}, category = {}) {
  const citySlug = slugify(city.city || city)
  const categorySlug = slugify(category.name || category)
  return citySlug && categorySlug ? `/${citySlug}/${categorySlug}` : '/'
}

export function cityUrl(city = {}) {
  const citySlug = slugify(city.city || city)
  return citySlug ? `/${citySlug}` : '/cidades'
}

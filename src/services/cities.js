import { api } from 'boot/axios'

let cache = null
let inflight = null

export async function fetchCities ({ force = false } = {}) {
  if (cache && !force) return cache
  if (inflight) return inflight

  inflight = api.get('/address')
    .then((response) => {
      cache = response.data.addresses || []
      inflight = null
      return cache
    })
    .catch((error) => {
      inflight = null
      throw error
    })

  return inflight
}

export function invalidateCitiesCache () {
  cache = null
}

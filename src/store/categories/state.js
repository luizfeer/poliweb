function loadFromStorage() {
  if (typeof localStorage === 'undefined') return []
  try {
    const s = localStorage.getItem('categories')
    return s ? JSON.parse(s) : []
  } catch {
    return []
  }
}

export default function () {
  return {
    subCategorie: [],
    list: loadFromStorage(),
    loading: false,
  }
}
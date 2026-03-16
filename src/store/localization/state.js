export default function () {
  let current = null
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('localization')
    current = stored ? JSON.parse(stored) : null
  }
  return {
    current,
    categoriesLoading: false
  }
}

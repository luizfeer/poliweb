/**
 * Verifica se o usuário logado é superadmin (email pikazika0404@gmail.com).
 * Usado para restringir funcionalidades de anúncios apenas a esse usuário.
 */
const SUPERADMIN_EMAIL = 'pikazika0404@gmail.com'

export function isSuperAdmin() {
  if (typeof localStorage === 'undefined') return false
  try {
    const raw = localStorage.getItem('context')
    if (!raw) return false
    const context = JSON.parse(raw)
    const email = context?.email || context?.user?.email
    return email === SUPERADMIN_EMAIL
  } catch {
    return false
  }
}

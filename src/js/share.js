/**
 * Compartilha pelo share sheet do sistema e só copia o link se não houver
 * share ou se ele falhar. No app Android, navigator.share vem do polyfill
 * do app (mobile/src/nativeShellScript.ts), que abre o Share nativo.
 *
 * Retorna 'shared', 'cancelled', 'copied' ou 'failed'.
 */
export async function shareLink (data, env = defaultEnv()) {
  const nav = env.navigator
  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share(data)
      return 'shared'
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled'
    }
  }
  return (await copyText(data && data.url, env)) ? 'copied' : 'failed'
}

export async function copyText (text, env = defaultEnv()) {
  if (!text) return false
  const nav = env.navigator
  try {
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      await nav.clipboard.writeText(text)
      return true
    }
  } catch (_) {}
  const doc = env.document
  if (!doc || !doc.body) return false
  const area = doc.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  doc.body.appendChild(area)
  try {
    area.select()
    return !!doc.execCommand('copy')
  } catch (_) {
    return false
  } finally {
    doc.body.removeChild(area)
  }
}

const NOTICES = {
  shared: { color: 'positive', message: 'Compartilhado com sucesso!', icon: 'check_circle' },
  copied: { color: 'positive', message: 'Link copiado!', icon: 'check_circle' },
  failed: { color: 'negative', message: 'Não foi possível compartilhar', icon: 'error' }
}

export function shareNotice (result) {
  const notice = NOTICES[result]
  return notice ? { ...notice, position: 'bottom' } : null
}

function defaultEnv () {
  return {
    navigator: typeof navigator !== 'undefined' ? navigator : undefined,
    document: typeof document !== 'undefined' ? document : undefined
  }
}

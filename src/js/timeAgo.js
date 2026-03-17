/**
 * Retorna texto "Postado há X" em português correto (com acento em "há", plural).
 * @param {string|Date} dateStr - Data de criação (ISO string ou Date)
 * @returns {string} Ex: "Postado há 3 minutos", "Postado há 2 horas", "Postado agora"
 */
export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Postado agora'
  if (m < 60) return m === 1 ? 'Postado há 1 minuto' : `Postado há ${m} minutos`
  const h = Math.floor(m / 60)
  if (h < 24) return h === 1 ? 'Postado há 1 hora' : `Postado há ${h} horas`
  const days = Math.floor(h / 24)
  if (days < 30) return days === 1 ? 'Postado há 1 dia' : `Postado há ${days} dias`
  const mo = Math.floor(days / 30)
  return mo === 1 ? 'Postado há 1 mês' : `Postado há ${mo} meses`
}

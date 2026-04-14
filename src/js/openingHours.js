export const WEEK_DAYS = [
  { day: 'monday', label: 'Segunda' },
  { day: 'tuesday', label: 'Terça' },
  { day: 'wednesday', label: 'Quarta' },
  { day: 'thursday', label: 'Quinta' },
  { day: 'friday', label: 'Sexta' },
  { day: 'saturday', label: 'Sábado' },
  { day: 'sunday', label: 'Domingo' },
]

const DAY_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

const DAY_ALIASES = {
  seg: 'monday',
  segunda: 'monday',
  'segunda-feira': 'monday',
  monday: 'monday',
  mon: 'monday',
  ter: 'tuesday',
  terca: 'tuesday',
  'terça': 'tuesday',
  'terça-feira': 'tuesday',
  'terca-feira': 'tuesday',
  tuesday: 'tuesday',
  tue: 'tuesday',
  qua: 'wednesday',
  quarta: 'wednesday',
  'quarta-feira': 'wednesday',
  wednesday: 'wednesday',
  wed: 'wednesday',
  qui: 'thursday',
  quinta: 'thursday',
  'quinta-feira': 'thursday',
  thursday: 'thursday',
  thu: 'thursday',
  sex: 'friday',
  sexta: 'friday',
  'sexta-feira': 'friday',
  friday: 'friday',
  fri: 'friday',
  sab: 'saturday',
  sabado: 'saturday',
  sábado: 'saturday',
  saturday: 'saturday',
  sat: 'saturday',
  dom: 'sunday',
  domingo: 'sunday',
  sunday: 'sunday',
  sun: 'sunday',
}

const INDEX_DAY = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

function emptyDayConfig(day, label) {
  return {
    day,
    label,
    enabled: false,
    intervals: [{ open: '08:00', close: '18:00' }],
  }
}

function normalizeTime(value) {
  if (!value) return null
  const trimmed = String(value).trim().toLowerCase()
  const ampm = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/)
  if (ampm) {
    let hour = Number(ampm[1])
    const minute = Number(ampm[2] || '0')
    if (ampm[3] === 'pm' && hour < 12) hour += 12
    if (ampm[3] === 'am' && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?$/)
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2] || '0')
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function normalizeIntervals(intervals) {
  if (!Array.isArray(intervals) || !intervals.length) return []

  return intervals
    .map((interval) => ({
      open: normalizeTime(interval?.open),
      close: normalizeTime(interval?.close),
    }))
    .filter((interval) => interval.open && interval.close)
}

export function normalizeOpeningHours(input) {
  const defaults = WEEK_DAYS.map(({ day, label }) => emptyDayConfig(day, label))
  if (!Array.isArray(input)) return defaults

  return defaults.map((defaultDay) => {
    const found = input.find((item) => item?.day === defaultDay.day)
    if (!found) return defaultDay

    const intervals = normalizeIntervals(found.intervals)
    const enabled = Boolean(found.enabled) && intervals.length > 0

    return {
      day: defaultDay.day,
      label: defaultDay.label,
      enabled,
      intervals: enabled ? intervals : defaultDay.intervals,
    }
  })
}

function timeToMinutes(time) {
  const [hour, minute] = String(time).split(':').map(Number)
  return hour * 60 + minute
}

export function formatOpeningHours(dayConfig) {
  if (!dayConfig?.enabled || !dayConfig?.intervals?.length) return 'Fechado'
  return dayConfig.intervals.map((interval) => `${interval.open} - ${interval.close}`).join(' · ')
}

export function getOpeningStatus(openingHours, now = new Date()) {
  const normalized = normalizeOpeningHours(openingHours)
  const currentDayIndex = now.getDay()
  const currentDay = normalized.find((item) => DAY_INDEX[item.day] === currentDayIndex)
  if (!currentDay) {
    return { configured: false, isOpen: false, label: 'Horário indisponível', today: null }
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const openInterval = currentDay.enabled
    ? currentDay.intervals.find((interval) => {
        const start = timeToMinutes(interval.open)
        const end = timeToMinutes(interval.close)
        return currentMinutes >= start && currentMinutes <= end
      })
    : null
  const isOpen = Boolean(openInterval)

  const hasAnySchedule = normalized.some((item) => item.enabled && item.intervals?.length)
  const nextOpening = hasAnySchedule ? findNextOpening(normalized, now) : null

  return {
    configured: hasAnySchedule,
    isOpen,
    label: hasAnySchedule ? (isOpen ? 'Aberto agora' : 'Fechado agora') : 'Horário indisponível',
    detail: hasAnySchedule
      ? isOpen
        ? `Fecha às ${openInterval.close}`
        : nextOpening
          ? nextOpening.isTomorrow
            ? `Abre amanhã às ${nextOpening.time}`
            : `Abre ${nextOpening.dayLabel} às ${nextOpening.time}`
          : 'Sem próximo horário'
      : '',
    today: currentDay,
  }
}

function findNextOpening(openingHours, now) {
  const currentDayIndex = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (let offset = 0; offset < 7; offset++) {
    const dayIndex = (currentDayIndex + offset) % 7
    const dayKey = INDEX_DAY[dayIndex]
    const day = openingHours.find((item) => item.day === dayKey)
    if (!day?.enabled) continue

    const nextInterval = day.intervals.find((interval) => {
      if (offset > 0) return true
      return timeToMinutes(interval.open) > currentMinutes
    })

    if (!nextInterval) continue

    return {
      day,
      dayLabel: day.label,
      time: nextInterval.open,
      isTomorrow: offset === 1,
    }
  }

  return null
}

function parseIntervalsText(text) {
  const lower = text.trim().toLowerCase()
  if (!lower || /(fechado|closed)/.test(lower)) return { enabled: false, intervals: [] }
  if (/(24 horas|24h|open 24 hours|24 hours)/.test(lower)) {
    return { enabled: true, intervals: [{ open: '00:00', close: '23:59' }] }
  }

  const normalizedText = lower
    .replace(/[–—−]/g, '-')
    .replace(/\s+às\s+/g, '-')
    .replace(/\s+to\s+/g, '-')
    .replace(/\s+a\s+/g, ' - ')

  const segments = normalizedText.split(/[;,]/).map((segment) => segment.trim()).filter(Boolean)
  const intervals = []

  for (const segment of segments) {
    const match = segment.match(
      /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)[\s-]+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
    )
    if (!match) continue

    const open = normalizeTime(match[1])
    const close = normalizeTime(match[2])
    if (open && close) intervals.push({ open, close })
  }

  return {
    enabled: intervals.length > 0,
    intervals,
  }
}

function expandDayToken(token) {
  const normalized = token
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
  const compact = normalized.replace(/\./g, '')

  if (compact.includes('-')) {
    const [fromRaw, toRaw] = compact.split('-').map((value) => value.trim())
    const fromDay = DAY_ALIASES[fromRaw]
    const toDay = DAY_ALIASES[toRaw]
    if (!fromDay || !toDay) return []

    const start = DAY_INDEX[fromDay]
    const end = DAY_INDEX[toDay]
    const days = []

    for (let i = start; ; i = (i + 1) % 7) {
      days.push(INDEX_DAY[i])
      if (i === end) break
    }

    return days
  }

  const single = DAY_ALIASES[compact]
  return single ? [single] : []
}

export function parseOpeningHoursText(text) {
  const base = normalizeOpeningHours([])
  if (!text || !String(text).trim()) return base

  const lines = String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const parsed = [...base]

  lines.forEach((line) => {
    const tabMatch = line.match(/^([^\t]+)\t+(.+)$/)
    const colonMatch = line.match(/^([^:]+):\s*(.+)$/)
    const dashMatch = line.match(
      /^([A-Za-zÀ-ÿ.\-\s]+?)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[–—−-]\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?(?:\s*[;,]\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[–—−-]\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?)*)$/i
    )

    const extracted = tabMatch || colonMatch || dashMatch
    if (!extracted) return

    const dayRaw = extracted[1].trim().toLowerCase()
    const normalizedDayRaw = dayRaw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+ate\s+/g, '-')
      .replace(/\s+to\s+/g, '-')
      .replace(/\s+a\s+/g, '-')
    const dayKeys = expandDayToken(normalizedDayRaw)
    if (!dayKeys.length) return

    const scheduleText = extracted[2].trim()
    const result = parseIntervalsText(scheduleText)

    dayKeys.forEach((dayKey) => {
      const index = parsed.findIndex((item) => item.day === dayKey)
      if (index === -1) return

      parsed[index] = {
        ...parsed[index],
        enabled: result.enabled,
        intervals: result.enabled ? result.intervals : parsed[index].intervals,
      }
    })
  })

  return parsed
}

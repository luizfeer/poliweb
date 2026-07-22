export type Anchor = {
  href: string
  text: string
  html: string
}

export function extractAnchors(html: string, baseUrl: string): Anchor[] {
  const anchors: Anchor[] = []
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html)) !== null) {
    const href = match[1]
    const innerHtml = match[2]
    if (!href || innerHtml === undefined) {
      continue
    }

    anchors.push({
      href: resolveUrl(href, baseUrl),
      text: normalizeWhitespace(stripHtml(innerHtml)),
      html: match[0] ?? "",
    })
  }

  return anchors
}

export function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|tr|h1|h2|h3|h4|section|article)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

export function htmlExcerpt(html: string, maxLength = 4000): string {
  return html.replace(/\s+/g, " ").trim().slice(0, maxLength)
}

export function resolveUrl(href: string, baseUrl: string): string {
  return new URL(href, baseUrl).toString()
}

export function findDate(value: string): string | null {
  const dateMatch = value.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/)
  if (!dateMatch) {
    return null
  }

  const day = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const rawYear = Number(dateMatch[3])
  const year = rawYear < 100 ? 2000 + rawYear : rawYear

  if (!isValidDateParts(year, month, day)) {
    return null
  }

  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`
}

export function findNumberAfter(label: string, value: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = value.match(new RegExp(`${escaped}\\s*(?:n[ºo.]*)?\\s*[:\\-]?\\s*([\\w./-]+)`, "i"))
  return match?.[1] ?? null
}

export function splitIntoBlocks(html: string): string[] {
  return html
    .split(/<\/(?:article|section|li|tr|div)>/i)
    .map((block) => block.trim())
    .filter((block) => stripHtml(block).trim().length > 20)
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (year < 1990 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function decodeHtmlEntities(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
    nbsp: " ",
    ccedil: "ç",
    Ccedil: "Ç",
    atilde: "ã",
    Atilde: "Ã",
    aacute: "á",
    Aacute: "Á",
    eacute: "é",
    Eacute: "É",
    iacute: "í",
    Iacute: "Í",
    oacute: "ó",
    Oacute: "Ó",
    uacute: "ú",
    Uacute: "Ú",
  }

  return value.replace(/&(#\d+|#x[\da-f]+|[a-zA-Z]+);/g, (entity, code: string) => {
    if (code.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
    }
    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10))
    }
    return entities[code] ?? entity
  })
}

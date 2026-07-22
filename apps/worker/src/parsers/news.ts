import type { CivicNews, CivicNewsSource, SourceName } from "../types.js"
import { checksumFor } from "./checksum.js"
import { extractAnchors, htmlExcerpt, normalizeWhitespace, resolveUrl, stripHtml } from "./html.js"

const MONTHS: Record<string, number> = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12,
}

export async function parseCivicNews(
  html: string,
  scrapedAt: string,
  input: {
    sourceName: SourceName
    source: CivicNewsSource
    baseUrl: string
  },
): Promise<CivicNews[]> {
  const anchors = extractAnchors(html, input.baseUrl)
  const seen = new Set<string>()
  const items: CivicNews[] = []

  for (const anchor of anchors) {
    if (!/\/portal\/noticias\/0\/3\/\d+\//.test(anchor.href) || seen.has(anchor.href)) {
      continue
    }
    seen.add(anchor.href)

    const blockHtml = anchor.html
    const title = readClassText(blockHtml, "ntc_titulo_noticia") ?? anchor.text
    if (!title) {
      continue
    }

    const excerpt = readClassText(blockHtml, "ntc_descricao_noticia")
    const publishedAt = parsePublishedAt(blockHtml, scrapedAt)
    const thumbnailUrl = readImageUrl(blockHtml, input.baseUrl)
    const rawText = normalizeWhitespace(stripHtml(blockHtml))
    const warnings: string[] = []

    if (!excerpt) {
      warnings.push("missing_excerpt")
    }
    if (!publishedAt) {
      warnings.push("missing_published_at")
    }

    items.push({
      kind: "civic-news",
      sourceName: input.sourceName,
      source: input.source,
      sourceUrl: anchor.href,
      sourceHost: new URL(anchor.href).host,
      scrapedAt,
      publishedAt,
      title,
      excerpt,
      thumbnailUrl,
      rawText,
      rawHtmlExcerpt: htmlExcerpt(blockHtml),
      checksum: await checksumFor([anchor.href, title, excerpt ?? "", publishedAt ?? "", rawText]),
      parseConfidence: warnings.length > 0 ? 0.72 : 0.9,
      parserWarnings: warnings,
    })
  }

  return items
}

function readClassText(html: string, className: string): string | null {
  const match = html.match(new RegExp(`<[^>]+class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i"))
  const value = match?.[1] ? normalizeWhitespace(stripHtml(match[1])) : ""
  return value || null
}

function readImageUrl(html: string, baseUrl: string): string | null {
  const match = html.match(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/i)
  return match?.[1] ? resolveUrl(match[1], baseUrl) : null
}

function parsePublishedAt(html: string, scrapedAt: string): string | null {
  const text = normalizeWhitespace(stripHtml(html)).toLowerCase()
  const full = text.match(/\b(\d{1,2})\s+([a-zç]{3})\s+(\d{4})(?:\s*-\s*(\d{1,2})h(\d{2}))?/i)
  if (full?.[1] && full[2] && full[3]) {
    return toIsoDateTime(Number(full[3]), monthNumber(full[2]), Number(full[1]), Number(full[4] ?? 12), Number(full[5] ?? 0))
  }

  const compact = html.match(/<div[^>]+ntc_data_noticia_cal[^>]*>[\s\S]*?<strong>(\d{1,2})<\/strong>\s*([A-ZÇ]{3})/i)
  if (compact?.[1] && compact[2]) {
    const scraped = new Date(scrapedAt)
    return toIsoDateTime(scraped.getUTCFullYear(), monthNumber(compact[2]), Number(compact[1]), 12, 0)
  }

  return null
}

function monthNumber(value: string): number {
  const key = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .slice(0, 3)
    .toLowerCase()
  return MONTHS[key] ?? 1
}

function toIsoDateTime(year: number, month: number, day: number, hour: number, minute: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toISOString()
}

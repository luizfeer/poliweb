import type { DiaryEdition } from "../types.js"
import { checksumFor } from "./checksum.js"
import { classifyDiaryAct, hasSensitiveData } from "./classification.js"
import { findDate, findNumberAfter, htmlExcerpt, normalizeWhitespace, splitIntoBlocks, stripHtml, extractAnchors } from "./html.js"

const SOURCE_URL = "https://www.carmodorioclaro.mg.gov.br/portal/diario-oficial"

export async function parseDiaryEditions(html: string, scrapedAt: string): Promise<DiaryEdition[]> {
  const blocks = candidateBlocks(html)
  const editions: DiaryEdition[] = []

  for (const block of blocks) {
    const text = normalizeWhitespace(stripHtml(block))
    if (!looksLikeDiary(text)) {
      continue
    }

    const anchors = extractAnchors(block, SOURCE_URL)
    const primaryAnchor =
      anchors.find((anchor) => /\/portal\/diario-oficial\/ver\/\d+\/?$/i.test(anchor.href)) ??
      anchors.find((anchor) => /di[aá]rio|oficial|visualizar|detalhe|baixar|pdf/i.test(anchor.text)) ??
      anchors[0]
    const detailUrl = primaryAnchor?.href ?? SOURCE_URL
    const downloadUrl =
      findDataHref(block) ??
      anchors.find((anchor) => /\/portal\/download\/diario-oficial/i.test(anchor.href) || /\.pdf(?:$|\?)/i.test(anchor.href))?.href ??
      null
    const publishedAt = findDate(text)
    const editionNumber = findEditionNumber(text)
    const title = buildDiaryTitle(text, editionNumber, publishedAt)
    const warnings = buildWarnings({ publishedAt, editionNumber, detailUrl })
    const checksum = await checksumFor([detailUrl, title, text])

    editions.push({
      kind: "diary-edition",
      sourceName: "diario-oficial",
      sourceUrl: detailUrl,
      sourceHost: new URL(detailUrl).host,
      scrapedAt,
      publishedAt,
      title,
      rawText: text,
      rawHtmlExcerpt: htmlExcerpt(block),
      checksum,
      parseConfidence: warnings.length === 0 ? 0.84 : 0.58,
      parserWarnings: warnings,
      editionNumber,
      detailUrl,
      downloadUrl,
      pageCount: findPageCount(text),
      fileSize: findFileSize(text),
      actType: classifyDiaryAct(text),
      flaggedSuspected: hasSensitiveData(text),
    })
  }

  return dedupeBySourceUrl(editions)
}

function candidateBlocks(html: string): string[] {
  const officialAnchors = extractAnchors(html, SOURCE_URL)
    .filter((anchor) => /\/portal\/diario-oficial\/ver\/\d+\/?$/i.test(anchor.href))
    .map((anchor) => anchor.html)

  if (officialAnchors.length > 0) {
    return officialAnchors
  }

  const blocks = splitIntoBlocks(html)
  if (blocks.length > 0) {
    return blocks
  }
  return [html]
}

function looksLikeDiary(text: string): boolean {
  return /di[aá]rio|oficial|edi[cç][aã]o|postagem|publica[cç][aã]o/i.test(text) && /\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}/.test(text)
}

function findEditionNumber(text: string): string | null {
  return (
    findNumberAfter("edição", text) ??
    findNumberAfter("edicao", text) ??
    findNumberAfter("diário", text) ??
    findNumberAfter("diario", text)
  )
}

function findPageCount(text: string): number | null {
  const match = text.match(/\b(\d{1,4})\s+p[aá]ginas?\b/i)
  return match?.[1] ? Number(match[1]) : null
}

function findFileSize(text: string): string | null {
  return text.match(/\b\d+(?:[,.]\d+)?\s*(?:kb|mb|gb)\b/i)?.[0] ?? null
}

function findDataHref(html: string): string | null {
  const match = html.match(/data-href=["']([^"']+)["']/i)
  return match?.[1] ? new URL(match[1], SOURCE_URL).toString() : null
}

function buildDiaryTitle(text: string, editionNumber: string | null, publishedAt: string | null): string {
  if (editionNumber) {
    return `Diário Oficial ${editionNumber}${publishedAt ? ` - ${publishedAt}` : ""}`
  }
  const short = text.slice(0, 120).trim()
  return short || "Diário Oficial"
}

function buildWarnings(input: { publishedAt: string | null; editionNumber: string | null; detailUrl: string }): string[] {
  const warnings: string[] = []
  if (!input.publishedAt) {
    warnings.push("published_at_not_found")
  }
  if (!input.editionNumber) {
    warnings.push("edition_number_not_found")
  }
  if (input.detailUrl === SOURCE_URL) {
    warnings.push("detail_url_not_found")
  }
  return warnings
}

function dedupeBySourceUrl(items: DiaryEdition[]): DiaryEdition[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.sourceUrl
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

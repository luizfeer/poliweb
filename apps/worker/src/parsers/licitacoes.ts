import type { PublicTender } from "../types.js"
import { checksumFor } from "./checksum.js"
import { normalizeModality, normalizeTenderStatus } from "./classification.js"
import { findDate, findNumberAfter, htmlExcerpt, normalizeWhitespace, splitIntoBlocks, stripHtml, extractAnchors } from "./html.js"
import { toIsoDateTime } from "./dates.js"

const SOURCE_URL = "https://www.carmodorioclaro.mg.gov.br/portal/editais/1"

export async function parsePublicTenders(html: string, scrapedAt: string): Promise<PublicTender[]> {
  const tenders: PublicTender[] = []

  for (const block of candidateBlocks(html)) {
    const text = normalizeWhitespace(stripHtml(block))
    if (!looksLikeTender(text)) {
      continue
    }

    const anchors = extractAnchors(block, SOURCE_URL)
    const detailUrl = anchors[0]?.href ?? SOURCE_URL
    const processNumber = findNumberAfter("processo", text)
    const bidNumber = findNumberAfter("edital", text) ?? findNumberAfter("licitação", text) ?? findNumberAfter("licitacao", text)
    const postedAt = findDate(text)
    const title = buildTenderTitle(text, processNumber, bidNumber)
    const objectSummary = findObjectSummary(text)
    const warnings = buildWarnings({ detailUrl, objectSummary })
    const checksum = await checksumFor([detailUrl, title, text])

    tenders.push({
      kind: "public-tender",
      sourceName: "licitacoes",
      sourceUrl: detailUrl,
      sourceHost: new URL(detailUrl).host,
      scrapedAt,
      publishedAt: postedAt,
      title,
      rawText: text,
      rawHtmlExcerpt: htmlExcerpt(block),
      checksum,
      parseConfidence: warnings.length === 0 ? 0.8 : 0.55,
      parserWarnings: warnings,
      bidNumber,
      processNumber,
      modality: normalizeModality(text),
      status: normalizeTenderStatus(text),
      objectSummary,
      postedAt,
      openingAt: findOpeningAt(text),
      updatedAt: postedAt,
      detailUrl,
      estimatedValue: findEstimatedValue(text),
    })
  }

  return tenders
}

function candidateBlocks(html: string): string[] {
  const anchors = extractAnchors(html, SOURCE_URL)
    .filter((anchor) => /\/portal\/editais\/0\/1\/\d+\/?$/i.test(anchor.href))
    .map((anchor) => anchor.html)

  if (anchors.length > 0) {
    return dedupe(anchors)
  }

  return splitIntoBlocks(html)
}

function looksLikeTender(text: string): boolean {
  return /\b(licita[cç][aã]o|edital|preg[aã]o|processo|dispensa|concorr[eê]ncia)\b/i.test(text)
}

function buildTenderTitle(text: string, processNumber: string | null, bidNumber: string | null): string {
  if (processNumber || bidNumber) {
    return [processNumber ? `Processo ${processNumber}` : null, bidNumber ? `Edital ${bidNumber}` : null]
      .filter(Boolean)
      .join(" - ")
  }
  return text.slice(0, 140).trim() || "Licitação"
}

function findObjectSummary(text: string): string {
  const match = text.match(/\b(?:objeto|descri[cç][aã]o)[:\s-]+(.{20,350})/i)
  return normalizeWhitespace(match?.[1] ?? text.slice(0, 350))
}

function findOpeningAt(text: string): string | null {
  const openingMatch = text.match(/\b(?:abertura|sess[aã]o|entrega|realiza[cç][aã]o)[^0-9]{0,30}(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i)
  return toIsoDateTime(openingMatch?.[1] ? findDate(openingMatch[1]) : null)
}

function findEstimatedValue(text: string): number | null {
  const match = text.match(/\bR\$\s*([\d.]+,\d{2})/)
  if (!match?.[1]) {
    return null
  }
  return Number(match[1].replace(/\./g, "").replace(",", "."))
}

function buildWarnings(input: { detailUrl: string; objectSummary: string }): string[] {
  const warnings: string[] = []
  if (input.detailUrl === SOURCE_URL) warnings.push("detail_url_not_found")
  if (input.objectSummary.length < 30) warnings.push("object_summary_low_confidence")
  return warnings
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)]
}

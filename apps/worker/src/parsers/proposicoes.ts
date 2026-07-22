import type { CouncilProposition } from "../types.js"
import { checksumFor } from "./checksum.js"
import { findDate, htmlExcerpt, normalizeWhitespace, resolveUrl, stripHtml } from "./html.js"

const SOURCE_URL = "https://www.carmodorioclaro.cam.mg.gov.br/portal/proposicoes"
const DETAIL_BASE = "https://www.carmodorioclaro.cam.mg.gov.br/portal/proposicao/"

export async function parseCouncilPropositions(html: string, scrapedAt: string): Promise<CouncilProposition[]> {
  const items: CouncilProposition[] = []
  for (const block of splitPropositionBlocks(html)) {
    const item = await parsePropositionBlock(block, scrapedAt)
    if (item) {
      items.push(item)
    }
  }
  return items
}

export async function enrichCouncilProposition(
  item: CouncilProposition,
  detailHtml: string,
): Promise<CouncilProposition> {
  const detailText = normalizeWhitespace(stripHtml(detailHtml))
  const downloadUrl = readDownloadUrl(detailHtml)
  const rawText = normalizeWhitespace([item.rawText, detailText].filter(Boolean).join("\n"))
  const presentedAt = item.presentedAt ?? findDate(detailText)
  const number = item.number ?? findAfterLabel("Número", detailText)
  const situation = item.situation ?? normalizeSituation(findAfterLabel("Situação", detailText))
  const author = item.author ?? normalizeAuthor(findAfterLabel("Autor", detailText))

  return {
    ...item,
    number,
    situation,
    author,
    presentedAt,
    publishedAt: presentedAt,
    downloadUrl: downloadUrl ?? item.downloadUrl,
    rawText,
    rawHtmlExcerpt: htmlExcerpt(`${item.rawHtmlExcerpt}\n${detailHtml}`),
    checksum: await checksumFor([item.externalId, item.title, situation ?? "", author ?? "", number ?? "", rawText, downloadUrl ?? ""]),
  }
}

function splitPropositionBlocks(html: string): string[] {
  return html
    .split(/<div\s+class=["']prop_proposicao["']\s+data-id=["']/i)
    .slice(1)
    .map((part) => `<div class="prop_proposicao" data-id="${part.split(/<div\s+class=["']prop_proposicao["']\s+data-id=["']/i)[0] ?? part}`)
}

async function parsePropositionBlock(block: string, scrapedAt: string): Promise<CouncilProposition | null> {
  const idMatch = block.match(/data-id=["'](\d+)["']/i)
  const externalId = idMatch?.[1]
  if (!externalId) {
    return null
  }

  const text = normalizeWhitespace(stripHtml(block))
  const title = readClassText(block, "prop_titulo_proposicao") ?? readTitleFromText(text)
  if (!title) {
    return null
  }

  const detailUrl = `${DETAIL_BASE}${externalId}/S`
  const propositionType = readClassText(block, "prop_tipo_proposicao") ?? firstChunk(text)
  const date = findDate(text)
  const number = findAfterLabel("Número", text)
  const situation = normalizeSituation(findAfterLabel("Situação", text))
  const author = normalizeAuthor(findAfterLabel("Autor", text))
  const warnings: string[] = []

  if (!date) {
    warnings.push("missing_presented_at")
  }
  if (!number) {
    warnings.push("missing_number")
  }

  return {
    kind: "council-proposition",
    sourceName: "proposicoes-camara",
    sourceUrl: detailUrl,
    sourceHost: new URL(SOURCE_URL).host,
    scrapedAt,
    publishedAt: date,
    title,
    rawText: text,
    rawHtmlExcerpt: htmlExcerpt(block),
    checksum: await checksumFor([externalId, title, text]),
    parseConfidence: warnings.length > 0 ? 0.74 : 0.88,
    parserWarnings: warnings,
    externalId,
    propositionType,
    number,
    author,
    situation,
    presentedAt: date,
    downloadUrl: null,
  }
}

function readClassText(html: string, className: string): string | null {
  const match = html.match(new RegExp(`<[^>]+class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i"))
  const value = match?.[1] ? normalizeWhitespace(stripHtml(match[1])) : ""
  return value || null
}

function readTitleFromText(text: string): string | null {
  const withoutPrefix = text.replace(/^(?:[A-Z]{2,4}\s*-\s*)?[^0-9]{0,40}/, "").trim()
  return withoutPrefix.split(/\b(?:Situação|Número|Data|Autor)\b/i)[0]?.trim() || null
}

function firstChunk(text: string): string | null {
  return text.split(/\s{2,}|\b(?:Situação|Número|Data|Autor)\b/i)[0]?.trim() || null
}

function findAfterLabel(label: string, text: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = text.match(new RegExp(`${escaped}\\s+(.+?)(?=\\s+(?:Situa[cç][aã]o|Legislatura|N[úu]mero|Data|Autor|Vereador|Atualizado em|Download)\\b|$)`, "i"))
  const value = match?.[1]?.trim()
  return value && value !== "-" ? value : null
}

function normalizeSituation(value: string | null): string | null {
  if (!value || value === "-") {
    return null
  }
  return value
}

function normalizeAuthor(value: string | null): string | null {
  if (!value) {
    return null
  }
  return value.replace(/\s*\(Autor\)\s*$/i, "").trim()
}

function readDownloadUrl(html: string): string | null {
  const match = html.match(/href=["']([^"']*\/portal\/download\/proposicoes[^"']*)["']/i)
  return match?.[1] ? resolveUrl(match[1], SOURCE_URL) : null
}

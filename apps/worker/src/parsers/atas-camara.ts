import type { CouncilMeeting, CouncilTopicInput } from "../types.js"
import { checksumFor } from "./checksum.js"
import { findDate, findNumberAfter, htmlExcerpt, normalizeWhitespace, splitIntoBlocks, stripHtml, extractAnchors } from "./html.js"

const SOURCE_URL = "https://www.carmodorioclaro.cam.mg.gov.br/portal/sessaoplenaria"

export async function parseCouncilMeetings(html: string, scrapedAt: string): Promise<CouncilMeeting[]> {
  const meetings: CouncilMeeting[] = []

  for (const block of candidateBlocks(html)) {
    const text = normalizeWhitespace(stripHtml(block))
    if (!looksLikeMeeting(text)) {
      continue
    }

    const anchors = extractAnchors(block, SOURCE_URL)
    const detailUrl = anchors[0]?.href ?? SOURCE_URL
    const startedAt = findDate(text)
    const meetingNumber = findNumberAfter("sessão", text) ?? findNumberAfter("reunião", text)
    const meetingType = findMeetingType(text)
    const sessionLabel = buildSessionLabel(text, meetingType, meetingNumber, startedAt)
    const topics = extractTopics(text)
    const warnings = buildWarnings({ startedAt, detailUrl })
    const checksum = await checksumFor([detailUrl, text, JSON.stringify(topics)])

    meetings.push({
      kind: "council-meeting",
      sourceName: "atas-camara",
      sourceUrl: detailUrl,
      sourceHost: new URL(detailUrl).host,
      scrapedAt,
      publishedAt: startedAt,
      title: sessionLabel,
      rawText: text,
      rawHtmlExcerpt: htmlExcerpt(block),
      checksum,
      parseConfidence: warnings.length === 0 ? 0.78 : 0.52,
      parserWarnings: warnings,
      meetingType,
      meetingNumber,
      legislature: findLegislature(text),
      sessionLabel,
      startedAt,
      detailUrl,
      topics,
    })
  }

  return meetings
}

function candidateBlocks(html: string): string[] {
  const anchors = extractAnchors(html, SOURCE_URL)
    .filter((anchor) => /\/portal\/sessaoplenaria\/0\/\d+\/?$/i.test(anchor.href))
    .map((anchor) => anchor.html)

  if (anchors.length > 0) {
    return dedupe(anchors)
  }

  return splitIntoBlocks(html)
}

function looksLikeMeeting(text: string): boolean {
  return /\b(sess[aã]o|reuni[aã]o|plen[aá]ria|ordin[aá]ria|extraordin[aá]ria)\b/i.test(text)
}

function findMeetingType(text: string): string | null {
  if (/extraordin[aá]ria/i.test(text)) {
    return "extraordinaria"
  }
  if (/ordin[aá]ria/i.test(text)) {
    return "ordinaria"
  }
  if (/solene/i.test(text)) {
    return "solene"
  }
  return null
}

function findLegislature(text: string): string | null {
  return text.match(/\b\d{1,2}[ªa]\s+legislatura\b/i)?.[0] ?? null
}

function buildSessionLabel(text: string, meetingType: string | null, meetingNumber: string | null, startedAt: string | null): string {
  if (meetingType || meetingNumber || startedAt) {
    return [meetingType, meetingNumber ? `nº ${meetingNumber}` : null, startedAt].filter(Boolean).join(" ")
  }
  return text.slice(0, 120).trim() || "Sessão plenária"
}

function extractTopics(text: string): CouncilTopicInput[] {
  const topicMatches = text.match(/(?:projeto|requerimento|indica[cç][aã]o|mo[cç][aã]o)[^.]{10,220}/gi) ?? []
  return topicMatches.slice(0, 20).map((topic) => ({
    title: normalizeWhitespace(topic),
    authorCouncilor: findAuthor(topic),
    topicType: findTopicType(topic),
    summary: null,
    voteResult: findVoteResult(topic),
  }))
}

function findAuthor(text: string): string | null {
  const match = text.match(/\b(?:autor|autoria|vereador(?:a)?)[:\s-]+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÀ-ÿ\s]{2,60})/i)
  return match?.[1]?.trim() ?? null
}

function findTopicType(text: string): string | null {
  if (/projeto/i.test(text)) return "projeto_lei"
  if (/requerimento/i.test(text)) return "requerimento"
  if (/indica[cç][aã]o/i.test(text)) return "indicacao"
  if (/mo[cç][aã]o/i.test(text)) return "mocao"
  return null
}

function findVoteResult(text: string): string | null {
  if (/aprovad/i.test(text)) return "aprovado"
  if (/rejeitad/i.test(text)) return "rejeitado"
  if (/retirad/i.test(text)) return "retirado"
  return null
}

function buildWarnings(input: { startedAt: string | null; detailUrl: string }): string[] {
  const warnings: string[] = []
  if (!input.startedAt) warnings.push("started_at_not_found")
  if (input.detailUrl === SOURCE_URL) warnings.push("detail_url_not_found")
  return warnings
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)]
}

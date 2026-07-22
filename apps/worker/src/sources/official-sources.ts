import type { ScrapedItem } from "../types.js"
import { parseCouncilMeetings } from "../parsers/atas-camara.js"
import { parseDiaryEditions } from "../parsers/diario-oficial.js"
import { parsePublicTenders } from "../parsers/licitacoes.js"
import { parseCivicNews } from "../parsers/news.js"
import { enrichCouncilProposition, parseCouncilPropositions } from "../parsers/proposicoes.js"
import { fetchText } from "../runtime/http.js"

export type SourceFetchOptions = {
  timeoutMs: number
  maxRetries: number
}

export async function scrapeDiarySource(options: SourceFetchOptions): Promise<ScrapedItem[]> {
  const scrapedAt = new Date().toISOString()
  const html = await fetchText("https://www.carmodorioclaro.mg.gov.br/portal/diario-oficial", options)
  return parseDiaryEditions(html, scrapedAt)
}

export async function scrapeCouncilSource(options: SourceFetchOptions): Promise<ScrapedItem[]> {
  const scrapedAt = new Date().toISOString()
  const html = await fetchText("https://www.carmodorioclaro.cam.mg.gov.br/portal/sessaoplenaria", options)
  return parseCouncilMeetings(html, scrapedAt)
}

export async function scrapeTenderSource(options: SourceFetchOptions): Promise<ScrapedItem[]> {
  const scrapedAt = new Date().toISOString()
  const html = await fetchText("https://www.carmodorioclaro.mg.gov.br/portal/editais/1", options)
  return parsePublicTenders(html, scrapedAt)
}

export async function scrapeCouncilNewsSource(options: SourceFetchOptions): Promise<ScrapedItem[]> {
  const scrapedAt = new Date().toISOString()
  const url = "https://www.carmodorioclaro.cam.mg.gov.br/portal/noticias"
  const html = await fetchText(url, options)
  return await parseCivicNews(html, scrapedAt, {
    sourceName: "noticias-camara",
    source: "council",
    baseUrl: url,
  })
}

export async function scrapeCityHallNewsSource(options: SourceFetchOptions): Promise<ScrapedItem[]> {
  const scrapedAt = new Date().toISOString()
  const url = "https://www.carmodorioclaro.mg.gov.br/portal/noticias"
  const html = await fetchText(url, options)
  return await parseCivicNews(html, scrapedAt, {
    sourceName: "noticias-prefeitura",
    source: "city_hall",
    baseUrl: url,
  })
}

export async function scrapeCouncilPropositionsSource(options: SourceFetchOptions): Promise<ScrapedItem[]> {
  const scrapedAt = new Date().toISOString()
  const html = await fetchText("https://www.carmodorioclaro.cam.mg.gov.br/portal/proposicoes", options)
  const propositions = await parseCouncilPropositions(html, scrapedAt)

  const enriched = await Promise.all(
    propositions.slice(0, 50).map(async (item) => {
      try {
        const detailHtml = await fetchText(item.sourceUrl, options)
        return await enrichCouncilProposition(item, detailHtml)
      } catch {
        return {
          ...item,
          parserWarnings: [...item.parserWarnings, "detail_fetch_failed"],
          parseConfidence: Math.min(item.parseConfidence, 0.7),
        }
      }
    }),
  )

  return enriched
}

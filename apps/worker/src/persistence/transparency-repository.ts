import type {
  City,
  CivicNews,
  CouncilMeeting,
  CouncilProposition,
  DiaryEdition,
  JobCounters,
  JsonValue,
  PublicTender,
  ScrapedItem,
} from "../types.js"
import { todayDate } from "../parsers/dates.js"
import { PostgrestClient } from "./postgrest.js"

type OfficialDiaryRow = {
  id: string
  source_url: string | null
  processed: boolean | null
}

type DiaryActRow = {
  id: string
  raw_text: string | null
  source_references: JsonValue | null
}

type CouncilMeetingRow = {
  id: string
}

type PublicTenderRow = {
  id: string
  raw_text: string | null
}

type CivicNewsRow = {
  id: string
  checksum: string
}

type CouncilPropositionRow = {
  id: string
  checksum: string
}

export class TransparencyRepository {
  constructor(private readonly db: PostgrestClient) {}

  async saveItems(city: City, items: ScrapedItem[], counters: JobCounters): Promise<void> {
    for (const item of items) {
      counters.processed += 1
      try {
        if (item.kind === "diary-edition") {
          await this.saveDiaryEdition(city, item, counters)
        } else if (item.kind === "council-meeting") {
          await this.saveCouncilMeeting(city, item, counters)
        } else if (item.kind === "public-tender") {
          await this.savePublicTender(city, item, counters)
        } else if (item.kind === "civic-news") {
          await this.saveCivicNews(city, item, counters)
        } else {
          await this.saveCouncilProposition(city, item, counters)
        }
      } catch (error) {
        counters.errors.push(error instanceof Error ? error.message : String(error))
      }
    }
  }

  private async saveDiaryEdition(city: City, item: DiaryEdition, counters: JobCounters): Promise<void> {
    const existingBySource = await this.db.selectRows<OfficialDiaryRow>(
      "official_diaries",
      { city_id: city.id, source_url: item.sourceUrl },
      "id,source_url,processed",
    )

    const date = item.publishedAt ?? todayDate()
    const number = item.editionNumber ?? item.checksum.slice(0, 12)
    const diary =
      existingBySource[0] ??
      (
        await this.db.insertRows<OfficialDiaryRow>("official_diaries", [
          {
            city_id: city.id,
            date,
            number,
            source_url: item.sourceUrl,
            pages: item.pageCount,
            processed: false,
          },
        ])
      )[0]

    if (!diary) {
      throw new Error(`Failed to persist diary ${item.sourceUrl}`)
    }

    const existingActs = await this.db.selectRows<DiaryActRow>(
      "diary_acts",
      { diary_id: diary.id, title: item.title },
      "id,raw_text,source_references",
    )
    const existingAct = existingActs[0]
    const metadata = this.itemMetadata(item)

    if (!existingAct) {
      await this.db.insertRows("diary_acts", [
        {
          diary_id: diary.id,
          act_type: item.actType,
          number: item.editionNumber,
          title: item.title,
          raw_text: item.rawText,
          source_references: [metadata],
          importance: item.flaggedSuspected ? "high" : "normal",
        },
      ])
      counters.inserted += 1
      return
    }

    if (hasChecksum(existingAct.source_references, item.checksum)) {
      counters.skipped += 1
      return
    }

    await this.db.updateRows("diary_acts", { id: existingAct.id }, {
      act_type: item.actType,
      raw_text: item.rawText,
      source_references: [metadata],
      importance: item.flaggedSuspected ? "high" : "normal",
    })
    counters.updated += 1
  }

  private async saveCouncilMeeting(city: City, item: CouncilMeeting, counters: JobCounters): Promise<void> {
    const existing = await this.db.selectRows<CouncilMeetingRow>(
      "council_meetings",
      { city_id: city.id, source_url: item.sourceUrl },
      "id",
    )

    if (existing[0]) {
      counters.skipped += 1
      return
    }

    const rows = await this.db.insertRows<CouncilMeetingRow>("council_meetings", [
      {
        city_id: city.id,
        date: item.startedAt ?? item.publishedAt ?? todayDate(),
        session_type: item.meetingType,
        source_url: item.sourceUrl,
        processed: false,
      },
    ])
    const meeting = rows[0]
    if (!meeting) {
      throw new Error(`Failed to persist council meeting ${item.sourceUrl}`)
    }

    if (item.topics.length > 0) {
      await this.db.insertRows(
        "council_topics",
        item.topics.map((topic) => ({
          meeting_id: meeting.id,
          author_councilor: topic.authorCouncilor,
          title: topic.title,
          topic_type: topic.topicType,
          summary_ai: topic.summary,
          vote_result: topic.voteResult,
        })),
      )
    }
    counters.inserted += 1
  }

  private async savePublicTender(city: City, item: PublicTender, counters: JobCounters): Promise<void> {
    const existing = await this.db.selectRows<PublicTenderRow>(
      "public_tenders",
      { city_id: city.id, source_url: item.sourceUrl },
      "id,raw_text",
    )
    const current = existing[0]

    if (current?.raw_text === item.rawText) {
      counters.skipped += 1
      return
    }

    const payload = {
      city_id: city.id,
      number: item.processNumber ?? item.bidNumber,
      title: item.title,
      modality: item.modality,
      estimated_value: item.estimatedValue,
      deadline: item.openingAt,
      status: item.status,
      source_url: item.sourceUrl,
      raw_text: item.rawText,
    }

    if (!current) {
      await this.db.insertRows("public_tenders", [payload])
      counters.inserted += 1
      return
    }

    await this.db.updateRows("public_tenders", { id: current.id }, payload)
    counters.updated += 1
  }

  private async saveCivicNews(city: City, item: CivicNews, counters: JobCounters): Promise<void> {
    const existing = await this.db.selectRows<CivicNewsRow>(
      "civic_news",
      { city_id: city.id, source_url: item.sourceUrl },
      "id,checksum",
    )
    const current = existing[0]

    if (current?.checksum === item.checksum) {
      counters.skipped += 1
      return
    }

    const payload = {
      city_id: city.id,
      source: item.source,
      title: item.title,
      excerpt: item.excerpt,
      raw_text: item.rawText,
      source_url: item.sourceUrl,
      source_host: item.sourceHost,
      thumbnail_url: item.thumbnailUrl,
      published_at: item.publishedAt,
      scraped_at: item.scrapedAt,
      raw_html_excerpt: item.rawHtmlExcerpt,
      checksum: item.checksum,
      parse_confidence: item.parseConfidence,
      parser_warnings: item.parserWarnings,
    }

    if (!current) {
      await this.db.insertRows("civic_news", [payload])
      counters.inserted += 1
      return
    }

    await this.db.updateRows("civic_news", { id: current.id }, payload)
    counters.updated += 1
  }

  private async saveCouncilProposition(city: City, item: CouncilProposition, counters: JobCounters): Promise<void> {
    const existing = await this.db.selectRows<CouncilPropositionRow>(
      "council_propositions",
      { city_id: city.id, external_id: item.externalId },
      "id,checksum",
    )
    const current = existing[0]

    if (current?.checksum === item.checksum) {
      counters.skipped += 1
      return
    }

    const payload = {
      city_id: city.id,
      external_id: item.externalId,
      proposition_type: item.propositionType,
      number: item.number,
      title: item.title,
      author: item.author,
      situation: item.situation,
      presented_at: item.presentedAt,
      raw_text: item.rawText,
      source_url: item.sourceUrl,
      source_host: item.sourceHost,
      download_url: item.downloadUrl,
      scraped_at: item.scrapedAt,
      raw_html_excerpt: item.rawHtmlExcerpt,
      checksum: item.checksum,
      parse_confidence: item.parseConfidence,
      parser_warnings: item.parserWarnings,
    }

    if (!current) {
      await this.db.insertRows("council_propositions", [payload])
      counters.inserted += 1
      return
    }

    await this.db.updateRows("council_propositions", { id: current.id }, payload)
    counters.updated += 1
  }

  private itemMetadata(item: ScrapedItem): JsonValue {
    return {
      source_url: item.sourceUrl,
      source_host: item.sourceHost,
      scraped_at: item.scrapedAt,
      published_at: item.publishedAt,
      raw_html_excerpt: item.rawHtmlExcerpt,
      checksum: item.checksum,
      parse_confidence: item.parseConfidence,
      parser_warnings: item.parserWarnings,
      kind: item.kind,
    }
  }
}

function hasChecksum(value: JsonValue | null, checksum: string): boolean {
  if (!Array.isArray(value)) {
    return false
  }
  return value.some((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return false
    }
    return entry["checksum"] === checksum
  })
}

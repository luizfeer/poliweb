import type { JsonValue } from "../types.js"

export type IndexableEntityType =
  | "business"
  | "accommodation"
  | "restaurant"
  | "fishing_guide"
  | "event"
  | "classified"
  | "property"
  | "attraction"
  | "tour_package"
  | "emergency_contact"
  | "health_facility"
  | "site_page"
  | "faq"

export type IndexingQueueItem = {
  id: string
  entity_type: IndexableEntityType
  entity_id: string
  city_id: string
  operation: "upsert" | "delete"
  attempts: number
}

export type ContentRecord = Record<string, JsonValue | undefined>

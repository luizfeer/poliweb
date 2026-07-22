import type { PostgrestClient } from "../persistence/postgrest.js"
import type { ContentRecord, IndexableEntityType } from "./types.js"
import type { JsonValue } from "../types.js"

const SELECT_BY_TYPE: Record<IndexableEntityType, string> = {
  faq: "id,city_id,question,answer,is_active",
  business:
    "id,city_id,slug,name,short_description,description,address,cep,amenities,payment_methods,attributes,status,districts(name)",
  accommodation:
    "id,city_id,slug,name,type,short_description,description,address,amenities,attributes,near_lake,has_marina,price_min,price_max,status,districts(name)",
  restaurant:
    "id,city_id,slug,name,description,cuisine,price_range,address,delivery,attributes,status,districts(name)",
  fishing_guide:
    "id,city_id,slug,full_name,about,services,price_range,has_boat,verified,status",
  event:
    "id,city_id,slug,title,description,start_at,end_at,location,address,organizer_name,is_free,status,event_categories(name)",
  classified:
    "id,city_id,slug,type,title,description,price,is_negotiable,category_label,status,review_status,expires_at",
  property:
    "id,city_id,slug,title,description,listing_type,property_type,price,rent_price,address_street,bedrooms,bathrooms,area_total_m2,area_useful_m2,status,districts(name)",
  attraction:
    "id,city_id,slug,name,type,description,address,hours_legacy_text,entry_fee,difficulty,duration_minutes,best_season,attributes,status",
  tour_package:
    "id,city_id,slug,title,description,duration_hours,price,includes,status",
  emergency_contact:
    "id,city_id,category,name,phone,whatsapp,short_dial,email,address,description,when_to_use,hours_legacy_text,source_type,tags,needs_verification,note,active",
  health_facility:
    "id,city_id,slug,name,type,neighborhood,address,phone,secondary_phone,whatsapp,hours_legacy_text,services,requirements,source_type,tags,needs_verification,note,active",
  site_page:
    "id,city_id,page_key,title,subtitle,description,url,module_key,keywords,content,active",
}

const TABLE_BY_TYPE: Record<IndexableEntityType, string> = {
  faq: "city_faqs",
  business: "businesses",
  accommodation: "accommodations",
  restaurant: "restaurants",
  fishing_guide: "fishing_guides",
  event: "events",
  classified: "classifieds",
  property: "properties",
  attraction: "attractions",
  tour_package: "tour_packages",
  emergency_contact: "emergency_contacts",
  health_facility: "health_facilities",
  site_page: "site_pages",
}

export async function fetchContent(
  db: PostgrestClient,
  entityType: IndexableEntityType,
  entityId: string,
): Promise<ContentRecord | null> {
  const rows = await db.selectRows<ContentRecord>(
    TABLE_BY_TYPE[entityType],
    { id: entityId },
    SELECT_BY_TYPE[entityType],
  )
  const content = rows[0] ?? null
  if (!content || !isPublicContent(entityType, content)) {
    return null
  }

  if (!isEntityWithRelations(entityType)) {
    return content
  }

  const [services, faqs] = await Promise.all([
    db.selectRows<ContentRecord>(
      "entity_services",
      { entity_type: entityType, entity_id: entityId, active: true },
      "name,description,requirements",
    ),
    db.selectRows<ContentRecord>(
      "entity_faqs",
      { entity_type: entityType, entity_id: entityId, active: true },
      "question,answer",
    ),
  ])

  return {
    ...content,
    entity_services: toJsonArray(services),
    entity_faqs: toJsonArray(faqs),
  }
}

function isPublicContent(entityType: IndexableEntityType, content: ContentRecord): boolean {
  if (entityType === "faq") {
    return content["is_active"] === true
  }

  if (entityType === "emergency_contact") {
    return content["active"] === true
  }

  if (entityType === "health_facility") {
    return content["active"] === true
  }

  if (entityType === "site_page") {
    return content["active"] === true
  }

  if (entityType === "classified") {
    const expiresAt = text(content["expires_at"])
    const isExpired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false
    return content["status"] === "published" && content["review_status"] === "approved" && !isExpired
  }

  return ["active", "approved", "published"].includes(text(content["status"]) ?? "")
}

function text(value: JsonValue | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function isEntityWithRelations(entityType: IndexableEntityType): boolean {
  return ["business", "accommodation", "restaurant", "attraction"].includes(entityType)
}

function toJsonArray(rows: ContentRecord[]): JsonValue[] {
  return rows.map((row) => {
    const output: Record<string, JsonValue> = {}
    for (const [key, value] of Object.entries(row)) {
      if (value !== undefined) {
        output[key] = value
      }
    }
    return output
  })
}

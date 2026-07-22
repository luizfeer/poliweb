import type { PostgrestClient } from "../persistence/postgrest.js"

type ExistingEmbedding = {
  id: string
  content_hash: string | null
}

export async function deleteEmbedding(
  db: PostgrestClient,
  input: { entityType: string; entityId: string; cityId: string },
): Promise<void> {
  await db.deleteRows("embeddings", {
    entity_type: input.entityType,
    entity_id: input.entityId,
    city_id: input.cityId,
  })
}

export async function upsertEmbedding(
  db: PostgrestClient,
  input: {
    entityType: string
    entityId: string
    cityId: string
    content: string
    contentHash: string
    embedding: number[]
  },
): Promise<"inserted" | "updated" | "skipped"> {
  const existing = await db.selectRows<ExistingEmbedding>(
    "embeddings",
    {
      entity_type: input.entityType,
      entity_id: input.entityId,
      city_id: input.cityId,
    },
    "id,content_hash",
  )

  const current = existing[0]
  if (current?.content_hash === input.contentHash) {
    await db.updateRows("embeddings", { id: current.id }, { indexed_at: new Date().toISOString() })
    return "skipped"
  }

  await db.upsertRows(
    "embeddings",
    [
      {
        city_id: input.cityId,
        entity_type: input.entityType,
        entity_id: input.entityId,
        content: input.content.slice(0, 2000),
        content_hash: input.contentHash,
        indexed_at: new Date().toISOString(),
        embedding: input.embedding,
      },
    ],
    "entity_type,entity_id,city_id",
  )

  return current ? "updated" : "inserted"
}

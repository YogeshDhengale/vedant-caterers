import type { Collection } from "mongodb"

import { mongoConfigured } from "@/lib/mongodb"

/** Persist content without `new Date()` (blocked during Next.js prerender). */
export async function upsertWithServerTimestamp<T extends { _id: string }>(
  collection: Collection<T>,
  body: Omit<T, "updatedAt">,
) {
  if (!mongoConfigured()) return

  const filter = { _id: body._id } as Parameters<Collection<T>["replaceOne"]>[0]
  await collection.replaceOne(filter, { ...body } as T, { upsert: true })
}
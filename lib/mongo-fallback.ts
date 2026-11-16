import { mongoConfigured } from "@/lib/mongodb"

/** Read Mongo first; if empty or unreachable, use CSV and optionally seed Mongo. */
export async function readWithMongoFallback<T>(
  readMongo: () => Promise<T>,
  readCsv: () => Promise<T>,
  isEmpty: (value: T) => boolean,
  seedMongo?: (value: T) => Promise<void>
): Promise<T> {
  if (!mongoConfigured()) return readCsv()

  try {
    const fromMongo = await readMongo()
    if (!isEmpty(fromMongo)) return fromMongo
  } catch {
    return readCsv()
  }

  const fromCsv = await readCsv()
  if (!isEmpty(fromCsv) && seedMongo) {
    try {
      await seedMongo(fromCsv)
    } catch {
      // Seeding is best-effort; still serve CSV data.
    }
  }
  return fromCsv
}
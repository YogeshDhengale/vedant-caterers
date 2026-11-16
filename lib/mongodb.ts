import { type Db, MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI?.trim()

declare global {
  // eslint-disable-next-line no-var
  var _vedantMongoClient: Promise<MongoClient> | undefined
}

export function mongoConfigured() {
  return Boolean(uri)
}

export function mongoDbName() {
  return process.env.MONGODB_DB_NAME?.trim() || "vedant_caterers"
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!uri) throw new Error("MONGODB_URI is not set.")
  if (!global._vedantMongoClient) {
    global._vedantMongoClient = new MongoClient(uri).connect()
  }
  return global._vedantMongoClient
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient()
  return client.db(mongoDbName())
}

export const contentCollection = "content"
export const galleryMediaCollection = "gallery_media"
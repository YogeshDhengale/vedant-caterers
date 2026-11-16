/**
 * One-time import from public/data/*.csv and public/gallery/* into MongoDB.
 * Requires MONGODB_URI (and optional MONGODB_DB_NAME) in .env.local.
 *
 * Usage: node scripts/migrate-content-to-mongodb.mjs
 */
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { Binary, MongoClient } from "mongodb"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")

async function loadEnvLocal() {
  try {
    const source = await readFile(path.join(root, ".env.local"), "utf8")
    for (const line of source.split("\n")) {
      const match = /^([^#=]+)=(.*)$/.exec(line.trim())
      if (!match) continue
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, "")
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
  }
}

function parseCsv(source) {
  const rows = []
  let row = []
  let field = ""
  let quoted = false
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
      continue
    }
    if (char === ",") {
      row.push(field)
      field = ""
      continue
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1
      row.push(field)
      if (row.some((cell) => cell.trim())) rows.push(row)
      row = []
      field = ""
      continue
    }
    field += char
  }
  if (field.length || row.length) {
    row.push(field)
    if (row.some((cell) => cell.trim())) rows.push(row)
  }
  return rows
}

function numberOr(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function localizedRow(row, start) {
  return { en: row[start] ?? "", hi: "", mr: row[start + 1] ?? row[start + 2] ?? "" }
}

function menuText(row, start) {
  return { en: row[start] ?? "", hi: row[start + 1] ?? "", mr: row[start + 2] ?? "" }
}

function contentTypeFromName(file) {
  const lower = file.toLowerCase()
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".gif")) return "image/gif"
  return "image/jpeg"
}

async function readMenuCsv() {
  const source = await readFile(path.join(root, "public", "data", "menu.csv"), "utf8")
  const categories = []
  const items = []
  for (const row of parseCsv(source)) {
    if (row[0] === "type") continue
    if (row[0] === "category") {
      categories.push({
        id: row[1] ?? "",
        sort: numberOr(row[3], categories.length + 1),
        name: menuText(row, 4),
      })
    }
    if (row[0] === "item") {
      items.push({
        id: row[1] ?? "",
        categoryId: row[2] ?? "",
        sort: numberOr(row[3], items.length + 1),
        name: menuText(row, 4),
        description: menuText(row, 7),
      })
    }
  }
  categories.sort((a, b) => a.sort - b.sort)
  items.sort((a, b) => a.sort - b.sort)
  return { categories, items }
}

async function readTestimonialsCsv() {
  const source = await readFile(path.join(root, "public", "data", "testimonials.csv"), "utf8")
  const items = []
  for (const row of parseCsv(source)) {
    if (row[0] === "id" && row[1] === "sort") continue
    if (!row[0]?.trim()) continue
    items.push({
      id: row[0],
      sort: numberOr(row[1], items.length + 1),
      quote: localizedRow(row, 2),
      name: localizedRow(row, 4),
      detail: localizedRow(row, 6),
    })
  }
  items.sort((a, b) => a.sort - b.sort)
  return items
}

async function readGalleryCsv() {
  const source = await readFile(path.join(root, "public", "data", "gallery.csv"), "utf8")
  const categories = []
  const loosePhotos = []
  for (const row of parseCsv(source)) {
    if (row[0] === "type") continue
    if (row[0] === "category") {
      categories.push({
        id: row[1] ?? "",
        sort: numberOr(row[3], categories.length + 1),
        title: localizedRow(row, 4),
        description: localizedRow(row, 6),
        photos: [],
      })
    }
    if (row[0] === "photo") {
      loosePhotos.push({
        id: row[1] ?? "",
        categoryId: row[2] ?? "",
        sort: numberOr(row[3], loosePhotos.length + 1),
        file: row[8] ?? "",
        caption: localizedRow(row, 9),
        wide: row[11] === "1" || row[11]?.toLowerCase() === "true",
      })
    }
  }
  categories.sort((a, b) => a.sort - b.sort)
  for (const photo of loosePhotos.sort((a, b) => a.sort - b.sort)) {
    const category = categories.find((entry) => entry.id === photo.categoryId)
    if (category) category.photos.push(photo)
  }
  return categories
}

await loadEnvLocal()

const uri = process.env.MONGODB_URI?.trim()
if (!uri) {
  console.error("Set MONGODB_URI in .env.local before running this script.")
  process.exit(1)
}

const dbName = process.env.MONGODB_DB_NAME?.trim() || "vedant_caterers"
const client = new MongoClient(uri)
await client.connect()
const db = client.db(dbName)

const menu = await readMenuCsv()
await db.collection("content").replaceOne(
  { _id: "menu" },
  { _id: "menu", ...menu, updatedAt: new Date() },
  { upsert: true }
)
console.log("Migrated menu:", menu.categories.length, "categories,", menu.items.length, "items")

const testimonials = await readTestimonialsCsv()
await db.collection("content").replaceOne(
  { _id: "testimonials" },
  { _id: "testimonials", items: testimonials, updatedAt: new Date() },
  { upsert: true }
)
console.log("Migrated testimonials:", testimonials.length)

const categories = await readGalleryCsv()
let mediaCount = 0
for (const category of categories) {
  for (const photo of category.photos) {
  const relative = photo.file.replace(/^\/+/, "")
  if (!relative.startsWith("gallery/")) continue
  try {
    const bytes = await readFile(path.join(root, "public", relative))
    await db.collection("gallery_media").replaceOne(
      { _id: photo.id },
      {
        _id: photo.id,
        contentType: contentTypeFromName(relative),
        filename: path.basename(relative),
        data: new Binary(bytes),
        updatedAt: new Date(),
      },
      { upsert: true }
    )
    photo.file = `api/gallery/media/${photo.id}`
    mediaCount += 1
  } catch (error) {
    console.warn("Skipped missing image for photo", photo.id, relative, error?.message ?? error)
    photo.file = ""
  }
  }
}

await db.collection("content").replaceOne(
  { _id: "gallery" },
  { _id: "gallery", categories, updatedAt: new Date() },
  { upsert: true }
)
console.log("Migrated gallery:", categories.length, "categories,", mediaCount, "images")

await client.close()
console.log("Done.")
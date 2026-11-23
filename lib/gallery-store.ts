import { randomUUID } from "node:crypto"
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

import { dataCsvPath } from "@/lib/data-path"
import {
  contentTypeFromExtension,
  deleteGalleryMedia,
  galleryMediaUrlPrefix,
  mediaIdFromFile,
  writeGalleryMedia,
} from "@/lib/gallery-media"
import { parseCsv, serializeCsv } from "@/lib/menu-csv"
import type { LocalizedText } from "@/lib/menu-text"
import { readWithMongoFallback } from "@/lib/mongo-fallback"
import type { GalleryContentDoc } from "@/lib/mongo-documents"
import { upsertWithServerTimestamp } from "@/lib/mongo-timestamps"
import { contentCollection, getDb, mongoConfigured } from "@/lib/mongodb"

const csvPath = dataCsvPath("gallery.csv")
export const galleryPublicDir = path.join(process.cwd(), "public", "gallery")
export const galleryUrlPrefix = "/gallery"

const header = [
  "type",
  "id",
  "category_id",
  "sort",
  "title_en",
  "title_mr",
  "description_en",
  "description_mr",
  "file",
  "caption_en",
  "caption_mr",
  "wide",
] as const

export type GalleryPhoto = {
  id: string
  categoryId: string
  sort: number
  file: string
  caption: LocalizedText
  wide: boolean
}

export type GalleryCategory = {
  id: string
  sort: number
  title: LocalizedText
  description: LocalizedText
  photos: GalleryPhoto[]
}

export type GalleryData = {
  categories: GalleryCategory[]
}

export type GalleryCategoryInput = {
  title: Pick<LocalizedText, "en" | "mr">
  description: Pick<LocalizedText, "en" | "mr">
  sort?: number
}

export type GalleryPhotoInput = {
  categoryId: string
  file: string
  caption: Pick<LocalizedText, "en" | "mr">
  wide?: boolean
  sort?: number
}

const TITLE_LIMIT = 120
const DESCRIPTION_LIMIT = 400
const CAPTION_LIMIT = 400

let writeQueue: Promise<unknown> = Promise.resolve()

export class GalleryError extends Error {}

export async function readGallery(): Promise<GalleryData> {
  return readWithMongoFallback(
    readGalleryFromMongo,
    readGalleryFromCsv,
    (data) => data.categories.length === 0,
    saveGalleryDocument
  )
}

async function saveGalleryDocument(data: GalleryData) {
  if (!mongoConfigured()) return
  const db = await getDb()
  await upsertWithServerTimestamp(db.collection<GalleryContentDoc>(contentCollection), {
    _id: "gallery",
    categories: data.categories,
  })
}

async function readGalleryFromMongo(): Promise<GalleryData> {
  const db = await getDb()
  const doc = await db.collection<GalleryContentDoc>(contentCollection).findOne({ _id: "gallery" })
  const categories = [...(doc?.categories ?? [])].sort(bySort)
  for (const category of categories) {
    category.photos = [...category.photos].sort(bySort)
  }
  return { categories }
}

async function readGalleryFromCsv(): Promise<GalleryData> {
  let source = ""
  try {
    source = await readFile(csvPath, "utf8")
  } catch (error) {
    if (isMissingFile(error)) return { categories: [] }
    throw error
  }

  const categories: GalleryCategory[] = []
  const photos: GalleryPhoto[] = []

  for (const row of parseCsv(source)) {
    if (row[0] === "type") continue
    if (row[0] === "category") {
      categories.push({
        id: row[1] ?? "",
        sort: numberOr(row[3], categories.length + 1),
        title: localizedPair(row, 4),
        description: localizedPair(row, 6),
        photos: [],
      })
    }
    if (row[0] === "photo") {
      photos.push({
        id: row[1] ?? "",
        categoryId: row[2] ?? "",
        sort: numberOr(row[3], photos.length + 1),
        file: row[8] ?? "",
        caption: localizedPair(row, 9),
        wide: row[11] === "1" || row[11]?.toLowerCase() === "true",
      })
    }
  }

  categories.sort(bySort)
  for (const photo of photos.sort(bySort)) {
    const category = categories.find((entry) => entry.id === photo.categoryId)
    if (category) category.photos.push(photo)
  }

  return { categories }
}

export async function addGalleryCategory(input: GalleryCategoryInput) {
  const title = cleanTitle(input.title)
  const description = cleanDescription(input.description)
  return updateGallery((data) => {
    const category: GalleryCategory = {
      id: randomUUID(),
      sort: input.sort ?? nextSort(data.categories),
      title: toLocalizedText(title),
      description: toLocalizedText(description),
      photos: [],
    }
    data.categories.push(category)
    return category
  })
}

export async function updateGalleryCategory(id: string, input: GalleryCategoryInput) {
  const title = cleanTitle(input.title)
  const description = cleanDescription(input.description)
  return updateGallery((data) => {
    const category = data.categories.find((entry) => entry.id === id)
    if (!category) throw new GalleryError("Gallery category was not found.")
    category.title = toLocalizedText(title)
    category.description = toLocalizedText(description)
    if (input.sort !== undefined) category.sort = input.sort
    return category
  })
}

export async function deleteGalleryCategory(id: string) {
  await updateGallery((data) => {
    const index = data.categories.findIndex((entry) => entry.id === id)
    if (index === -1) throw new GalleryError("Gallery category was not found.")
    const photos = data.categories[index]?.photos ?? []
    data.categories.splice(index, 1)
    return photos.map((photo) => photo.file).filter(Boolean)
  }).then(async (files) => {
    await Promise.all(files.map((file) => removeGalleryFile(file)))
  })
}

export async function addGalleryPhoto(input: GalleryPhotoInput) {
  if (!input.file.trim()) throw new GalleryError("Upload an image.")
  const file = normalizeGalleryFile(input.file)
  const caption = cleanCaption(input.caption)
  return updateGallery((data) => {
    const category = data.categories.find((entry) => entry.id === input.categoryId)
    if (!category) throw new GalleryError("Choose a category that exists.")
    const photo: GalleryPhoto = {
      id: randomUUID(),
      categoryId: input.categoryId,
      sort: input.sort ?? nextSort(category.photos),
      file,
      caption: toLocalizedText(caption),
      wide: input.wide ?? false,
    }
    category.photos.push(photo)
    return photo
  })
}

export async function updateGalleryPhoto(id: string, input: GalleryPhotoInput) {
  const file = input.file.trim() ? normalizeGalleryFile(input.file) : ""
  const caption = cleanCaption(input.caption)
  return updateGallery((data) => {
    let photo: GalleryPhoto | undefined
    let sourceCategory: GalleryCategory | undefined
    for (const category of data.categories) {
      const found = category.photos.find((entry) => entry.id === id)
      if (found) {
        photo = found
        sourceCategory = category
        break
      }
    }
    if (!photo) throw new GalleryError("Gallery photo was not found.")

    const targetCategory = data.categories.find((entry) => entry.id === input.categoryId)
    if (!targetCategory) throw new GalleryError("Choose a category that exists.")

    const previousFile = photo.file
    const nextFile = file || previousFile
    if (!nextFile) throw new GalleryError("Upload an image or keep the existing file.")

    if (sourceCategory && sourceCategory.id !== targetCategory.id) {
      sourceCategory.photos = sourceCategory.photos.filter((entry) => entry.id !== id)
      targetCategory.photos.push(photo)
    }

    photo.categoryId = input.categoryId
    photo.file = nextFile
    photo.caption = toLocalizedText(caption)
    photo.wide = input.wide ?? false
    if (input.sort !== undefined) photo.sort = input.sort
    targetCategory.photos.sort(bySort)
    if (previousFile && previousFile !== nextFile) void removeGalleryFile(previousFile)
    return photo
  })
}

export async function deleteGalleryPhoto(id: string) {
  const file = await updateGallery((data) => {
    for (const category of data.categories) {
      const index = category.photos.findIndex((entry) => entry.id === id)
      if (index !== -1) {
        const [removed] = category.photos.splice(index, 1)
        return removed?.file ?? ""
      }
    }
    throw new GalleryError("Gallery photo was not found.")
  })
  if (file) await removeGalleryFile(file)
}

export function normalizeGalleryFile(file: string) {
  const trimmed = file.trim()
  if (!trimmed) return ""
  const normalized = trimmed.replace(/^\/+/, "")
  if (normalized.startsWith(`${galleryMediaUrlPrefix}/`)) {
    if (normalized.includes("..")) throw new GalleryError("Invalid image path.")
    return normalized
  }
  if (mongoConfigured()) {
    throw new GalleryError("Upload an image through the gallery admin.")
  }
  if (!normalized.startsWith("gallery/")) {
    throw new GalleryError("Image path must be under gallery/.")
  }
  if (normalized.includes("..")) throw new GalleryError("Invalid image path.")
  return normalized
}

export async function saveGalleryUpload(name: string, bytes: Buffer) {
  const extension = safeExtension(name)
  if (!extension) throw new GalleryError("Use a JPG, PNG, WebP, or GIF image.")
  if (bytes.byteLength > 5 * 1024 * 1024) throw new GalleryError("Image must be 5 MB or smaller.")

  const id = randomUUID()
  if (mongoConfigured()) {
    await writeGalleryMedia(id, bytes, contentTypeFromExtension(extension), name)
    return `${galleryMediaUrlPrefix}/${id}`
  }

  await mkdir(galleryPublicDir, { recursive: true })
  const relative = `gallery/${id}.${extension}`
  await writeFile(path.join(process.cwd(), "public", relative), bytes)
  return relative
}

export async function removeGalleryFile(relative: string) {
  const mediaId = mediaIdFromFile(relative)
  if (mediaId) {
    await deleteGalleryMedia(mediaId)
    return
  }

  const normalized = relative.trim().replace(/^\/+/, "")
  if (!normalized.startsWith("gallery/") || normalized.includes("..")) return

  const absolute = path.join(process.cwd(), "public", normalized)
  try {
    await unlink(absolute)
  } catch (error) {
    if (!isMissingFile(error)) throw error
  }
}

async function updateGallery<T>(change: (data: GalleryData) => T): Promise<T> {
  const run = writeQueue.then(async () => {
    const data = await readGallery()
    const result = change(data)
    await writeGallery(data)
    return result
  })
  writeQueue = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

async function writeGallery(data: GalleryData) {
  if (mongoConfigured()) {
    await saveGalleryDocument(data)
    return
  }

  const rows: string[][] = [Array.from(header)]
  const categories = [...data.categories].sort(bySort)
  for (const category of categories) {
    rows.push([
      "category",
      category.id,
      "",
      String(category.sort),
      category.title.en,
      category.title.mr,
      category.description.en,
      category.description.mr,
      "",
      "",
      "",
      "",
    ])
    for (const photo of [...category.photos].sort(bySort)) {
      rows.push([
        "photo",
        photo.id,
        photo.categoryId,
        String(photo.sort),
        "",
        "",
        "",
        "",
        photo.file,
        photo.caption.en,
        photo.caption.mr,
        photo.wide ? "1" : "0",
      ])
    }
  }

  try {
    await mkdir(path.dirname(csvPath), { recursive: true })
    await writeFile(csvPath, serializeCsv(rows), "utf8")
  } catch (error) {
    if (isNotWritable(error)) {
      throw new GalleryError(
        "Could not write gallery.csv. On serverless hosts, edit public/data locally and redeploy."
      )
    }
    throw error
  }
}

function localizedPair(row: string[], start: number): LocalizedText {
  return {
    en: row[start] ?? "",
    hi: "",
    mr: row[start + 1] ?? "",
  }
}

function toLocalizedText(text: Pick<LocalizedText, "en" | "mr">): LocalizedText {
  return { en: text.en, hi: "", mr: text.mr }
}

function cleanTitle(text: Pick<LocalizedText, "en" | "mr">) {
  const cleaned = trimEnMr(text, TITLE_LIMIT)
  if (!cleaned.en) throw new GalleryError("English title is required.")
  return cleaned
}

function cleanDescription(text: Pick<LocalizedText, "en" | "mr">) {
  const cleaned = trimEnMr(text, DESCRIPTION_LIMIT)
  if (!cleaned.en) throw new GalleryError("English description is required.")
  return cleaned
}

function cleanCaption(text: Pick<LocalizedText, "en" | "mr">) {
  return trimEnMr(text, CAPTION_LIMIT)
}

function trimEnMr(text: Pick<LocalizedText, "en" | "mr">, limit: number) {
  return {
    en: text.en.trim().slice(0, limit),
    mr: text.mr.trim().slice(0, limit),
  }
}

function safeExtension(name: string) {
  const match = name.toLowerCase().match(/\.(jpe?g|png|webp|gif)$/)
  if (!match) return null
  if (match[1] === "jpeg") return "jpg"
  return match[1] ?? null
}

function nextSort(entries: { sort: number }[]) {
  return entries.reduce((highest, entry) => Math.max(highest, entry.sort), 0) + 1
}

function numberOr(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function bySort<T extends { sort: number }>(left: T, right: T) {
  return left.sort - right.sort
}

function isMissingFile(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}

function isNotWritable(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return false
  const code = error.code
  return code === "EACCES" || code === "EROFS" || code === "EPERM" || code === "ENOTSUP"
}
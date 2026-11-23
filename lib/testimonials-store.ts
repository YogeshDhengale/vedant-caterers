import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { dataCsvPath } from "@/lib/data-path"
import { parseCsv, serializeCsv } from "@/lib/menu-csv"
import type { LocalizedText } from "@/lib/menu-text"
import { readWithMongoFallback } from "@/lib/mongo-fallback"
import type { TestimonialsContentDoc } from "@/lib/mongo-documents"
import { upsertWithServerTimestamp } from "@/lib/mongo-timestamps"
import { contentCollection, getDb, mongoConfigured } from "@/lib/mongodb"

const filePath = dataCsvPath("testimonials.csv")

const header = [
  "id",
  "sort",
  "quote_en",
  "quote_mr",
  "name_en",
  "name_mr",
  "detail_en",
  "detail_mr",
] as const

export type Testimonial = {
  id: string
  sort: number
  quote: LocalizedText
  name: LocalizedText
  detail: LocalizedText
}

export type TestimonialInput = {
  quote: Pick<LocalizedText, "en" | "mr">
  name: Pick<LocalizedText, "en" | "mr">
  detail: Pick<LocalizedText, "en" | "mr">
  sort?: number
}

const QUOTE_LIMIT = 500
const SHORT_LIMIT = 120

let writeQueue: Promise<unknown> = Promise.resolve()

export class TestimonialError extends Error {}

export async function readTestimonials(): Promise<Testimonial[]> {
  return readWithMongoFallback(
    readTestimonialsFromMongo,
    readTestimonialsFromCsv,
    (items) => items.length === 0,
    saveTestimonialsDocument
  )
}

async function saveTestimonialsDocument(items: Testimonial[]) {
  if (!mongoConfigured()) return
  const db = await getDb()
  await upsertWithServerTimestamp(db.collection<TestimonialsContentDoc>(contentCollection), {
    _id: "testimonials",
    items,
  })
}

async function readTestimonialsFromMongo(): Promise<Testimonial[]> {
  const db = await getDb()
  const doc = await db.collection<TestimonialsContentDoc>(contentCollection).findOne({ _id: "testimonials" })
  const items = [...(doc?.items ?? [])].sort(bySort)
  return items
}

async function readTestimonialsFromCsv(): Promise<Testimonial[]> {
  let source = ""
  try {
    source = await readFile(filePath, "utf8")
  } catch (error) {
    if (isMissingFile(error)) return []
    throw error
  }

  const items: Testimonial[] = []

  for (const row of parseCsv(source)) {
    if (row[0] === "id" && row[1] === "sort") continue
    if (!row[0]?.trim()) continue
    items.push({
      id: row[0],
      sort: numberOr(row[1], items.length + 1),
      quote: localizedPair(row, 2),
      name: localizedPair(row, 4),
      detail: localizedPair(row, 6),
    })
  }

  items.sort(bySort)
  return items
}

export async function addTestimonial(input: TestimonialInput) {
  const quote = cleanQuote(input.quote)
  const name = cleanShort(input.name, "English name is required.")
  const detail = cleanShort(input.detail, "English event detail is required.")
  return updateFile((items) => {
    const testimonial: Testimonial = {
      id: randomUUID(),
      sort: input.sort ?? nextSort(items),
      quote: toLocalizedText(quote),
      name: toLocalizedText(name),
      detail: toLocalizedText(detail),
    }
    items.push(testimonial)
    return testimonial
  })
}

export async function updateTestimonial(id: string, input: TestimonialInput) {
  const quote = cleanQuote(input.quote)
  const name = cleanShort(input.name, "English name is required.")
  const detail = cleanShort(input.detail, "English event detail is required.")
  return updateFile((items) => {
    const testimonial = items.find((entry) => entry.id === id)
    if (!testimonial) throw new TestimonialError("Testimonial was not found.")
    testimonial.quote = toLocalizedText(quote)
    testimonial.name = toLocalizedText(name)
    testimonial.detail = toLocalizedText(detail)
    if (input.sort !== undefined) testimonial.sort = input.sort
    return testimonial
  })
}

export async function deleteTestimonial(id: string) {
  return updateFile((items) => {
    const index = items.findIndex((entry) => entry.id === id)
    if (index === -1) throw new TestimonialError("Testimonial was not found.")
    items.splice(index, 1)
  })
}

async function updateFile<T>(change: (items: Testimonial[]) => T): Promise<T> {
  const run = writeQueue.then(async () => {
    const items = await readTestimonials()
    const result = change(items)
    await writeTestimonials(items)
    return result
  })
  writeQueue = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

async function writeTestimonials(items: Testimonial[]) {
  if (mongoConfigured()) {
    await saveTestimonialsDocument(items)
    return
  }

  const rows: string[][] = [Array.from(header)]
  for (const item of [...items].sort(bySort)) {
    rows.push([
      item.id,
      String(item.sort),
      item.quote.en,
      item.quote.mr,
      item.name.en,
      item.name.mr,
      item.detail.en,
      item.detail.mr,
    ])
  }

  try {
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, serializeCsv(rows), "utf8")
  } catch (error) {
    if (isNotWritable(error)) {
      throw new TestimonialError(
        "Could not write testimonials.csv. On serverless hosts, edit public/data locally and redeploy."
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

function cleanQuote(text: Pick<LocalizedText, "en" | "mr">) {
  const cleaned = trimEnMr(text, QUOTE_LIMIT)
  if (!cleaned.en) throw new TestimonialError("English quote is required.")
  return cleaned
}

function cleanShort(text: Pick<LocalizedText, "en" | "mr">, message: string) {
  const cleaned = trimEnMr(text, SHORT_LIMIT)
  if (!cleaned.en) throw new TestimonialError(message)
  return cleaned
}

function trimEnMr(text: Pick<LocalizedText, "en" | "mr">, limit: number) {
  return {
    en: text.en.trim().slice(0, limit),
    mr: text.mr.trim().slice(0, limit),
  }
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

function isNotWritable(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return false
  const code = error.code
  return code === "EACCES" || code === "EROFS" || code === "EPERM" || code === "ENOTSUP"
}

function isMissingFile(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
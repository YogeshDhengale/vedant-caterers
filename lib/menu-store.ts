import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { dataCsvPath } from "@/lib/data-path"
import { parseCsv, serializeCsv } from "@/lib/menu-csv"
import { localized, type LocalizedText } from "@/lib/menu-text"
import { readWithMongoFallback } from "@/lib/mongo-fallback"
import { contentCollection, getDb, mongoConfigured } from "@/lib/mongodb"
import type { MenuContentDoc } from "@/lib/mongo-documents"

export { localized }
export type { LocalizedText }

const filePath = dataCsvPath("menu.csv")

const header = [
  "type",
  "id",
  "category_id",
  "sort",
  "name_en",
  "name_hi",
  "name_mr",
  "description_en",
  "description_hi",
  "description_mr",
] as const

export type MenuCategory = {
  id: string
  sort: number
  name: LocalizedText
}

export type MenuItem = {
  id: string
  categoryId: string
  sort: number
  name: LocalizedText
  description: LocalizedText
}

export type MenuData = {
  categories: MenuCategory[]
  items: MenuItem[]
}

export type CategoryInput = {
  name: LocalizedText
  sort?: number
}

export type ItemInput = {
  categoryId: string
  name: LocalizedText
  description: LocalizedText
  sort?: number
}

const NAME_LIMIT = 120
const DESCRIPTION_LIMIT = 400

let writeQueue: Promise<unknown> = Promise.resolve()

export async function readMenu(): Promise<MenuData> {
  return readWithMongoFallback(
    readMenuFromMongo,
    readMenuFromCsv,
    (menu) => menu.categories.length === 0 && menu.items.length === 0,
    saveMenuDocument
  )
}

async function saveMenuDocument(menu: MenuData) {
  if (!mongoConfigured()) return
  const db = await getDb()
  const document: MenuContentDoc = {
    _id: "menu",
    categories: menu.categories,
    items: menu.items,
    updatedAt: new Date(),
  }
  await db.collection<MenuContentDoc>(contentCollection).replaceOne({ _id: "menu" }, document, { upsert: true })
}

async function readMenuFromMongo(): Promise<MenuData> {
  const db = await getDb()
  const doc = await db.collection<MenuContentDoc>(contentCollection).findOne({ _id: "menu" })
  if (!doc) return { categories: [], items: [] }
  const categories = [...(doc.categories ?? [])].sort(bySort)
  const items = [...(doc.items ?? [])].sort(bySort)
  return { categories, items }
}

async function readMenuFromCsv(): Promise<MenuData> {
  let source = ""
  try {
    source = await readFile(filePath, "utf8")
  } catch (error) {
    if (isMissingFile(error)) return { categories: [], items: [] }
    throw error
  }

  const categories: MenuCategory[] = []
  const items: MenuItem[] = []

  for (const row of parseCsv(source)) {
    if (row[0] === "type") continue
    if (row[0] === "category") {
      categories.push({
        id: row[1] ?? "",
        sort: numberOr(row[3], categories.length + 1),
        name: textFields(row, 4),
      })
    }
    if (row[0] === "item") {
      items.push({
        id: row[1] ?? "",
        categoryId: row[2] ?? "",
        sort: numberOr(row[3], items.length + 1),
        name: textFields(row, 4),
        description: textFields(row, 7),
      })
    }
  }

  categories.sort(bySort)
  items.sort(bySort)
  return { categories, items }
}

export async function addCategory(input: CategoryInput) {
  const name = cleanName(input.name)
  return updateMenu((menu) => {
    const category: MenuCategory = {
      id: randomUUID(),
      sort: input.sort ?? nextSort(menu.categories),
      name,
    }
    menu.categories.push(category)
    return category
  })
}

export async function updateCategory(id: string, input: CategoryInput) {
  const name = cleanName(input.name)
  return updateMenu((menu) => {
    const category = menu.categories.find((entry) => entry.id === id)
    if (!category) throw new MenuError("Category was not found.")
    category.name = name
    if (input.sort !== undefined) category.sort = input.sort
    return category
  })
}

export async function deleteCategory(id: string) {
  return updateMenu((menu) => {
    const exists = menu.categories.some((entry) => entry.id === id)
    if (!exists) throw new MenuError("Category was not found.")
    menu.categories = menu.categories.filter((entry) => entry.id !== id)
    menu.items = menu.items.filter((entry) => entry.categoryId !== id)
  })
}

export async function addItem(input: ItemInput) {
  const name = cleanName(input.name)
  const description = cleanDescription(input.description)
  return updateMenu((menu) => {
    if (!menu.categories.some((entry) => entry.id === input.categoryId)) {
      throw new MenuError("Choose a category that exists.")
    }
    const item: MenuItem = {
      id: randomUUID(),
      categoryId: input.categoryId,
      sort: input.sort ?? nextSort(menu.items.filter((entry) => entry.categoryId === input.categoryId)),
      name,
      description,
    }
    menu.items.push(item)
    return item
  })
}

export async function updateItem(id: string, input: ItemInput) {
  const name = cleanName(input.name)
  const description = cleanDescription(input.description)
  return updateMenu((menu) => {
    const item = menu.items.find((entry) => entry.id === id)
    if (!item) throw new MenuError("Menu item was not found.")
    if (!menu.categories.some((entry) => entry.id === input.categoryId)) {
      throw new MenuError("Choose a category that exists.")
    }
    item.categoryId = input.categoryId
    item.name = name
    item.description = description
    if (input.sort !== undefined) item.sort = input.sort
    return item
  })
}

export async function deleteItem(id: string) {
  return updateMenu((menu) => {
    const exists = menu.items.some((entry) => entry.id === id)
    if (!exists) throw new MenuError("Menu item was not found.")
    menu.items = menu.items.filter((entry) => entry.id !== id)
  })
}

export class MenuError extends Error {}

async function updateMenu<T>(change: (menu: MenuData) => T): Promise<T> {
  const run = writeQueue.then(async () => {
    const menu = await readMenu()
    const result = change(menu)
    await writeMenu(menu)
    return result
  })
  writeQueue = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

async function writeMenu(menu: MenuData) {
  if (mongoConfigured()) {
    await saveMenuDocument(menu)
    return
  }

  const rows: string[][] = [Array.from(header)]
  for (const category of [...menu.categories].sort(bySort)) {
    rows.push([
      "category",
      category.id,
      "",
      String(category.sort),
      category.name.en,
      category.name.hi,
      category.name.mr,
      "",
      "",
      "",
    ])
  }
  for (const item of [...menu.items].sort(bySort)) {
    rows.push([
      "item",
      item.id,
      item.categoryId,
      String(item.sort),
      item.name.en,
      item.name.hi,
      item.name.mr,
      item.description.en,
      item.description.hi,
      item.description.mr,
    ])
  }

  try {
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, serializeCsv(rows), "utf8")
  } catch (error) {
    if (isNotWritable(error)) {
      throw new MenuError(
        "Could not write menu data. Set MONGODB_URI for serverless hosting or use a writable filesystem for CSV files."
      )
    }
    throw error
  }
}

function textFields(row: string[], start: number): LocalizedText {
  return {
    en: row[start] ?? "",
    hi: row[start + 1] ?? "",
    mr: row[start + 2] ?? "",
  }
}

function cleanName(name: LocalizedText): LocalizedText {
  const cleaned = trimText(name, NAME_LIMIT)
  if (!cleaned.en) throw new MenuError("English name is required.")
  return cleaned
}

function cleanDescription(description: LocalizedText) {
  return trimText(description, DESCRIPTION_LIMIT)
}

function trimText(text: LocalizedText, limit: number): LocalizedText {
  return {
    en: text.en.trim().slice(0, limit),
    hi: text.hi.trim().slice(0, limit),
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

function isMissingFile(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}

function isNotWritable(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return false
  const code = error.code
  return code === "EACCES" || code === "EROFS" || code === "EPERM" || code === "ENOTSUP"
}

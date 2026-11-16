import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const source = await import(path.join(root, "content/dictionaries/en.ts"))

const categories = source.dictionary.gallery.categories
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
]

function escape(value) {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

const rows = [header]
categories.forEach((category, categoryIndex) => {
  const categoryId = `gal-cat-${String(categoryIndex + 1).padStart(3, "0")}`
  rows.push([
    "category",
    categoryId,
    "",
    String(categoryIndex + 1),
    category.title,
    "",
    category.description,
    "",
    "",
    "",
    "",
    "",
  ])
  category.photos.forEach((photo, photoIndex) => {
    rows.push([
      "photo",
      `gal-ph-${categoryId}-${String(photoIndex + 1).padStart(2, "0")}`,
      categoryId,
      String(photoIndex + 1),
      "",
      "",
      "",
      "",
      "",
      photo.caption,
      "",
      photo.wide ? "1" : "0",
    ])
  })
})

const csv = `${rows.map((row) => row.map(escape).join(",")).join("\n")}\n`
const target = path.join(root, "data", "gallery.csv")
await mkdir(path.dirname(target), { recursive: true })
await writeFile(target, csv, "utf8")
console.log("Wrote", target, "rows", rows.length)
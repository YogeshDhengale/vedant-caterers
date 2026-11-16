import { readFile } from "node:fs/promises"
import path from "node:path"

import "regenerator-runtime/runtime"
import fontkit from "@pdf-lib/fontkit"
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"

import type { Locale } from "@/lib/i18n"
import { menuSections } from "@/lib/menu-sections"
import type { MenuData } from "@/lib/menu-store"
import { localized } from "@/lib/menu-text"

const cream = rgb(0.925, 0.906, 0.882)
const menuCream = rgb(0.98, 0.957, 0.922)
const green = rgb(0.145, 0.275, 0.196)
const itemsPerPage = 12
const rowBaselines = [652.3, 617.7, 580.7, 541.2, 505.5, 469.7, 432.7, 398.1, 363.6, 326.6, 292.0, 255.0]

export type ProgramPdfItem = {
  name: string
  section: string
  quantity: number
}

export type ProgramPdfLine = ProgramPdfItem & {
  key?: string
  kind?: "package" | "dish"
}

const mixedPageTitle = "SELECTED MENU"

export type ProgramPdfDetails = {
  name: string
  phone: string
  venue: string
  date: string
  locale?: Locale
  items: ProgramPdfItem[]
}

type PdfFonts = {
  latin: PDFFont
  latinBold: PDFFont
  indic?: PDFFont
}

const devanagariRe = /[\u0900-\u097F]/

export async function buildProgramPdf(details: ProgramPdfDetails) {
  const [fillerBytes, menuBytes] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "filler-pages.pdf")),
    readFile(path.join(process.cwd(), "public", "menu-page.pdf")),
  ])
  const filler = await PDFDocument.load(fillerBytes)
  const menu = await PDFDocument.load(menuBytes)
  const output = await PDFDocument.create()
  output.registerFontkit(fontkit)
  const fonts = await loadFonts(output, details.locale)

  const [welcome, cover, service, closing] = await output.copyPages(filler, [0, 1, 2, 3])
  paintCover(cover, details, fonts)
  output.addPage(welcome)
  output.addPage(cover)

  for (const page of menuPages(details.items)) {
    const [sheet] = await output.copyPages(menu, [0])
    paintMenuPage(sheet, page.title, page.items, fonts)
    output.addPage(sheet)
  }

  output.addPage(service)
  output.addPage(closing)
  output.setTitle("Vedant Caterers program menu")
  return output.save()
}

export function expandProgramLines(
  lines: ProgramPdfLine[],
  menu: MenuData,
  locale: Locale = "en"
): ProgramPdfItem[] {
  const expanded: ProgramPdfItem[] = []
  for (const line of lines) {
    if (line.kind === "package" && line.key?.startsWith("package:")) {
      const categoryId = line.key.slice("package:".length)
      const dishes = menu.items
        .filter((item) => item.categoryId === categoryId)
        .sort((left, right) => left.sort - right.sort)
      if (dishes.length === 0) {
        expanded.push({ name: line.name, section: line.section, quantity: line.quantity })
        continue
      }
      for (let copy = 0; copy < line.quantity; copy += 1) {
        for (const dish of dishes) {
          expanded.push({
            name: localized(dish.name, locale),
            section: line.section,
            quantity: 1,
          })
        }
      }
      continue
    }
    if (line.kind === "dish" && line.key?.startsWith("dish:")) {
      const itemId = line.key.slice("dish:".length)
      const dish = menu.items.find((item) => item.id === itemId)
      expanded.push({
        name: dish ? localized(dish.name, locale) : line.name,
        section: line.section,
        quantity: line.quantity,
      })
      continue
    }
    expanded.push({ name: line.name, section: line.section, quantity: line.quantity })
  }
  return expanded
}

async function loadFonts(output: PDFDocument, locale?: Locale): Promise<PdfFonts> {
  const latin = await output.embedFont(StandardFonts.TimesRoman)
  const latinBold = await output.embedFont(StandardFonts.TimesRomanBold)
  if (locale !== "mr" && locale !== "hi") {
    return { latin, latinBold }
  }

  const bytes = await readFile(path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Regular.ttf"))
  const indic = await output.embedFont(bytes, { subset: true })
  return { latin, latinBold, indic }
}

function menuPages(items: ProgramPdfItem[]) {
  const grouped = new Map<string, string[]>()
  for (const item of items) {
    const section = item.section.trim() || "Menu"
    const label = item.quantity > 1 ? `${item.name} x ${item.quantity}` : item.name
    const list = grouped.get(section) ?? []
    list.push(label)
    grouped.set(section, list)
  }

  const orderedSections = [
    ...menuSections.filter((section) => grouped.has(section)),
    ...[...grouped.keys()].filter((section) => !menuSections.includes(section as (typeof menuSections)[number])),
  ]

  const flat: Array<{ section: string; label: string }> = []
  for (const section of orderedSections) {
    for (const label of grouped.get(section) ?? []) {
      flat.push({ section, label })
    }
  }

  const pages: Array<{ title: string; items: string[] }> = []
  for (let index = 0; index < flat.length; index += itemsPerPage) {
    const slice = flat.slice(index, index + itemsPerPage)
    const sections = new Set(slice.map((entry) => entry.section))
    const title =
      sections.size === 1 ? (slice[0]?.section ?? "Menu").toUpperCase() : mixedPageTitle
    pages.push({ title, items: slice.map((entry) => entry.label) })
  }
  return pages
}

function paintCover(page: PDFPage, details: ProgramPdfDetails, fonts: PdfFonts) {
  cover(page, 100, 598, 420, 78)
  cover(page, 170, 522, 280, 72)
  const [first, second] = nameLines(details.name, fonts)
  drawCentered(page, first, 614, 42, fonts, 400, "bold")
  if (second) drawCentered(page, second, 548, 42, fonts, 400, "bold")

  replaceValue(page, 245, 299.7, details.name, fonts)
  replaceValue(page, 245, 268.9, details.phone, fonts)
  replaceValue(page, 245, 234.7, details.venue, fonts)
  replaceValue(page, 244, 209.5, displayDate(details.date), fonts)
}

function paintMenuPage(page: PDFPage, title: string, items: string[], fonts: PdfFonts) {
  cover(page, 70, 730, 460, 62, menuCream)
  drawCentered(page, title, 750, 28, fonts, 420)

  rowBaselines.forEach((baseline, index) => {
    const item = items[index]
    if (!item) {
      cover(page, 450, baseline - 4, 100, 18, menuCream)
      return
    }
    drawLeft(page, 72, baseline, item, fonts, 340, 12)
  })
}

function replaceValue(page: PDFPage, x: number, y: number, value: string, fonts: PdfFonts) {
  cover(page, x - 2, y - 3, 220, 18)
  drawLeft(page, x, y, value, fonts, 280, 13)
}

function drawCentered(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  fonts: PdfFonts,
  maxWidth: number,
  weight: "regular" | "bold" = "regular"
) {
  const raw = text.trim()
  if (!raw) return
  const font = pickFont(raw, fonts, weight)
  const encoded = encodeForFont(raw, font, fonts)
  const fitted = fitText(font, encoded, maxWidth, size)
  const width = font.widthOfTextAtSize(fitted.text, fitted.size)
  page.drawText(fitted.text, {
    x: (page.getWidth() - width) / 2,
    y,
    size: fitted.size,
    font,
    color: green,
  })
}

function drawLeft(page: PDFPage, x: number, y: number, value: string, fonts: PdfFonts, maxWidth: number, size: number) {
  const raw = value.trim()
  if (!raw) return
  const font = pickFont(raw, fonts)
  const encoded = encodeForFont(raw, font, fonts)
  const fitted = fitText(font, encoded, maxWidth, size)
  page.drawText(fitted.text, { x, y, size: fitted.size, font, color: green })
}

function pickFont(text: string, fonts: PdfFonts, weight: "regular" | "bold" = "regular") {
  if (fonts.indic && devanagariRe.test(text)) return fonts.indic
  return weight === "bold" ? fonts.latinBold : fonts.latin
}

function encodeForFont(text: string, font: PDFFont, fonts: PdfFonts) {
  if (fonts.indic && font === fonts.indic) return text.replace(/\s+/g, " ").trim()
  return winAnsi(text)
}

function cover(page: PDFPage, x: number, y: number, width: number, height: number, color = cream) {
  page.drawRectangle({ x, y, width, height, color, borderWidth: 0 })
}

function nameLines(name: string, fonts: PdfFonts) {
  const useIndic = Boolean(fonts.indic && devanagariRe.test(name))
  const normalized = useIndic ? name.trim().replace(/\s+/g, " ") : winAnsi(name)
  const words = (useIndic ? normalized : normalized.toUpperCase()).split(/\s+/).filter(Boolean)
  if (words.length <= 1) return [words[0] ?? "", ""]
  return [words.slice(0, -1).join(" "), words.at(-1) ?? ""]
}

function displayDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return value.trim()
  return `${match[3]}/${match[2]}/${match[1]}`
}

function fitText(font: PDFFont, text: string, maxWidth: number, size: number) {
  let current = size
  while (current > 8 && font.widthOfTextAtSize(text, current) > maxWidth) current -= 0.5
  if (font.widthOfTextAtSize(text, current) <= maxWidth) return { text, size: current }

  let clipped = text
  while (clipped.length > 1 && font.widthOfTextAtSize(`${clipped}...`, current) > maxWidth) {
    clipped = clipped.slice(0, -1)
  }
  return { text: `${clipped}...`, size: current }
}

function winAnsi(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

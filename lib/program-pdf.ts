import { readFile } from "node:fs/promises"
import path from "node:path"

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"

import { menuSections } from "@/lib/menu-sections"
import type { MenuData } from "@/lib/menu-store"

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
  items: ProgramPdfItem[]
}

export async function buildProgramPdf(details: ProgramPdfDetails) {
  const [fillerBytes, menuBytes] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "filler-pages.pdf")),
    readFile(path.join(process.cwd(), "public", "menu-page.pdf")),
  ])
  const filler = await PDFDocument.load(fillerBytes)
  const menu = await PDFDocument.load(menuBytes)
  const output = await PDFDocument.create()
  const roman = await output.embedFont(StandardFonts.TimesRoman)
  const romanBold = await output.embedFont(StandardFonts.TimesRomanBold)

  const [welcome, cover, service, closing] = await output.copyPages(filler, [0, 1, 2, 3])
  paintCover(cover, details, roman, romanBold)
  output.addPage(welcome)
  output.addPage(cover)

  for (const page of menuPages(details.items)) {
    const [sheet] = await output.copyPages(menu, [0])
    paintMenuPage(sheet, page.title, page.items, roman)
    output.addPage(sheet)
  }

  output.addPage(service)
  output.addPage(closing)
  output.setTitle("Vedant Caterers program menu")
  return output.save()
}

export function expandProgramLines(lines: ProgramPdfLine[], menu: MenuData): ProgramPdfItem[] {
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
          expanded.push({ name: dish.name.en, section: line.section, quantity: 1 })
        }
      }
      continue
    }
    expanded.push({ name: line.name, section: line.section, quantity: line.quantity })
  }
  return expanded
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

function paintCover(page: PDFPage, details: ProgramPdfDetails, roman: PDFFont, romanBold: PDFFont) {
  cover(page, 100, 598, 420, 78)
  cover(page, 170, 522, 280, 72)
  const [first, second] = nameLines(details.name)
  drawCentered(page, first, 614, 42, romanBold, 400)
  if (second) drawCentered(page, second, 548, 42, romanBold, 400)

  replaceValue(page, 245, 299.7, details.name, roman)
  replaceValue(page, 245, 268.9, details.phone, roman)
  replaceValue(page, 245, 234.7, details.venue, roman)
  replaceValue(page, 244, 209.5, displayDate(details.date), roman)
}

function paintMenuPage(page: PDFPage, title: string, items: string[], roman: PDFFont) {
  cover(page, 70, 730, 460, 62, menuCream)
  drawCentered(page, title, 750, 28, roman, 420)

  rowBaselines.forEach((baseline, index) => {
    const item = items[index]
    if (!item) {
      cover(page, 450, baseline - 4, 100, 18, menuCream)
      return
    }
    const fitted = fitText(roman, winAnsi(item), 340, 12)
    page.drawText(fitted.text, {
      x: 72,
      y: baseline,
      size: fitted.size,
      font: roman,
      color: green,
    })
  })
}

function replaceValue(page: PDFPage, x: number, y: number, value: string, font: PDFFont) {
  cover(page, x - 2, y - 3, 220, 18)
  const text = winAnsi(value.trim())
  if (!text) return
  const fitted = fitText(font, text, 280, 13)
  page.drawText(fitted.text, { x, y, size: fitted.size, font, color: green })
}

function drawCentered(page: PDFPage, text: string, y: number, size: number, font: PDFFont, maxWidth: number) {
  const fitted = fitText(font, winAnsi(text), maxWidth, size)
  const width = font.widthOfTextAtSize(fitted.text, fitted.size)
  page.drawText(fitted.text, {
    x: (page.getWidth() - width) / 2,
    y,
    size: fitted.size,
    font,
    color: green,
  })
}

function cover(page: PDFPage, x: number, y: number, width: number, height: number, color = cream) {
  page.drawRectangle({ x, y, width, height, color, borderWidth: 0 })
}

function nameLines(name: string) {
  const words = winAnsi(name).toUpperCase().split(/\s+/).filter(Boolean)
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

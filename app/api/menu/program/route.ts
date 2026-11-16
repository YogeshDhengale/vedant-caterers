import { hasLocale, type Locale } from "@/lib/i18n"
import { readMenu } from "@/lib/menu-store"
import { buildProgramPdf, expandProgramLines, type ProgramPdfLine } from "@/lib/program-pdf"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = parseDetails(body)
  if (!parsed) {
    return Response.json({ ok: false, errors: ["Name, phone, and at least one dish are required."] }, { status: 400 })
  }

  const menu = await readMenu()
  const items = expandProgramLines(parsed.lines, menu, parsed.locale)
  const pdf = await buildProgramPdf({
    name: parsed.name,
    phone: parsed.phone,
    venue: parsed.venue,
    date: parsed.date,
    locale: parsed.locale,
    items,
  })
  return new Response(Buffer.from(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="vedant-program-menu.pdf"',
      "cache-control": "no-store",
    },
  })
}

function parseDetails(body: unknown) {
  if (!body || typeof body !== "object") return null
  const record = body as Record<string, unknown>
  const name = text(record.name, 120)
  const phone = text(record.phone, 40)
  const venue = text(record.venue, 160)
  const date = text(record.date, 20)
  const localeValue = text(record.locale, 8)
  const locale: Locale = hasLocale(localeValue) ? localeValue : "en"
  if (!name || phone.replace(/\D/g, "").length < 8) return null
  if (!Array.isArray(record.items) || record.items.length === 0 || record.items.length > 200) return null

  const lines: ProgramPdfLine[] = []
  for (const entry of record.items) {
    if (!entry || typeof entry !== "object") return null
    const item = entry as Record<string, unknown>
    const itemName = text(item.name, 160)
    const section = text(item.section, 80)
    const quantity = Number(item.quantity)
    if (!itemName || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null
    const key = text(item.key, 80)
    const kind = item.kind === "package" || item.kind === "dish" ? item.kind : undefined
    lines.push({ name: itemName, section, quantity, key: key || undefined, kind })
  }

  return { name, phone, venue, date, locale, lines }
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

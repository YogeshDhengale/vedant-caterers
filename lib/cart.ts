import type { LocalizedText } from "@/lib/menu-text"

export type CartLine = {
  key: string
  kind: "package" | "dish"
  name: LocalizedText
  section: string
  quantity: number
}

export function packageKey(categoryId: string) {
  return `package:${categoryId}`
}

export function dishKey(itemId: string) {
  return `dish:${itemId}`
}

export function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false
  const line = value as CartLine
  return (
    typeof line.key === "string" &&
    (line.kind === "package" || line.kind === "dish") &&
    typeof line.section === "string" &&
    typeof line.quantity === "number" &&
    Boolean(line.name) &&
    typeof line.name.en === "string"
  )
}

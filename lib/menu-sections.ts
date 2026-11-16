export const menuSections = [
  "Thali Packages",
  "Breakfast Packages",
  "Breakfast & South Indian",
  "Starters & Chaat",
  "Soups",
  "Chinese & Italian",
  "Main Course",
  "Rice & Breads",
  "Sweets & Desserts",
  "Beverages",
  "Paan & Live Counters",
] as const

export type MenuSection = (typeof menuSections)[number]

const packageSections = ["Thali Packages", "Breakfast Packages"] as const

export function isPackageSection(section: string | null) {
  return packageSections.some((item) => item === section)
}

export function categorySection(name: string) {
  return menuSections.find((section) => name === section || name.startsWith(`${section} — `)) ?? null
}

export function categoryLabel(name: string) {
  const section = categorySection(name)
  if (!section) return name
  const prefix = `${section} — `
  return name.startsWith(prefix) ? name.slice(prefix.length) : name
}

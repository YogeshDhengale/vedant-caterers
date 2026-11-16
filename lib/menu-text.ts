import type { Locale } from "@/lib/i18n"

export type LocalizedText = Record<Locale, string>

export function localized(text: LocalizedText, locale: Locale) {
  return text[locale].trim() || text.en.trim()
}

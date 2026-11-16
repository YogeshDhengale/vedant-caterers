import { dictionary as en } from "@/content/dictionaries/en"
import { dictionary as hi } from "@/content/dictionaries/hi"
import { dictionary as mr } from "@/content/dictionaries/mr"
import type { Locale } from "@/lib/i18n"

const dictionaries = { en, hi, mr }

export function getDictionary(locale: Locale) {
  return dictionaries[locale]
}

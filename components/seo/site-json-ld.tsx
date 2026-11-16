import { getDictionary } from "@/content/dictionaries"
import type { Locale } from "@/lib/i18n"
import { organizationJsonLd } from "@/lib/seo"

export function SiteJsonLd({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale)
  const payload = organizationJsonLd(locale, dictionary)

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  )
}
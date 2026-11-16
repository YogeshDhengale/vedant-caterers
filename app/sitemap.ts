import type { MetadataRoute } from "next"

import { locales } from "@/lib/i18n"
import { languageAlternates, publicPaths, siteUrl } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteUrl()
  const now = new Date()

  return locales.flatMap((locale) =>
    publicPaths.map((path) => {
      const pathname = path === "" ? "" : path
      const languages = languageAlternates(pathname)
      return {
        url: languages[locale] ?? `${site}/${locale}${pathname}`,
        lastModified: now,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "/menu" ? 0.9 : 0.7,
        alternates: {
          languages,
        },
      }
    })
  )
}
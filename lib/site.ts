import { locales, type Locale } from "@/lib/i18n"

export const business = {
  legalName: "Vedant Caterers",
  email: "info@vedantcaterers.in",
  phoneDisplay: "+91 99221 87575",
  phoneE164: "+919922187575",
  streetAddress: "Back side of Vitthal Lawans, Hinjewadi Phase I",
  locality: "Pune",
  region: "Maharashtra",
  postalCode: "411057",
  country: "IN",
  latitude: 18.5912,
  longitude: 73.7389,
  areaServed: "Pune district, Maharashtra, India",
} as const

export function siteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "")
  return fromEnv && fromEnv.length > 0 ? fromEnv : "https://vedantcaterers.in"
}

export function localePath(locale: Locale, pathname = "") {
  const path = pathname.startsWith("/") ? pathname : pathname ? `/${pathname}` : ""
  return `${siteUrl()}/${locale}${path}`
}

export const publicPaths = ["", "/menu", "/gallery", "/contact", "/cart"] as const

export function languageAlternates(pathname = "") {
  const languages: Record<string, string> = {}
  for (const locale of locales) {
    languages[locale] = localePath(locale, pathname)
  }
  languages["x-default"] = localePath("en", pathname)
  return languages
}
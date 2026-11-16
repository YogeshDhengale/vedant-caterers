import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { defaultLocale, hasLocale, locales, type Locale } from "@/lib/i18n"

function preferredLocale(request: NextRequest): Locale {
  const header = request.headers.get("accept-language")
  if (!header) return defaultLocale

  const tags = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase() ?? "")

  for (const tag of tags) {
    const base = tag.split("-")[0]
    if (hasLocale(base)) return base
  }

  return defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasLocalePrefix = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )

  if (hasLocalePrefix) return NextResponse.next()

  const locale = preferredLocale(request)
  const suffix = pathname === "/" ? "" : pathname
  request.nextUrl.pathname = `/${locale}${suffix}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: ["/((?!_next|api|admin|.*\\..*).*)"],
}

import type { Metadata } from "next"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { MenuPage } from "@/components/sections/menu-page"
import { getDictionary } from "@/content/dictionaries"
import { hasLocale, type Locale } from "@/lib/i18n"
import { buildSiteMetadata } from "@/lib/seo"
import { readMenu } from "@/lib/menu-store"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}

  const dictionary = getDictionary(lang)
  return {
    ...buildSiteMetadata(lang, dictionary, "/menu"),
    title: dictionary.menuPage.metaTitle,
    description: dictionary.menuPage.subtitle,
    openGraph: {
      title: dictionary.menuPage.metaTitle,
      description: dictionary.menuPage.subtitle,
    },
  }
}

export default async function Menu({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dictionary = getDictionary(lang)

  return (
    <Suspense fallback={<p className="text-muted-foreground px-4 py-16 text-center">Loading menu…</p>}>
      <MenuCatalog locale={lang} content={dictionary.menuPage} />
    </Suspense>
  )
}

async function MenuCatalog({
  locale,
  content,
}: {
  locale: Locale
  content: ReturnType<typeof getDictionary>["menuPage"]
}) {
  await connection()
  const menu = await readMenu()
  return <MenuPage content={content} locale={locale} menu={menu} />
}
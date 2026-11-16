import type { Metadata } from "next"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { CartPage } from "@/components/sections/cart-page"
import { getDictionary } from "@/content/dictionaries"
import { hasLocale, type Locale } from "@/lib/i18n"
import { buildSiteMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}

  const dictionary = getDictionary(lang)
  return {
    ...buildSiteMetadata(lang, dictionary, "/cart"),
    title: dictionary.cartPage.metaTitle,
    description: dictionary.cartPage.empty,
    robots: { index: false, follow: true },
  }
}

export default async function Cart({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dictionary = getDictionary(lang)

  return (
    <Suspense
      fallback={<p className="text-muted-foreground px-4 py-16 text-center">{dictionary.cartPage.loading}</p>}
    >
      <CartRoute content={dictionary.cartPage} locale={lang} />
    </Suspense>
  )
}

async function CartRoute({
  content,
  locale,
}: {
  content: ReturnType<typeof getDictionary>["cartPage"]
  locale: Locale
}) {
  await connection()
  return <CartPage content={content} locale={locale} />
}
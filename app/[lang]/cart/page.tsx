import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CartPage } from "@/components/sections/cart-page"
import { getDictionary } from "@/content/dictionaries"
import { hasLocale } from "@/lib/i18n"
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

  return <CartPage content={dictionary.cartPage} locale={lang} />
}
import type { Metadata } from "next"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { ContactPage } from "@/components/sections/contact-page"
import { getDictionary } from "@/content/dictionaries"
import type { Dictionary } from "@/content/dictionaries/en"
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
    ...buildSiteMetadata(lang, dictionary, "/contact"),
    title: dictionary.contact.metaTitle,
    description: dictionary.contact.supporting,
    openGraph: {
      title: dictionary.contact.metaTitle,
      description: dictionary.contact.supporting,
    },
  }
}

export default async function Contact({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dictionary = getDictionary(lang)

  return (
    <Suspense
      fallback={<p className="text-muted-foreground px-4 py-16 text-center">Loading contact form…</p>}
    >
      <ContactRoute content={dictionary.contact} />
    </Suspense>
  )
}

async function ContactRoute({ content }: { content: Dictionary["contact"] }) {
  await connection()
  return <ContactPage content={content} />
}

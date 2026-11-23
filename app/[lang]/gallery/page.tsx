import type { Metadata } from "next"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { GalleryPage } from "@/components/sections/gallery-page"
import { getDictionary } from "@/content/dictionaries"
import { hasLocale, type Locale } from "@/lib/i18n"
import { buildSiteMetadata } from "@/lib/seo"
import { localized } from "@/lib/menu-text"
import { readGallery } from "@/lib/gallery-store"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}

  const dictionary = getDictionary(lang)
  return {
    ...buildSiteMetadata(lang, dictionary, "/gallery"),
    title: dictionary.gallery.metaTitle,
    description: dictionary.gallery.subtitle,
    openGraph: {
      title: dictionary.gallery.metaTitle,
      description: dictionary.gallery.subtitle,
    },
  }
}

export default async function Gallery({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dictionary = getDictionary(lang)

  return (
    <Suspense
      fallback={
        <p className="text-muted-foreground px-4 py-16 text-center">{dictionary.gallery.loading}</p>
      }
    >
      <GalleryCatalog
        locale={lang}
        shell={dictionary.gallery}
        bookLabel={dictionary.actions.book}
      />
    </Suspense>
  )
}

async function GalleryCatalog({
  locale,
  shell,
  bookLabel,
}: {
  locale: Locale
  shell: ReturnType<typeof getDictionary>["gallery"]
  bookLabel: string
}) {
  await connection()
  const gallery = await readGallery()

  return (
    <GalleryPage
      locale={locale}
      shell={shell}
      categories={galleryView(gallery.categories, locale)}
      bookLabel={bookLabel}
    />
  )
}

function galleryView(
  categories: Awaited<ReturnType<typeof readGallery>>["categories"],
  locale: Locale
) {
  return categories.map((category) => ({
    id: category.id,
    title: localized(category.title, locale),
    description: localized(category.description, locale),
    photos: category.photos.map((photo) => ({
      id: photo.id,
      caption: localized(photo.caption, locale),
      wide: photo.wide,
      src: photo.file ? `/${photo.file.replace(/^\/+/, "")}` : null,
    })),
  }))
}
import type { Dictionary } from "@/content/dictionaries/en"
import type { Locale } from "@/lib/i18n"

import { GallerySections } from "./gallery-sections"

export type GalleryCategoryView = {
  id: string
  title: string
  description: string
  photos: {
    id: string
    caption: string
    wide: boolean
    src: string | null
  }[]
}

export function GalleryPage({
  locale,
  shell,
  categories,
  bookLabel,
}: {
  locale: Locale
  shell: Dictionary["gallery"]
  categories: GalleryCategoryView[]
  bookLabel: string
}) {
  return (
    <div className="  text-foreground">
      <header className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="font-heading text-primary-foreground text-3xl font-normal text-balance sm:text-4xl lg:text-5xl">
          {shell.title}
        </h1>
        <p className="text-muted-foreground text-balance">{shell.subtitle}</p>
      </header>

      <GallerySections locale={locale} shell={shell} categories={categories} bookLabel={bookLabel} />
    </div>
  )
}
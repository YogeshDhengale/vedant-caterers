import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { Dictionary } from "@/content/dictionaries/en"
import type { Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"

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

      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-16 sm:px-6 lg:px-8">
        {categories.map((category, index) => (
          <section key={category.id} className="flex flex-col gap-8" aria-labelledby={`gallery-${index}`}>
            {index > 0 ? <Separator /> : null}
            <div className="flex max-w-3xl flex-col gap-3">
              <h2
                id={`gallery-${index}`}
                className="font-heading text-primary-foreground text-2xl font-normal text-balance sm:text-3xl"
              >
                {category.title}
              </h2>
              <p className="text-muted-foreground text-balance">{category.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {category.photos.map((photo) => (
                <figure
                  key={photo.id}
                  className={cn(
                    "bg-muted relative flex min-h-48 flex-col justify-end overflow-hidden rounded-xl",
                    photo.wide ? "aspect-[4/3] md:col-span-2 md:aspect-[21/9]" : "aspect-video"
                  )}
                >
                  {photo.src ? (
                    <Image
                      src={photo.src}
                      alt={photo.caption || shell.imageFallback}
                      fill
                      className="object-cover"
                      sizes={
                        photo.wide
                          ? "(max-width: 768px) 100vw, 80vw"
                          : "(max-width: 768px) 100vw, 40vw"
                      }
                    />
                  ) : null}
                  <figcaption className="relative z-[1] bg-linear-to-t from-black/50 to-transparent p-4 text-sm text-white">
                    {photo.caption ? (
                      <span>{photo.caption}</span>
                    ) : (
                      <span className="text-white/80">{shell.imageFallback}</span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}

        <section className="bg-muted flex flex-col items-center gap-4 rounded-xl px-6 py-12 text-center sm:px-10">
          <h2 className="font-heading text-primary-foreground text-3xl font-normal text-balance sm:text-4xl">
            {shell.cta.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl text-balance">{shell.cta.supporting}</p>
          <Button size="lg" asChild>
            <Link href={`/${locale}/contact`}>{bookLabel}</Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
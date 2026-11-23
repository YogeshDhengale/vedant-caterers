"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Dictionary } from "@/content/dictionaries/en";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import type { GalleryCategoryView } from "./gallery-page";

type Slide = {
  id: string;
  src: string;
  caption: string;
  alt: string;
};

export function GallerySections({
  locale,
  shell,
  categories,
  bookLabel,
}: {
  locale: Locale;
  shell: Dictionary["gallery"];
  categories: GalleryCategoryView[];
  bookLabel: string;
}) {
  const slides = useMemo(() => {
    const list: Slide[] = [];
    for (const category of categories) {
      for (const photo of category.photos) {
        if (!photo.src) continue;
        list.push({
          id: photo.id,
          src: photo.src,
          caption: photo.caption,
          alt: photo.caption || shell.imageFallback,
        });
      }
    }
    return list;
  }, [categories, shell.imageFallback]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const open = activeIndex !== null;
  const activeSlide = open ? slides[activeIndex] : null;

  const goPrev = useCallback(() => {
    setActiveIndex((index) => {
      if (index === null || slides.length === 0) return index;
      return (index - 1 + slides.length) % slides.length;
    });
  }, [slides.length]);

  const goNext = useCallback(() => {
    setActiveIndex((index) => {
      if (index === null || slides.length === 0) return index;
      return (index + 1) % slides.length;
    });
  }, [slides.length]);

  const close = useCallback(() => setActiveIndex(null), []);

  const openAt = useCallback(
    (photoId: string) => {
      const index = slides.findIndex((slide) => slide.id === photoId);
      if (index >= 0) setActiveIndex(index);
    },
    [slides],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close, goPrev, goNext]);

  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-16 sm:px-6 lg:px-8">
        {categories.map((category, index) => (
          <section
            key={category.id}
            className="flex flex-col gap-8"
            aria-labelledby={`gallery-${index}`}
          >
            {index > 0 ? <Separator /> : null}
            <div className="flex max-w-3xl flex-col gap-3">
              <h2
                id={`gallery-${index}`}
                className="font-heading text-primary-foreground text-2xl font-normal text-balance sm:text-3xl"
              >
                {category.title}
              </h2>
              <p className="text-muted-foreground text-balance">
                {category.description}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.photos.map((photo) => (
                <figure
                  key={photo.id}
                  className={cn(
                    "bg-muted group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl",
                    photo.src ? "cursor-zoom-in" : "",
                  )}
                >
                  {photo.src ? (
                    <button
                      type="button"
                      className="absolute inset-0 z-0"
                      aria-label={`${shell.openFullImage}: ${photo.caption || shell.imageFallback}`}
                      onClick={() => openAt(photo.id)}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.caption || shell.imageFallback}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </button>
                  ) : null}
                  <figcaption className="relative z-[1] bg-linear-to-t from-black/60 to-transparent p-4 text-sm text-white">
                    {photo.caption ? (
                      <span>{photo.caption}</span>
                    ) : (
                      <span className="text-white/80">
                        {shell.imageFallback}
                      </span>
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
          <p className="text-muted-foreground max-w-2xl text-balance">
            {shell.cta.supporting}
          </p>
          <Button size="lg" asChild>
            <Link href={`/${locale}/contact`}>{bookLabel}</Link>
          </Button>
        </section>
      </div>

      {open && activeSlide ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={shell.lightboxTitle}
        >
          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default"
            aria-label={shell.lightboxClose}
            onClick={close}
          />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col items-center gap-4">
            <Button
              variant={"secondary"}
              size="icon-lg"
              className="absolute top-0 right-0 z-20 rounded-full"
              aria-label={shell.lightboxClose}
              onClick={close}
            >
              <X className="size-5" />
            </Button>
            <div className="relative aspect-[4/3] w-full max-h-[75vh]">
              <Image
                src={activeSlide.src}
                alt={activeSlide.alt}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            {activeSlide.caption ? (
              <p className="text-primary max-w-2xl text-center text-sm text-balance sm:text-base">
                {activeSlide.caption}
              </p>
            ) : null}
            <p className="text-primary-foreground/70 text-xs">
              {activeIndex! + 1} / {slides.length}
            </p>
          </div>
          {slides.length > 1 ? (
            <>
              <Button
                variant={"secondary"}
                size="icon-lg"
                type="button"
                className="absolute top-1/2 left-3 z-20 -translate-y-1/2 rounded-full sm:left-6"
                aria-label={shell.lightboxPrevious}
                onClick={(event) => {
                  event.stopPropagation();
                  goPrev();
                }}
              >
                <ChevronLeft className="size-6" />
              </Button>
              <Button
                variant={"secondary"}
                size="icon-lg"
                type="button"
                className="absolute top-1/2 right-3 z-20 -translate-y-1/ rounded-full sm:right-6"
                aria-label={shell.lightboxNext}
                onClick={(event) => {
                  event.stopPropagation();
                  goNext();
                }}
              >
                <ChevronRight className="size-6" />
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

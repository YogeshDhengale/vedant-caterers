"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import RotundaCarousel from "@/components/originkit/ui/rotunda-carousel"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/content/dictionaries/en"
import type { Locale } from "@/lib/i18n"

const heroImageSources = [
  "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
] as const

const HeroSection = ({
  locale,
  dictionary,
}: {
  locale: Locale
  dictionary: Dictionary
}) => {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return (
    <section className="flex flex-1 flex-col justify-between  overflow-x-hidden pt-24">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 text-center sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl leading-[1.29167] text-primary-foreground font-normal text-balance sm:text-4xl lg:text-5xl">
          {dictionary.hero.titleLead}
          <br />
          <span className="relative">
            {dictionary.hero.titleAccent}
            <svg
              width="223"
              height="12"
              viewBox="0 0 223 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-x-0 bottom-0 w-full translate-y-1/2 max-sm:hidden"
              aria-hidden
            >
              <path
                d="M1.11716 10.428C39.7835 4.97282 75.9074 2.70494 114.894 1.98894C143.706 1.45983 175.684 0.313587 204.212 3.31596C209.925 3.60546 215.144 4.59884 221.535 5.74551"
                stroke="url(#hero-section-01-underline)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient
                  id="hero-section-01-underline"
                  x1="18.8541"
                  y1="3.72033"
                  x2="42.6487"
                  y2="66.6308"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="var(--primary)" />
                  <stop offset="1" stopColor="var(--primary-foreground)" />
                </linearGradient>
              </defs>
            </svg>
          </span>{" "}
          {dictionary.hero.titleTail}
        </h1>

        <p className="text-muted-foreground max-w-2xl text-balance">
          {dictionary.hero.supporting[0]}
          <br />
          {dictionary.hero.supporting[1]}
        </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-center items-center">
        <Button  size="xl" asChild>
          <Link href={`/${locale}/contact`}>{dictionary.actions.book}</Link>
        </Button>
        <Button size="xl" variant={"outline"} asChild>
          <Link href={`/${locale}/menu`}>{dictionary.actions.explore}</Link>
        </Button>
        </div>
      </div>

      <div
        className="h-64 w-full sm:h-85 lg:h-136"
        role="img"
        aria-label={Object.values(dictionary.images).join(", ")}
      >
        <RotundaCarousel
          images={heroImageSources.map((image, index) => ({
            image,
            alt: Object.values(dictionary.images)[index],
          }))}
          background="transparent"
          speed={reduceMotion ? 0 : undefined}
          style={{ minWidth: 0, minHeight: 0, width: "100%", height: "100%" }}
          gap={20}
        />
      </div>
    </section>
  )
}

export default function HeroSection01({
  locale,
  dictionary,
}: {
  locale: Locale
  dictionary: Dictionary
}) {
  return (
    <div className="text-foreground flex flex-col">
      <HeroSection locale={locale} dictionary={dictionary} />
    </div>
  )
}

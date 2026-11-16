import { notFound } from "next/navigation"

import HeroSection01 from "@/components/hero-section-01"
import { Testimonials } from "@/components/sections/testimonials"
import { WhyChooseUs } from "@/components/sections/why-choose-us"
import { getDictionary } from "@/content/dictionaries"
import { hasLocale, type Locale } from "@/lib/i18n"
import { localized } from "@/lib/menu-text"
import { readTestimonials } from "@/lib/testimonials-store"

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dictionary = getDictionary(lang)
  const testimonials = await readTestimonials()

  return (
    <>
      <HeroSection01 locale={lang} dictionary={dictionary} />
      <WhyChooseUs content={dictionary.whyChooseUs} />
      <Testimonials
        content={dictionary.testimonials}
        items={testimonialCards(testimonials, lang)}
      />
    </>
  )
}

function testimonialCards(
  testimonials: Awaited<ReturnType<typeof readTestimonials>>,
  locale: Locale
) {
  return testimonials.map((entry) => ({
    id: entry.id,
    quote: localized(entry.quote, locale),
    name: localized(entry.name, locale),
    detail: localized(entry.detail, locale),
  }))
}

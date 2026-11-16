import { Quote } from "lucide-react"

import { InstagramReels } from "@/components/sections/instagram-reels"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Dictionary } from "@/content/dictionaries/en"

export type TestimonialCard = {
  id: string
  quote: string
  name: string
  detail: string
}

export function Testimonials({
  content,
  items,
}: {
  content: Dictionary["testimonials"]
  items: TestimonialCard[]
}) {
  return (
    <section className="  py-16 sm:py-24" aria-labelledby="testimonials-heading">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <h2
            id="testimonials-heading"
            className="font-heading text-primary-foreground text-3xl font-normal text-balance sm:text-4xl lg:text-5xl"
          >
            {content.title}
          </h2>
          <p className="text-muted-foreground text-balance">{content.supporting}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="bg-muted/60">
              <CardHeader className="flex-1">
                <Quote className="text-primary size-5" aria-hidden />
                <CardTitle className="text-lg font-normal leading-snug">
                  <blockquote>
                    <p>{item.quote}</p>
                  </blockquote>
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1">
                <p className="text-foreground font-medium">{item.name}</p>
                <CardDescription>{item.detail}</CardDescription>
              </CardFooter>
            </Card>
          ))}
        </div>

        <InstagramReels permalinks={content.reels} label={content.viewOnInstagram} />
      </div>
    </section>
  )
}

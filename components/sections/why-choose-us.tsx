import { Fragment } from "react"
import { MapPin, ShieldCheck, Sparkles, Users } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/content/dictionaries/en"

const reasonIcons = [Users, Sparkles, ShieldCheck, MapPin] as const

export function WhyChooseUs({ content }: { content: Dictionary["whyChooseUs"] }) {
  const [featured, ...rest] = content.reasons

  return (
    <section className="  py-16 sm:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:gap-16 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <h2 className="font-heading text-primary-foreground text-3xl text-balance sm:text-4xl font-normal lg:text-5xl">{content.title}</h2>
          <p className="text-muted-foreground text-balance">{content.supporting}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center">
          {content.stats.map((stat, index) => (
            <Fragment key={stat.label}>
              {index > 0 ? (
                <>
                  <Separator orientation="horizontal" className="mx-auto my-4 w-16 sm:hidden" />
                  <Separator orientation="vertical" className="mx-0 hidden h-16 sm:block self-center!" />
                </>
              ) : null}
              <Card className="bg-none border-none shadow-none outline-none ring-0 min-w-0 flex-1 items-center text-center">
                <CardHeader className="flex flex-col items-center gap-2 w-full py-2">
                  <CardTitle className="text-4xl font-normal text-foreground sm:text-5xl">{stat.value}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">{stat.label}</CardDescription>
                </CardHeader>
              </Card>
            </Fragment>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ReasonCard reason={featured} icon={reasonIcons[0]} className="md:col-span-2" />
          {rest.map((reason, index) => (
            <ReasonCard
              key={reason.title}
              reason={reason}
              icon={reasonIcons[index + 1]}
              className={"lg:col-span-2"}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function ReasonCard({
  reason,
  icon: Icon,
  className,
}: {
  reason: Dictionary["whyChooseUs"]["reasons"][number]
  icon: (typeof reasonIcons)[number]
  className?: string
}) {
  return (
    <Card className={cn("bg-muted/60", className)}>
      <CardHeader>
        <div className="  text-foreground mb-2 flex size-10 items-center justify-center rounded-lg">
          <Icon className="size-5" aria-hidden />
        </div>
        <CardTitle className={"text-2xl sm:text-2xl"}>{reason.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className={"text-base"}>{reason.body}</CardDescription>
      </CardContent>
    </Card>
  )
}

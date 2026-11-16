"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileDown, Send, Trash2 } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import type * as z from "zod"

import { useCart } from "@/components/cart/cart-provider"
import { QuantityStepper } from "@/components/enquiry/quantity-stepper"
import { WhatsappPreview } from "@/components/enquiry/whatsapp-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/content/dictionaries/en"
import { createCartEnquiryFormSchema, type CartEnquiryFormValues } from "@/lib/enquiry-schemas"
import type { Locale } from "@/lib/i18n"
import { localized } from "@/lib/menu-text"
import { cateringEnquiryMessage, eventTypeLabel, eventTypes, whatsappPhoneDisplay, whatsappSendUrl } from "@/lib/whatsapp"

type CartCopy = Dictionary["cartPage"]

type CartFormFields = CartEnquiryFormValues & {
  dishes?: string
}

const cartFormId = "cart-enquiry-form"

export function CartPage({ content, locale }: { content: CartCopy; locale: Locale }) {
  const cart = useCart()
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState("")

  const formSchema = useMemo(
    () =>
      createCartEnquiryFormSchema({
        required: content.required,
        invalidPhone: content.invalidPhone,
      }),
    [content.invalidPhone, content.required]
  )

  const form = useForm<CartFormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      eventType: "",
      eventDate: "",
      guests: "",
      venue: "",
      instructions: "",
      company: "",
    },
  })

  const watched = form.watch()
  const dishesError = form.formState.errors.dishes?.message

  const dishLines = useMemo(() => {
    return cart.lines
      .map((line) => `${localized(line.name, locale)} × ${line.quantity}`)
      .join("\n")
  }, [cart.lines, locale])

  const message = useMemo(
    () =>
      cateringEnquiryMessage([
        { label: "Name", value: watched.name ?? "" },
        { label: "Phone", value: watched.phone ?? "" },
        { label: "Event Type", value: eventTypeLabel(watched.eventType ?? "") },
        { label: "Event Date", value: watched.eventDate ?? "" },
        { label: "Guest Count", value: watched.guests ?? "" },
        { label: "Venue", value: watched.venue ?? "" },
        { label: "Selected dishes", value: dishLines },
        { label: "Special instructions", value: watched.instructions ?? "" },
      ]),
  [
    dishLines,
    watched.eventDate,
    watched.eventType,
    watched.guests,
    watched.instructions,
    watched.name,
    watched.phone,
    watched.venue,
  ])

  function ensureCartHasDishes() {
    if (cart.lines.length > 0) {
      form.clearErrors("dishes")
      return true
    }
    form.setError("dishes", { type: "manual", message: content.empty })
    return false
  }

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (data.company?.trim()) return
    if (!ensureCartHasDishes()) return

    const submission = cateringEnquiryMessage([
      { label: "Name", value: data.name },
      { label: "Phone", value: data.phone },
      { label: "Event Type", value: eventTypeLabel(data.eventType) },
      { label: "Event Date", value: data.eventDate },
      { label: "Guest Count", value: data.guests },
      { label: "Venue", value: data.venue },
      { label: "Selected dishes", value: dishLines },
      { label: "Special instructions", value: data.instructions },
    ])

    window.open(whatsappSendUrl(submission), "_blank", "noopener,noreferrer")
  }

  async function downloadPdf() {
    setDownloadError("")
    const valid = await form.trigger()
    if (!valid) return

    const data = form.getValues()
    if (data.company?.trim()) return
    if (!ensureCartHasDishes()) return

    setDownloading(true)
    try {
      const response = await fetch("/api/menu/program", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          venue: data.venue,
          date: data.eventDate,
          locale,
          items: cart.lines.map((line) => ({
            key: line.key,
            kind: line.kind,
            name: localized(line.name, locale),
            section: line.section,
            quantity: line.quantity,
          })),
        }),
      })
      if (!response.ok) throw new Error("pdf")
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = "vedant-program-menu.pdf"
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError(content.downloadFailed)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="  text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-heading text-primary-foreground text-3xl font-normal sm:text-4xl">{content.title}</h1>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>
                {content.selected} ({cart.total})
              </CardTitle>
              <Button type="button" variant="ghost" className="text-destructive" disabled={cart.lines.length === 0} onClick={cart.clear}>
                <Trash2 data-icon="inline-start" />
                {content.clearAll}
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!cart.ready ? (
                <p className="text-muted-foreground text-sm">{content.loading}</p>
              ) : cart.lines.length === 0 ? (
                <div className="flex flex-col gap-3">
                  <p className="text-muted-foreground text-sm">{content.empty}</p>
                  <Button variant="outline" className="w-fit" asChild>
                    <Link href={`/${locale}/menu`}>{content.browse}</Link>
                  </Button>
                </div>
              ) : (
                cart.lines.map((line) => (
                  <div key={line.key} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-xs tracking-wide uppercase">
                          {line.section ? content.sections[line.section as keyof CartCopy["sections"]] : content.selection}
                        </p>
                        <p className="font-medium">{localized(line.name, locale)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <QuantityStepper
                          quantity={line.quantity}
                          decreaseLabel={content.decrease}
                          increaseLabel={content.increase}
                          onChange={(next) => cart.setQuantity(line.key, next)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="rounded-full"
                          aria-label={content.remove}
                          onClick={() => cart.remove(line.key)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))
              )}
              <p className="text-sm">
                {content.total}: {cart.total}
              </p>
              {dishesError ? <FieldError>{dishesError}</FieldError> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{content.eventDetails}</CardTitle>
            </CardHeader>
            <CardContent>
              <form id={cartFormId} className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <FieldGroup>
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="cart-name">{content.name}</FieldLabel>
                        <Input
                          {...field}
                          id="cart-name"
                          placeholder={content.namePlaceholder}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                  <Controller
                    name="phone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="cart-phone">{content.phone}</FieldLabel>
                        <Input
                          {...field}
                          id="cart-phone"
                          type="tel"
                          placeholder={content.phonePlaceholder}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Controller
                      name="eventType"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="cart-event-type">{content.eventType}</FieldLabel>
                          <Select value={field.value || undefined} onValueChange={field.onChange}>
                            <SelectTrigger id="cart-event-type" className="w-full" aria-invalid={fieldState.invalid}>
                              <SelectValue placeholder={content.eventTypePlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {eventTypes.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {content.eventTypes[item.id]}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                      )}
                    />
                    <Controller
                      name="eventDate"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="cart-date">{content.eventDate}</FieldLabel>
                          <Input {...field} id="cart-date" type="date" aria-invalid={fieldState.invalid} />
                          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                      )}
                    />
                  </div>
                  <Controller
                    name="guests"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="cart-guests">{content.guests}</FieldLabel>
                        <Input
                          {...field}
                          id="cart-guests"
                          type="number"
                          min={1}
                          placeholder={content.guestsPlaceholder}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                  <Controller
                    name="venue"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="cart-venue">{content.venue}</FieldLabel>
                        <Input
                          {...field}
                          id="cart-venue"
                          placeholder={content.venuePlaceholder}
                          aria-invalid={fieldState.invalid}
                        />
                      </Field>
                    )}
                  />
                  <Controller
                    name="instructions"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="cart-notes">{content.instructions}</FieldLabel>
                        <Textarea
                          {...field}
                          id="cart-notes"
                          placeholder={content.instructionsPlaceholder}
                          aria-invalid={fieldState.invalid}
                        />
                      </Field>
                    )}
                  />
                  <Controller
                    name="company"
                    control={form.control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        className="sr-only"
                        value={field.value ?? ""}
                        aria-hidden
                      />
                    )}
                  />
                </FieldGroup>
                {/* <WhatsappPreview label={content.preview} message={message} /> */}
                {downloadError ? <FieldError>{downloadError}</FieldError> : null}
                <Button type="submit" size="lg" className="w-full">
                  <Send data-icon="inline-start" />
                  {content.send}
                </Button>
                <Separator />
                <Button type="button" size="lg" className="w-full" disabled={downloading} onClick={() => void downloadPdf()}>
                  <FileDown data-icon="inline-start" />
                  {content.download}
                </Button>
                
                <p className="text-muted-foreground text-center text-sm">
                  {content.note} {whatsappPhoneDisplay}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import type * as z from "zod"

import { WhatsappPreview } from "@/components/enquiry/whatsapp-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/content/dictionaries/en"
import { createContactFormSchema, type ContactFormValues } from "@/lib/enquiry-schemas"
import { cateringEnquiryMessage, eventTypeLabel, eventTypes, guestRangeLabel, guestRanges, whatsappPhoneDisplay, whatsappSendUrl } from "@/lib/whatsapp"

type ContactDetails = Dictionary["contact"]["details"]

function ContactDetailItem({
  icon: Icon,
  label,
  value,
  note,
  href,
}: {
  icon: typeof Phone
  label: string
  value: React.ReactNode
  note: string
  href?: string
}) {
  const valueClassName = "text-lg font-medium leading-snug"

  return (
    <section className="flex gap-4">
      <div className="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-full" aria-hidden>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">{label}</p>
        {href ? (
          <a href={href} className={`${valueClassName} hover:text-primary transition-colors`}>
            {value}
          </a>
        ) : (
          <p className={valueClassName}>{value}</p>
        )}
        <p className="text-muted-foreground text-sm">{note}</p>
      </div>
    </section>
  )
}

function ContactDetailsPanel({ details }: { details: ContactDetails }) {
  return (
    <div className="flex flex-col gap-10">
      <ContactDetailItem
        icon={Phone}
        label={details.directLineLabel}
        value={<span className="font-heading font-normal">{whatsappPhoneDisplay}</span>}
        note={details.directLineNote}
        href={`tel:${whatsappPhoneDisplay.replace(/\s/g, "")}`}
      />
      <ContactDetailItem
        icon={Mail}
        label={details.emailLabel}
        value={details.email}
        note={details.emailNote}
        href={`mailto:${details.email}`}
      />
      <ContactDetailItem
        icon={MapPin}
        label={details.addressLabel}
        value={details.address}
        note={details.addressNote}
      />
      <ContactDetailItem icon={Clock} label={details.hoursLabel} value={details.hours} note={details.hoursNote} />
    </div>
  )
}

const contactFormId = "contact-enquiry-form"

export function ContactPage({ content }: { content: Dictionary["contact"] }) {
  const formSchema = useMemo(
    () =>
      createContactFormSchema({
        required: content.required,
        invalidEmail: content.invalidEmail,
        invalidPhone: content.invalidPhone,
      }),
    [content.invalidEmail, content.invalidPhone, content.required]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      eventDate: "",
      eventType: "",
      guests: "",
      venue: "",
      notes: "",
      company: "",
    },
  })

  const watched = form.watch()

  const message = useMemo(
    () =>
      cateringEnquiryMessage([
        { label: "Name", value: watched.name },
        { label: "Email", value: watched.email },
        { label: "Phone", value: watched.phone },
        { label: "Event Type", value: eventTypeLabel(watched.eventType) },
        { label: "Event Date", value: watched.eventDate },
        { label: "Guest Count", value: guestRangeLabel(watched.guests) },
        { label: "Venue", value: watched.venue },
        { label: "Notes", value: watched.notes },
      ]),
    [watched.email, watched.eventDate, watched.eventType, watched.guests, watched.name, watched.notes, watched.phone, watched.venue]
  )

  function onSubmit(data: ContactFormValues) {
    if (data.company?.trim()) return

    const submission = cateringEnquiryMessage([
      { label: "Name", value: data.name },
      { label: "Email", value: data.email },
      { label: "Phone", value: data.phone },
      { label: "Event Type", value: eventTypeLabel(data.eventType) },
      { label: "Event Date", value: data.eventDate },
      { label: "Guest Count", value: guestRangeLabel(data.guests) },
      { label: "Venue", value: data.venue },
      { label: "Notes", value: data.notes },
    ])

    window.open(whatsappSendUrl(submission), "_blank", "noopener,noreferrer")
  }

  return (
    <div className="  text-foreground overflow-x-hidden">
      <header className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 pt-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-heading text-primary-foreground text-3xl font-normal text-balance sm:text-4xl lg:text-5xl">
          {content.title}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-balance">{content.supporting}</p>
      </header>
      <div className="mx-auto grid max-w-7xl min-w-0 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-14">
        <div className="min-w-0 lg:pt-2">
          <ContactDetailsPanel details={content.details} />
        </div>
        <Card className="min-w-0">
          <CardContent>
            <form id={contactFormId} className="flex min-w-0 flex-col gap-8" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <FieldSet>
                <FieldLegend>{content.contactHeading}</FieldLegend>
                <FieldGroup>
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="contact-name">{content.name}</FieldLabel>
                        <Input
                          {...field}
                          id="contact-name"
                          placeholder={content.namePlaceholder}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="contact-email">{content.email}</FieldLabel>
                        <Input
                          {...field}
                          id="contact-email"
                          type="email"
                          placeholder={content.emailPlaceholder}
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
                        <FieldLabel htmlFor="contact-phone">{content.phone}</FieldLabel>
                        <Input
                          {...field}
                          id="contact-phone"
                          type="tel"
                          placeholder={content.phonePlaceholder}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                  <Controller
                    name="eventDate"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="contact-date">{content.eventDate}</FieldLabel>
                        <Input {...field} id="contact-date" type="date" aria-invalid={fieldState.invalid} />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend>{content.celebrationHeading}</FieldLegend>
                <FieldGroup>
                  <Controller
                    name="eventType"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="contact-event-type">{content.eventType}</FieldLabel>
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <SelectTrigger id="contact-event-type" className="w-full" aria-invalid={fieldState.invalid}>
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
                    name="guests"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="contact-guests">{content.guests}</FieldLabel>
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <SelectTrigger id="contact-guests" className="w-full" aria-invalid={fieldState.invalid}>
                            <SelectValue placeholder={content.guestsPlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {guestRanges.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {content.guestRanges[item.id]}
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
                    name="venue"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="contact-venue">{content.venue}</FieldLabel>
                        <Input
                          {...field}
                          id="contact-venue"
                          placeholder={content.venuePlaceholder}
                          aria-invalid={fieldState.invalid}
                        />
                      </Field>
                    )}
                  />
                  <Controller
                    name="notes"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="contact-notes">{content.notes}</FieldLabel>
                        <Textarea
                          {...field}
                          id="contact-notes"
                          placeholder={content.notesPlaceholder}
                          aria-invalid={fieldState.invalid}
                        />
                      </Field>
                    )}
                  />
                </FieldGroup>
              </FieldSet>

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

              <WhatsappPreview label={content.preview} message={message} />
              <Button type="submit" size="lg" className="w-full">
                <Send data-icon="inline-start" />
                {content.send}
              </Button>
              <p className="text-muted-foreground text-center text-sm">
                {content.note} {whatsappPhoneDisplay}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
import * as z from "zod"

import { eventTypes, guestRanges } from "@/lib/whatsapp"

export type FormValidationCopy = {
  required: string
  invalidEmail: string
  invalidPhone: string
}

function phoneRefine(value: string) {
  return value.replace(/\D/g, "").length >= 8
}

function eventTypeRefine(value: string) {
  return eventTypes.some((item) => item.id === value)
}

function guestRangeRefine(value: string) {
  return guestRanges.some((item) => item.id === value)
}

export function createContactFormSchema(messages: FormValidationCopy) {
  return z.object({
    name: z.string().trim().min(1, messages.required),
    email: z
      .string()
      .trim()
      .min(1, messages.required)
      .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), messages.invalidEmail),
    phone: z.string().refine(phoneRefine, messages.invalidPhone),
    eventDate: z.string().min(1, messages.required),
    eventType: z.string().refine(eventTypeRefine, messages.required),
    guests: z.string().refine(guestRangeRefine, messages.required),
    venue: z.string(),
    notes: z.string(),
    company: z.string().optional(),
  })
}

export type ContactFormValues = z.infer<ReturnType<typeof createContactFormSchema>>

export function createCartEnquiryFormSchema(
  messages: Pick<FormValidationCopy, "required" | "invalidPhone">
) {
  return z.object({
    name: z.string().trim().min(1, messages.required),
    phone: z.string().refine(phoneRefine, messages.invalidPhone),
    eventType: z.string().refine(eventTypeRefine, messages.required),
    eventDate: z.string().min(1, messages.required),
    guests: z.string().refine((value) => {
      const count = Number(value)
      return value.trim() !== "" && !Number.isNaN(count) && count >= 1
    }, messages.required),
    venue: z.string(),
    instructions: z.string(),
    company: z.string().optional(),
  })
}

export type CartEnquiryFormValues = z.infer<ReturnType<typeof createCartEnquiryFormSchema>>
export const whatsappPhone = "919922187575"
export const whatsappPhoneDisplay = "+91 99221 87575"

export const eventTypes = [
  { id: "bespoke-weddings", label: "Bespoke Weddings" },
  { id: "social-celebrations", label: "Social Celebrations" },
  { id: "home-catering", label: "Home Catering & Dinners" },
  { id: "corporate-catering", label: "Corporate Catering" },
  { id: "private-soirees", label: "Private Luxury Soirées" },
] as const

export const guestRanges = [
  { id: "intimate", label: "Intimate: 15 — 50 guests" },
  { id: "medium", label: "Medium: 50 — 150 guests" },
  { id: "grand", label: "Grand: 150 — 350 guests" },
  { id: "mega", label: "Mega: 350 — 750 guests" },
  { id: "royal", label: "Royal: 750 — 2000+ guests" },
] as const

export type EventTypeId = (typeof eventTypes)[number]["id"]
export type GuestRangeId = (typeof guestRanges)[number]["id"]

export function eventTypeLabel(id: string) {
  return eventTypes.find((item) => item.id === id)?.label ?? id
}

export function guestRangeLabel(id: string) {
  return guestRanges.find((item) => item.id === id)?.label ?? id
}

export function cateringEnquiryMessage(fields: Array<{ label: string; value: string }>) {
  const lines = fields
    .filter((field) => field.value.trim())
    .map((field) => `*${field.label}:* ${field.value.trim()}`)

  return ["Hi, I'd like to inquire about catering services:", "", ...lines].join("\n")
}

export function whatsappSendUrl(message: string) {
  const params = new URLSearchParams({
    phone: whatsappPhone,
    text: message,
    type: "phone_number",
    app_absent: "0",
  })

  return `https://api.whatsapp.com/send/?${params.toString()}`
}

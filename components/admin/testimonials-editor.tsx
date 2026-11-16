"use client"

import { useId, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Testimonial } from "@/lib/testimonials-store"

type Draft = {
  quoteEn: string
  quoteMr: string
  nameEn: string
  nameMr: string
  detailEn: string
  detailMr: string
  sort: string
}

const emptyDraft: Draft = {
  quoteEn: "",
  quoteMr: "",
  nameEn: "",
  nameMr: "",
  detailEn: "",
  detailMr: "",
  sort: "",
}

export function TestimonialsEditor({ testimonials }: { testimonials: Testimonial[] }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)

  async function send(method: string, body: unknown) {
    setPending(true)
    setError("")
    const response = await fetch("/api/testimonials", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const result = (await response.json()) as { ok: boolean; errors?: string[] }
    setPending(false)
    if (!result.ok) {
      setError(result.errors?.[0] ?? "Could not save.")
      return false
    }
    router.refresh()
    return true
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-primary-foreground text-2xl font-normal">Testimonials</h2>
        <p className="text-muted-foreground text-sm">
          Changes are saved to data/testimonials.csv and appear on the home page immediately. English and Marathi
          fields are required for the public site.
        </p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <DraftForm
        draft={draft}
        onChange={setDraft}
        pending={pending}
        submitLabel="Add testimonial"
        onSubmit={async () => {
          const saved = await send("POST", bodyFromDraft(draft))
          if (saved) setDraft(emptyDraft)
        }}
      />

      <div className="flex flex-col gap-4">
        {testimonials.map((item) => (
          <RecordEditor
            key={item.id}
            title={item.quote.en.slice(0, 80) + (item.quote.en.length > 80 ? "…" : "")}
            draft={fromTestimonial(item)}
            pending={pending}
            onSave={(value) => send("PATCH", { id: item.id, ...bodyFromDraft(value) })}
            onDelete={() => {
              if (window.confirm("Delete this testimonial?")) {
                return send("DELETE", { id: item.id })
              }
              return Promise.resolve(false)
            }}
          />
        ))}
      </div>
    </section>
  )
}

function DraftForm({
  draft,
  onChange,
  onSubmit,
  pending,
  submitLabel,
}: {
  draft: Draft
  onChange: (draft: Draft) => void
  onSubmit: () => Promise<void>
  pending: boolean
  submitLabel: string
}) {
  return (
    <form
      className="border-border flex flex-col gap-3 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit()
      }}
    >
      <Fields draft={draft} onChange={onChange} disabled={pending} />
      <Button type="submit" disabled={pending} className="self-start">
        {submitLabel}
      </Button>
    </form>
  )
}

function RecordEditor({
  title,
  draft,
  pending,
  onSave,
  onDelete,
}: {
  title: string
  draft: Draft
  pending: boolean
  onSave: (draft: Draft) => Promise<boolean>
  onDelete: () => Promise<boolean>
}) {
  const [value, setValue] = useState(draft)

  return (
    <form
      className="border-border flex flex-col gap-3 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onSave(value)
      }}
    >
      <p className="text-sm font-medium">{title}</p>
      <Fields draft={value} onChange={setValue} disabled={pending} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          Save
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => void onDelete()}>
          Delete
        </Button>
      </div>
    </form>
  )
}

function Fields({
  draft,
  onChange,
  disabled,
}: {
  draft: Draft
  onChange: (draft: Draft) => void
  disabled: boolean
}) {
  function set(key: keyof Draft, value: string) {
    onChange({ ...draft, [key]: value })
  }

  return (
    <FieldGroup className="md:grid md:grid-cols-2">
      <TextAreaField
        label="English quote"
        value={draft.quoteEn}
        onChange={(value) => set("quoteEn", value)}
        required
        disabled={disabled}
        className="md:col-span-2"
      />
      <TextAreaField
        label="Marathi quote"
        value={draft.quoteMr}
        onChange={(value) => set("quoteMr", value)}
        disabled={disabled}
        className="md:col-span-2"
      />
      <TextField
        label="English name"
        value={draft.nameEn}
        onChange={(value) => set("nameEn", value)}
        required
        disabled={disabled}
      />
      <TextField
        label="Marathi name"
        value={draft.nameMr}
        onChange={(value) => set("nameMr", value)}
        disabled={disabled}
      />
      <TextField
        label="English event detail"
        value={draft.detailEn}
        onChange={(value) => set("detailEn", value)}
        required
        disabled={disabled}
      />
      <TextField
        label="Marathi event detail"
        value={draft.detailMr}
        onChange={(value) => set("detailMr", value)}
        disabled={disabled}
      />
      <TextField label="Sort" value={draft.sort} onChange={(value) => set("sort", value)} disabled={disabled} />
    </FieldGroup>
  )
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
}) {
  const id = useId()

  return (
    <Field data-disabled={disabled || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
}) {
  const id = useId()

  return (
    <Field className={className} data-disabled={disabled || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        id={id}
        value={value}
        required={required}
        disabled={disabled}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

function bodyFromDraft(draft: Draft) {
  return {
    quoteEn: draft.quoteEn,
    quoteMr: draft.quoteMr,
    nameEn: draft.nameEn,
    nameMr: draft.nameMr,
    detailEn: draft.detailEn,
    detailMr: draft.detailMr,
    sort: draft.sort,
  }
}

function fromTestimonial(item: Testimonial): Draft {
  return {
    quoteEn: item.quote.en,
    quoteMr: item.quote.mr,
    nameEn: item.name.en,
    nameMr: item.name.mr,
    detailEn: item.detail.en,
    detailMr: item.detail.mr,
    sort: String(item.sort),
  }
}
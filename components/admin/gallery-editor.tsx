"use client"

import Image from "next/image"
import { useId, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { GalleryCategory } from "@/lib/gallery-store"

type CategoryDraft = {
  titleEn: string
  titleMr: string
  descriptionEn: string
  descriptionMr: string
  sort: string
}

type PhotoDraft = {
  categoryId: string
  captionEn: string
  captionMr: string
  file: string
  wide: boolean
  sort: string
}

const emptyCategory: CategoryDraft = {
  titleEn: "",
  titleMr: "",
  descriptionEn: "",
  descriptionMr: "",
  sort: "",
}

const emptyPhoto = (categoryId: string): PhotoDraft => ({
  categoryId,
  captionEn: "",
  captionMr: "",
  file: "",
  wide: false,
  sort: "",
})

export function GalleryEditor({ categories }: { categories: GalleryCategory[] }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(emptyCategory)
  const [photoCategoryId, setPhotoCategoryId] = useState(categories[0]?.id ?? "")
  const [photoDraft, setPhotoDraft] = useState<PhotoDraft>(emptyPhoto(categories[0]?.id ?? ""))
  const [uploadName, setUploadName] = useState("")

  async function send(method: string, url: string, body?: unknown) {
    setPending(true)
    setError("")
    const response = await fetch(url, {
      method,
      headers: body instanceof FormData ? undefined : { "content-type": "application/json" },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    })
    const result = (await response.json()) as { ok: boolean; errors?: string[]; file?: string }
    setPending(false)
    if (!result.ok) {
      setError(result.errors?.[0] ?? "Could not save.")
      return null
    }
    router.refresh()
    return result
  }

  async function uploadFile(file: File) {
    const form = new FormData()
    form.set("file", file)
    const result = await send("POST", "/api/gallery/upload", form)
    if (!result?.file) return ""
    setUploadName(file.name)
    return result.file
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-primary-foreground text-2xl font-normal">Gallery</h2>
        <p className="text-muted-foreground text-sm">
          Images save under <code className="text-xs">public/gallery/</code> and metadata to{" "}
          <code className="text-xs">public/data/gallery.csv</code>. English copy is required; add Marathi when ready.
        </p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium">Categories</h3>
        <CategoryForm
          draft={categoryDraft}
          onChange={setCategoryDraft}
          pending={pending}
          submitLabel="Add category"
          onSubmit={async () => {
            const saved = await send("POST", "/api/gallery/categories", categoryBody(categoryDraft))
            if (saved) setCategoryDraft(emptyCategory)
          }}
        />
        {categories.map((category) => (
          <CategoryRecord
            key={category.id}
            category={category}
            pending={pending}
            onSave={(draft) => send("PATCH", "/api/gallery/categories", { id: category.id, ...categoryBody(draft) })}
            onDelete={async () => {
              if (!window.confirm(`Delete “${category.title.en}” and its photos?`)) return
              await send("DELETE", "/api/gallery/categories", { id: category.id })
            }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium">Photos</h3>
        <Select
          value={photoCategoryId || undefined}
          onValueChange={(value) => {
            setPhotoCategoryId(value)
            setPhotoDraft((current) => ({ ...current, categoryId: value }))
          }}
        >
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.title.en}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <PhotoForm
          draft={photoDraft}
          onChange={setPhotoDraft}
          pending={pending}
          uploadName={uploadName}
          submitLabel="Add photo"
          onUpload={async (file) => {
            const path = await uploadFile(file)
            if (path) setPhotoDraft((current) => ({ ...current, file: path }))
            return path
          }}
          onSubmit={async () => {
            const saved = await send("POST", "/api/gallery/photos", photoBody(photoDraft))
            if (saved) {
              setPhotoDraft(emptyPhoto(photoCategoryId))
              setUploadName("")
            }
          }}
        />

        {categories
          .flatMap((category) => category.photos.map((photo) => ({ category, photo })))
          .filter(({ category }) => !photoCategoryId || category.id === photoCategoryId)
          .map(({ category, photo }) => (
            <PhotoForm
              key={photo.id}
              draft={fromPhoto(category.id, photo)}
              pending={pending}
              uploadName={photo.file ? photo.file.split("/").pop() ?? "" : ""}
              submitLabel="Save photo"
              onUpload={async (file) => {
                const path = await uploadFile(file)
                return path
              }}
              onSubmit={async (draft) => {
                await send("PATCH", "/api/gallery/photos", { id: photo.id, ...photoBody(draft) })
              }}
              onDelete={async () => {
                if (!window.confirm("Delete this photo?")) return
                await send("DELETE", "/api/gallery/photos", { id: photo.id })
              }}
            />
          ))}
      </div>
    </section>
  )
}

function CategoryRecord({
  category,
  pending,
  onSave,
  onDelete,
}: {
  category: GalleryCategory
  pending: boolean
  onSave: (draft: CategoryDraft) => Promise<unknown>
  onDelete: () => Promise<void>
}) {
  const [draft, setDraft] = useState(() => fromCategory(category))

  return (
    <CategoryForm
      draft={draft}
      onChange={setDraft}
      pending={pending}
      submitLabel="Save category"
      onSubmit={() => onSave(draft)}
      onDelete={onDelete}
    />
  )
}

function CategoryForm({
  draft,
  onChange,
  onSubmit,
  pending,
  submitLabel,
  onDelete,
}: {
  draft: CategoryDraft
  onChange?: (draft: CategoryDraft) => void
  onSubmit: () => Promise<unknown>
  pending: boolean
  submitLabel: string
  onDelete?: () => Promise<void>
}) {
  const editable = Boolean(onChange)

  return (
    <form
      className="border-border flex flex-col gap-3 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit()
      }}
    >
      <CategoryFields draft={draft} onChange={onChange} disabled={pending || !editable} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {submitLabel}
        </Button>
        {onDelete ? (
          <Button type="button" variant="outline" disabled={pending} onClick={() => void onDelete()}>
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  )
}

function PhotoForm({
  draft: initialDraft,
  onChange,
  onSubmit,
  pending,
  submitLabel,
  uploadName,
  onUpload,
  onDelete,
}: {
  draft: PhotoDraft
  onChange?: (draft: PhotoDraft) => void
  onSubmit: (draft: PhotoDraft) => Promise<unknown>
  pending: boolean
  submitLabel: string
  uploadName: string
  onUpload: (file: File) => Promise<string>
  onDelete?: () => Promise<void>
}) {
  const [draft, setDraft] = useState(initialDraft)
  const fileInputId = useId()
  const editable = Boolean(onChange)

  function update(key: keyof PhotoDraft, value: string | boolean) {
    const next = { ...draft, [key]: value }
    setDraft(next)
    onChange?.(next)
  }

  return (
    <form
      className="border-border flex flex-col gap-3 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit(draft)
      }}
    >
      {draft.file ? (
        <div className="bg-muted relative aspect-video max-w-md overflow-hidden rounded-lg">
          <Image
            src={publicImageSrc(draft.file)}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      ) : null}
      <Field data-disabled={pending || undefined}>
        <FieldLabel htmlFor={fileInputId}>Image file</FieldLabel>
        <Input
          id={fileInputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={pending}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            void onUpload(file).then((path) => {
              if (path) update("file", path)
            })
          }}
        />
        {uploadName ? <p className="text-muted-foreground text-xs">{uploadName}</p> : null}
      </Field>
      <PhotoFields draft={draft} onChange={editable ? update : undefined} disabled={pending} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {submitLabel}
        </Button>
        {onDelete ? (
          <Button type="button" variant="outline" disabled={pending} onClick={() => void onDelete()}>
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  )
}

function CategoryFields({
  draft,
  onChange,
  disabled,
}: {
  draft: CategoryDraft
  onChange?: (draft: CategoryDraft) => void
  disabled: boolean
}) {
  function set(key: keyof CategoryDraft, value: string) {
    onChange?.({ ...draft, [key]: value })
  }

  return (
    <FieldGroup className="md:grid md:grid-cols-2">
      <TextField label="English title" value={draft.titleEn} onChange={(v) => set("titleEn", v)} required disabled={disabled} />
      <TextField label="Marathi title" value={draft.titleMr} onChange={(v) => set("titleMr", v)} disabled={disabled} />
      <TextAreaField
        label="English description"
        className="md:col-span-2"
        value={draft.descriptionEn}
        onChange={(v) => set("descriptionEn", v)}
        required
        disabled={disabled}
      />
      <TextAreaField
        label="Marathi description"
        className="md:col-span-2"
        value={draft.descriptionMr}
        onChange={(v) => set("descriptionMr", v)}
        disabled={disabled}
      />
      <TextField label="Sort" value={draft.sort} onChange={(v) => set("sort", v)} disabled={disabled} />
    </FieldGroup>
  )
}

function PhotoFields({
  draft,
  onChange,
  disabled,
}: {
  draft: PhotoDraft
  onChange?: (key: keyof PhotoDraft, value: string | boolean) => void
  disabled: boolean
}) {
  return (
    <FieldGroup className="md:grid md:grid-cols-2">
      <TextAreaField
        label="English caption"
        className="md:col-span-2"
        value={draft.captionEn}
        onChange={(v) => onChange?.("captionEn", v)}
        disabled={disabled}
      />
      <TextAreaField
        label="Marathi caption"
        className="md:col-span-2"
        value={draft.captionMr}
        onChange={(v) => onChange?.("captionMr", v)}
        disabled={disabled}
      />
      <Field data-disabled={disabled || undefined}>
        <FieldLabel htmlFor="gallery-wide">Wide layout on desktop</FieldLabel>
        <Select
          value={draft.wide ? "1" : "0"}
          onValueChange={(value) => onChange?.("wide", value === "1")}
          disabled={disabled}
        >
          <SelectTrigger id="gallery-wide">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Standard</SelectItem>
            <SelectItem value="1">Wide</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <TextField label="Sort" value={draft.sort} onChange={(v) => onChange?.("sort", v)} disabled={disabled} />
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
  onChange?: (value: string) => void
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
        disabled={disabled || !onChange}
        readOnly={!onChange}
        onChange={(event) => onChange?.(event.target.value)}
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
  onChange?: (value: string) => void
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
        disabled={disabled || !onChange}
        readOnly={!onChange}
        rows={3}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </Field>
  )
}

function categoryBody(draft: CategoryDraft) {
  return {
    titleEn: draft.titleEn,
    titleMr: draft.titleMr,
    descriptionEn: draft.descriptionEn,
    descriptionMr: draft.descriptionMr,
    sort: draft.sort,
  }
}

function photoBody(draft: PhotoDraft) {
  return {
    categoryId: draft.categoryId,
    file: draft.file,
    captionEn: draft.captionEn,
    captionMr: draft.captionMr,
    wide: draft.wide,
    sort: draft.sort,
  }
}

function fromCategory(category: GalleryCategory): CategoryDraft {
  return {
    titleEn: category.title.en,
    titleMr: category.title.mr,
    descriptionEn: category.description.en,
    descriptionMr: category.description.mr,
    sort: String(category.sort),
  }
}

function fromPhoto(categoryId: string, photo: GalleryCategory["photos"][number]): PhotoDraft {
  return {
    categoryId,
    captionEn: photo.caption.en,
    captionMr: photo.caption.mr,
    file: photo.file,
    wide: photo.wide,
    sort: String(photo.sort),
  }
}

function publicImageSrc(file: string) {
  return file.startsWith("/") ? file : `/${file}`
}
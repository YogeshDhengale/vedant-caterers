"use client"

import { type ReactNode, useEffect, useId, useState } from "react"
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
import type { MenuCategory, MenuItem } from "@/lib/menu-store"

type Draft = {
  nameEn: string
  nameHi: string
  nameMr: string
  descriptionEn: string
  descriptionHi: string
  descriptionMr: string
  categoryId: string
  sort: string
}

const emptyDraft: Draft = {
  nameEn: "",
  nameHi: "",
  nameMr: "",
  descriptionEn: "",
  descriptionHi: "",
  descriptionMr: "",
  categoryId: "",
  sort: "",
}

export function MenuEditor({
  categories,
  items,
  embedded = false,
}: {
  categories: MenuCategory[]
  items: MenuItem[]
  embedded?: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [categoryDraft, setCategoryDraft] = useState<Draft>(emptyDraft)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [dishCategoryId, setDishCategoryId] = useState(categories[0]?.id ?? "")
  const [itemDraft, setItemDraft] = useState<Draft>({
    ...emptyDraft,
    categoryId: categories[0]?.id ?? "",
  })

  useEffect(() => {
    if (!itemDraft.categoryId && categories[0]) {
      setItemDraft((current) => ({ ...current, categoryId: categories[0].id }))
    }
  }, [categories, itemDraft.categoryId])

  async function send(method: string, url: string, body: unknown) {
    setPending(true)
    setError("")
    const response = await fetch(url, {
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

  async function deleteCategory(id: string, name: string) {
    if (!window.confirm(`Delete “${name}” and its dishes?`)) return false
    const removed = await send("DELETE", "/api/menu/categories", { id })
    if (removed && editingCategoryId === id) setEditingCategoryId(null)
    if (removed && dishCategoryId === id) {
      setDishCategoryId(categories.find((category) => category.id !== id)?.id ?? "")
    }
    return removed
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.refresh()
  }

  const shellClassName = embedded
    ? "flex flex-col gap-12"
    : "  text-foreground mx-auto flex max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6"

  return (
    <EditorShell embedded={embedded} className={shellClassName}>
      {embedded ? (
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-primary-foreground text-2xl font-normal">Menu</h2>
          <p className="text-muted-foreground text-sm">
            Changes are saved to data/menu.csv and appear on the menu page immediately.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-primary-foreground text-3xl font-normal">Menu admin</h1>
            <p className="text-muted-foreground text-sm">
              Changes are saved to data/menu.csv and appear on the menu page immediately.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>
      )}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-primary-foreground text-2xl font-normal">Categories</h2>
        <DraftForm
          draft={categoryDraft}
          onChange={setCategoryDraft}
          pending={pending}
          submitLabel="Add category"
          onSubmit={async () => {
            const saved = await send("POST", "/api/menu/categories", names(categoryDraft))
            if (saved) setCategoryDraft(emptyDraft)
          }}
        />
        <div className="flex max-h-[32rem] flex-col gap-3 overflow-y-auto">
          {categories.map((category) =>
            editingCategoryId === category.id ? (
              <RecordEditor
                key={category.id}
                title={category.name.en}
                draft={fromCategory(category)}
                pending={pending}
                onSave={async (draft) => {
                  const saved = await send("PATCH", "/api/menu/categories", {
                    id: category.id,
                    ...names(draft),
                    sort: draft.sort,
                  })
                  if (saved) setEditingCategoryId(null)
                  return saved
                }}
                onDelete={() => deleteCategory(category.id, category.name.en)}
              />
            ) : (
              <div key={category.id} className="border-border flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                <p className="min-w-0 font-medium">{category.name.en}</p>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="outline" disabled={pending} onClick={() => setEditingCategoryId(category.id)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() => void deleteCategory(category.id, category.name.en)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-primary-foreground text-2xl font-normal">Dishes</h2>
        <DraftForm
          draft={itemDraft}
          onChange={setItemDraft}
          pending={pending}
          categories={categories}
          includeDescription
          submitLabel="Add dish"
          onSubmit={async () => {
            const saved = await send("POST", "/api/menu/items", itemBody(itemDraft))
            if (saved) setItemDraft({ ...emptyDraft, categoryId: categories[0]?.id ?? "" })
          }}
        />
        <Field>
          <FieldLabel htmlFor="dish-category-filter">Show dishes in</FieldLabel>
          <Select value={dishCategoryId || undefined} onValueChange={setDishCategoryId}>
            <SelectTrigger id="dish-category-filter" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name.en}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <div className="flex flex-col gap-3">
          {items
            .filter((item) => item.categoryId === dishCategoryId)
            .map((item) => (
            <RecordEditor
              key={item.id}
              title={item.name.en}
              draft={fromItem(item)}
              categories={categories}
              includeDescription
              pending={pending}
              onSave={(draft) => send("PATCH", "/api/menu/items", { id: item.id, ...itemBody(draft) })}
              onDelete={() => {
                if (window.confirm(`Delete “${item.name.en}”?`)) {
                  return send("DELETE", "/api/menu/items", { id: item.id })
                }
                return Promise.resolve(false)
              }}
            />
          ))}
        </div>
      </section>
    </EditorShell>
  )
}

function EditorShell({
  embedded,
  className,
  children,
}: {
  embedded: boolean
  className: string
  children: ReactNode
}) {
  if (embedded) return <div className={className}>{children}</div>
  return <main className={className}>{children}</main>
}

function DraftForm({
  draft,
  onChange,
  onSubmit,
  pending,
  submitLabel,
  categories,
  includeDescription = false,
}: {
  draft: Draft
  onChange: (draft: Draft) => void
  onSubmit: () => Promise<void>
  pending: boolean
  submitLabel: string
  categories?: MenuCategory[]
  includeDescription?: boolean
}) {
  return (
    <form
      className="  border border-border flex flex-col gap-3 rounded-xl p-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit()
      }}
    >
      <Fields
        draft={draft}
        onChange={onChange}
        categories={categories}
        includeDescription={includeDescription}
        disabled={pending}
      />
      <Button type="submit" disabled={pending} className="self-start">
        {submitLabel}
      </Button>
    </form>
  )
}

function RecordEditor({
  title,
  draft,
  categories,
  includeDescription = false,
  pending,
  onSave,
  onDelete,
}: {
  title: string
  draft: Draft
  categories?: MenuCategory[]
  includeDescription?: boolean
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
      <Fields
        draft={value}
        onChange={setValue}
        categories={categories}
        includeDescription={includeDescription}
        disabled={pending}
      />
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
  categories,
  includeDescription,
  disabled,
}: {
  draft: Draft
  onChange: (draft: Draft) => void
  categories?: MenuCategory[]
  includeDescription: boolean
  disabled: boolean
}) {
  const categoryFieldId = useId()

  function set(key: keyof Draft, value: string) {
    onChange({ ...draft, [key]: value })
  }

  return (
    <FieldGroup className="md:grid md:grid-cols-3">
      {categories ? (
        <Field className="md:col-span-3" data-disabled={disabled || undefined}>
          <FieldLabel htmlFor={categoryFieldId}>Category</FieldLabel>
          <Select
            value={draft.categoryId || undefined}
            onValueChange={(value) => set("categoryId", value)}
            disabled={disabled}
          >
            <SelectTrigger id={categoryFieldId} className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name.en}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      ) : null}
      <TextField label="English name" value={draft.nameEn} onChange={(value) => set("nameEn", value)} required disabled={disabled} />
      <TextField label="Hindi name" value={draft.nameHi} onChange={(value) => set("nameHi", value)} disabled={disabled} />
      <TextField label="Marathi name" value={draft.nameMr} onChange={(value) => set("nameMr", value)} disabled={disabled} />
      {includeDescription ? (
        <>
          <TextField
            label="English description"
            value={draft.descriptionEn}
            onChange={(value) => set("descriptionEn", value)}
            disabled={disabled}
          />
          <TextField
            label="Hindi description"
            value={draft.descriptionHi}
            onChange={(value) => set("descriptionHi", value)}
            disabled={disabled}
          />
          <TextField
            label="Marathi description"
            value={draft.descriptionMr}
            onChange={(value) => set("descriptionMr", value)}
            disabled={disabled}
          />
        </>
      ) : null}
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

function names(draft: Draft) {
  return {
    nameEn: draft.nameEn,
    nameHi: draft.nameHi,
    nameMr: draft.nameMr,
    sort: draft.sort,
  }
}

function itemBody(draft: Draft) {
  return {
    ...names(draft),
    categoryId: draft.categoryId,
    descriptionEn: draft.descriptionEn,
    descriptionHi: draft.descriptionHi,
    descriptionMr: draft.descriptionMr,
  }
}

function fromCategory(category: MenuCategory): Draft {
  return {
    ...emptyDraft,
    nameEn: category.name.en,
    nameHi: category.name.hi,
    nameMr: category.name.mr,
    sort: String(category.sort),
  }
}

function fromItem(item: MenuItem): Draft {
  return {
    nameEn: item.name.en,
    nameHi: item.name.hi,
    nameMr: item.name.mr,
    descriptionEn: item.description.en,
    descriptionHi: item.description.hi,
    descriptionMr: item.description.mr,
    categoryId: item.categoryId,
    sort: String(item.sort),
  }
}

import { NextResponse } from "next/server"

import { isAdmin } from "@/lib/admin-session"
import { addCategory, deleteCategory, MenuError, updateCategory } from "@/lib/menu-store"

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const body = await readBody(request)
    const category = await addCategory({
      name: localized(body, "name"),
      sort: optionalSort(body.sort),
    })
    return NextResponse.json({ ok: true, category })
  } catch (error) {
    return failure(error)
  }
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const body = await readBody(request)
    const id = requiredId(body.id)
    const category = await updateCategory(id, {
      name: localized(body, "name"),
      sort: optionalSort(body.sort),
    })
    return NextResponse.json({ ok: true, category })
  } catch (error) {
    return failure(error)
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const body = await readBody(request)
    await deleteCategory(requiredId(body.id))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return failure(error)
  }
}

async function requireAdmin() {
  if (await isAdmin()) return null
  return NextResponse.json({ ok: false, errors: ["Sign in required."] }, { status: 401 })
}

async function readBody(request: Request) {
  const body: unknown = await request.json()
  if (!body || typeof body !== "object") throw new MenuError("Invalid request.")
  return body as Record<string, unknown>
}

function localized(body: Record<string, unknown>, prefix: string) {
  return {
    en: text(body[`${prefix}En`]),
    hi: text(body[`${prefix}Hi`]),
    mr: text(body[`${prefix}Mr`]),
  }
}

function text(value: unknown) {
  return typeof value === "string" ? value : ""
}

function requiredId(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new MenuError("A record id is required.")
  }
  return value
}

function optionalSort(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined
  const sort = Number(value)
  if (!Number.isFinite(sort)) throw new MenuError("Sort must be a number.")
  return sort
}

function failure(error: unknown) {
  const message = error instanceof MenuError ? error.message : "Could not save the menu."
  return NextResponse.json({ ok: false, errors: [message] }, { status: 400 })
}

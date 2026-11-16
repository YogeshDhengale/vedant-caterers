import { NextResponse } from "next/server"

import { isAdmin } from "@/lib/admin-session"
import {
  addGalleryPhoto,
  deleteGalleryPhoto,
  GalleryError,
  updateGalleryPhoto,
} from "@/lib/gallery-store"

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const body = await readBody(request)
    const photo = await addGalleryPhoto(photoInput(body))
    return NextResponse.json({ ok: true, photo })
  } catch (error) {
    return failure(error)
  }
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const body = await readBody(request)
    const photo = await updateGalleryPhoto(requiredId(body.id), photoInput(body))
    return NextResponse.json({ ok: true, photo })
  } catch (error) {
    return failure(error)
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const body = await readBody(request)
    await deleteGalleryPhoto(requiredId(body.id))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return failure(error)
  }
}

function photoInput(body: Record<string, unknown>) {
  const categoryId = body.categoryId
  if (typeof categoryId !== "string" || categoryId.trim().length === 0) {
    throw new GalleryError("Choose a category.")
  }
  return {
    categoryId,
    file: text(body.file),
    caption: { en: text(body.captionEn), mr: text(body.captionMr) },
    wide: body.wide === true || body.wide === "1" || body.wide === 1,
    sort: optionalSort(body.sort),
  }
}

async function requireAdmin() {
  if (await isAdmin()) return null
  return NextResponse.json({ ok: false, errors: ["Sign in required."] }, { status: 401 })
}

async function readBody(request: Request) {
  const body: unknown = await request.json()
  if (!body || typeof body !== "object") throw new GalleryError("Invalid request.")
  return body as Record<string, unknown>
}

function text(value: unknown) {
  return typeof value === "string" ? value : ""
}

function requiredId(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GalleryError("A record id is required.")
  }
  return value
}

function optionalSort(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined
  const sort = Number(value)
  if (!Number.isFinite(sort)) throw new GalleryError("Sort must be a number.")
  return sort
}

function failure(error: unknown) {
  const message = error instanceof GalleryError ? error.message : "Could not save the gallery."
  return NextResponse.json({ ok: false, errors: [message] }, { status: 400 })
}
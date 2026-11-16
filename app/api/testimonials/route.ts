import { NextResponse } from "next/server"

import { isAdmin } from "@/lib/admin-session"
import {
  addTestimonial,
  deleteTestimonial,
  readTestimonials,
  TestimonialError,
  updateTestimonial,
} from "@/lib/testimonials-store"

export async function GET() {
  const testimonials = await readTestimonials()
  return Response.json(
    { ok: true, testimonials },
    { headers: { "cache-control": "no-store" } }
  )
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const body = await readBody(request)
    const testimonial = await addTestimonial(testimonialInput(body))
    return NextResponse.json({ ok: true, testimonial })
  } catch (error) {
    return failure(error)
  }
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const body = await readBody(request)
    const testimonial = await updateTestimonial(requiredId(body.id), testimonialInput(body))
    return NextResponse.json({ ok: true, testimonial })
  } catch (error) {
    return failure(error)
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const body = await readBody(request)
    await deleteTestimonial(requiredId(body.id))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return failure(error)
  }
}

function testimonialInput(body: Record<string, unknown>) {
  return {
    quote: { en: text(body.quoteEn), mr: text(body.quoteMr) },
    name: { en: text(body.nameEn), mr: text(body.nameMr) },
    detail: { en: text(body.detailEn), mr: text(body.detailMr) },
    sort: optionalSort(body.sort),
  }
}

async function requireAdmin() {
  if (await isAdmin()) return null
  return NextResponse.json({ ok: false, errors: ["Sign in required."] }, { status: 401 })
}

async function readBody(request: Request) {
  const body: unknown = await request.json()
  if (!body || typeof body !== "object") throw new TestimonialError("Invalid request.")
  return body as Record<string, unknown>
}

function text(value: unknown) {
  return typeof value === "string" ? value : ""
}

function requiredId(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TestimonialError("A record id is required.")
  }
  return value
}

function optionalSort(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined
  const sort = Number(value)
  if (!Number.isFinite(sort)) throw new TestimonialError("Sort must be a number.")
  return sort
}

function failure(error: unknown) {
  const message = error instanceof TestimonialError ? error.message : "Could not save the testimonial."
  return NextResponse.json({ ok: false, errors: [message] }, { status: 400 })
}
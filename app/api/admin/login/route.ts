import { timingSafeEqual } from "node:crypto"

import { NextResponse } from "next/server"

import {
  adminConfigured,
  adminCookieName,
  adminPassword,
  allowLoginAttempt,
  clearLoginAttempts,
  sessionToken,
} from "@/lib/admin-session"

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { ok: false, errors: ["Set ADMIN_PASSWORD before signing in."] },
      { status: 503 }
    )
  }

  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  if (!allowLoginAttempt(address)) {
    return NextResponse.json(
      { ok: false, errors: ["Too many attempts. Try again in a few minutes."] },
      { status: 429 }
    )
  }

  const body: unknown = await request.json().catch(() => null)
  const password =
    body && typeof body === "object" && "password" in body && typeof body.password === "string"
      ? body.password
      : ""

  if (!passwordsMatch(password)) {
    return NextResponse.json({ ok: false, errors: ["Password is incorrect."] }, { status: 401 })
  }

  clearLoginAttempts(address)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(adminCookieName, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}

function passwordsMatch(input: string) {
  const expected = Buffer.from(adminPassword())
  const actual = Buffer.from(input)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}

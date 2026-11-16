import { createHmac, timingSafeEqual } from "node:crypto"

import { cookies } from "next/headers"

export const adminCookieName = "vedant_admin"

const attempts = new Map<string, { count: number; resetAt: number }>()

export function adminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? ""
}

export function adminConfigured() {
  return adminPassword().length > 0
}

export function sessionToken() {
  return createHmac("sha256", adminPassword()).update("vedant-admin-session").digest("hex")
}

export function isValidSession(value: string | undefined) {
  if (!adminConfigured() || !value) return false
  const expected = sessionToken()
  const actual = Buffer.from(value)
  const wanted = Buffer.from(expected)
  if (actual.length !== wanted.length) return false
  return timingSafeEqual(actual, wanted)
}

export async function isAdmin() {
  const jar = await cookies()
  return isValidSession(jar.get(adminCookieName)?.value)
}

export function allowLoginAttempt(key: string) {
  const now = Date.now()
  const current = attempts.get(key)
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return true
  }
  if (current.count >= 8) return false
  current.count += 1
  return true
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key)
}
